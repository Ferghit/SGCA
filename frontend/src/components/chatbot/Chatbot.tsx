'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot, ChevronDown, Loader2, MessageCircle, Mic, MicOff,
  RotateCcw, Send, Sparkles, Square, Volume2, X,
} from 'lucide-react';
import { chatbotApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type MessageRole = 'user' | 'assistant';
interface ChatMessage { id: string; role: MessageRole; content: string; }
interface SpeechRecognitionResultEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorEvent extends Event { error: string; }
interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const LEGACY_STORAGE_KEY = 'sgca-chat-history';
const STORAGE_KEY_PREFIX = 'sgca-chat-history';
const ACTIVE_IDENTITY_KEY = 'sgca-chat-active-identity';
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy **SGCA Asistente**. Puedo orientarte sobre requerimientos, cotizaciones, órdenes de compra, inventario, facturas y pagos.\n\n¿En qué proceso necesitas ayuda?',
};
const SUGGESTED_QUESTIONS = [
  [
    '¿Cómo funciona el proceso de compra?',
    '¿Qué significa cada estado?',
    '¿Qué puedo hacer con mi rol?',
  ],
  [
    '¿Cómo creo un requerimiento?',
    '¿Quién debe aprobar cada solicitud?',
    '¿Cómo consulto mis notificaciones?',
  ],
  [
    '¿Cómo se evalúan las cotizaciones?',
    '¿Cuándo se genera una orden de compra?',
    '¿Qué hago si una solicitud es rechazada?',
  ],
  [
    '¿Cómo se registra una recepción?',
    '¿Dónde reviso el inventario?',
    '¿Cómo funciona el proceso de pago?',
  ],
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1');
}

function InlineText({ text }: { text: string }) {
  return <>{text.split(/(\*\*.*?\*\*)/g).map((piece, index) =>
    piece.startsWith('**') && piece.endsWith('**') ? (
      <strong key={`${piece}-${index}`} className="font-semibold text-current">{piece.slice(2, -2)}</strong>
    ) : <span key={`${piece}-${index}`}>{piece}</span>,
  )}</>;
}

function FormattedMessage({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      {content.split('\n').map((line, index) => {
        const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
        const bullet = line.match(/^\s*[-*]\s+(.*)$/);
        if (!line.trim()) return <div key={index} className="h-0.5" />;
        if (numbered) return (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary-50 px-1 text-[10px] font-bold text-secondary-700">{numbered[1]}</span>
            <span><InlineText text={numbered[2]} /></span>
          </div>
        );
        if (bullet) return (
          <div key={index} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-secondary" />
            <span><InlineText text={bullet[1]} /></span>
          </div>
        );
        return <p key={index}><InlineText text={line} /></p>;
      })}
    </div>
  );
}

export default function Chatbot() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const identity = user ? `${user.id}:${user.rol}` : 'anonymous';
  const storageKey = `${STORAGE_KEY_PREFIX}:${identity}`;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const speechRecognitionSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const userMessageCount = messages.filter((message) => message.role === 'user').length;
  const suggestedQuestions = SUGGESTED_QUESTIONS[userMessageCount % SUGGESTED_QUESTIONS.length];
  const canShowSuggestions = !isLoading && messages.at(-1)?.role === 'assistant';

  useEffect(() => {
    try {
      const previousIdentity = sessionStorage.getItem(ACTIVE_IDENTITY_KEY);
      const identityChanged = Boolean(previousIdentity && previousIdentity !== identity);

      // El historial antiguo no estaba aislado por usuario y no debe reutilizarse.
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);

      if (identityChanged) {
        sessionStorage.removeItem(storageKey);
        setMessages([WELCOME_MESSAGE]);
        setInput('');
        setError('');
        window.speechSynthesis?.cancel();
        setSpeakingId(null);
      } else {
        const stored = sessionStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) as ChatMessage[] : null;
        if (Array.isArray(parsed) && parsed.every((item) =>
          typeof item?.id === 'string' && ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string',
        )) {
          setMessages(parsed.slice(-30));
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      }

      sessionStorage.setItem(ACTIVE_IDENTITY_KEY, identity);
    } catch {
      sessionStorage.removeItem(storageKey);
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [identity, storageKey]);

  useEffect(() => {
    if (loadedStorageKey === storageKey) {
      sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    }
  }, [loadedStorageKey, messages, storageKey]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages, isLoading]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  const sendMessage = async (text = input) => {
    const cleanMessage = text.trim();
    if (!cleanMessage || isLoading) return;
    const history = messages.filter((message) => message.id !== 'welcome').slice(-10)
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { id: createId(), role: 'user', content: cleanMessage }]);
    setInput('');
    setError('');
    setIsLoading(true);
    try {
      const { reply } = await chatbotApi.chat({ message: cleanMessage, history, currentPath: pathname });
      setMessages((current) => [...current, { id: createId(), role: 'assistant', content: reply }]);
    } catch (requestError: unknown) {
      const response = (requestError as { response?: { data?: { message?: string | string[] } } })?.response;
      const apiMessage = response?.data?.message;
      setError(Array.isArray(apiMessage) ? apiMessage[0] : apiMessage || 'No pude responder en este momento. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); void sendMessage(); };
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  };

  const toggleListening = () => {
    setError('');
    if (isListening) { recognitionRef.current?.stop(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('El dictado por voz no está disponible en este navegador.'); return; }
    const recognition = new Recognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setInput((current) => `${current}${current ? ' ' : ''}${transcript}`.slice(0, 2000));
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError(event.error === 'not-allowed'
        ? 'Permite el acceso al micrófono para usar el dictado.'
        : 'No pude reconocer tu voz. Intenta nuevamente.');
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); }
    catch { setError('No se pudo iniciar el micrófono. Intenta nuevamente.'); }
  };

  const toggleSpeech = (message: ChatMessage) => {
    if (!speechSynthesisSupported) { setError('La lectura en voz alta no está disponible en este navegador.'); return; }
    window.speechSynthesis.cancel();
    if (speakingId === message.id) { setSpeakingId(null); return; }
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(message.content));
    utterance.lang = 'es-PE';
    utterance.rate = 0.96;
    const spanishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const clearConversation = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section aria-label="Asistente virtual del SGCA" className="mb-3 flex h-[min(680px,calc(100vh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_rgba(27,38,59,0.25)] sm:w-[410px]">
          <header className="flex items-center justify-between bg-primary px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-secondary">
                <Bot className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-primary bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5"><h2 className="truncate text-sm font-semibold">SGCA Asistente</h2><Sparkles className="h-3.5 w-3.5 text-accent" /></div>
                <p className="text-xs text-white/65">Orientación para tus procesos</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={clearConversation} className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50" title="Nueva conversación" aria-label="Borrar conversación"><RotateCcw className="h-4 w-4" /></button>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50" title="Minimizar" aria-label="Minimizar asistente"><ChevronDown className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F7F8FA] px-4 py-4" aria-live="polite">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <div className="mb-6 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-secondary text-white shadow-sm"><Bot className="h-4 w-4" /></div>}
                  <div className={`max-w-[82%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                    <div className={`rounded-2xl px-3.5 py-3 text-[13px] leading-5 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-gray-100 bg-white text-gray-700'}`}>
                      <FormattedMessage content={message.content} />
                    </div>
                    {message.role === 'assistant' && (
                      <button type="button" onClick={() => toggleSpeech(message)} disabled={!speechSynthesisSupported} className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-200 hover:text-secondary-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label={speakingId === message.id ? 'Detener lectura' : 'Escuchar respuesta'}>
                        {speakingId === message.id ? <Square className="h-3 w-3 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
                        {speakingId === message.id ? 'Detener' : 'Escuchar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {canShowSuggestions && (
                <div className="ml-9 rounded-xl border border-secondary-100 bg-secondary-50/60 p-2.5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-secondary-700">
                    También puedes preguntar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question) => (
                      <button key={question} type="button" onClick={() => void sendMessage(question)} className="rounded-full border border-secondary-200 bg-white px-3 py-1.5 text-left text-[11px] font-medium text-secondary-800 shadow-sm transition-colors hover:border-secondary-400 hover:bg-secondary-100">
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isLoading && <div className="flex items-end gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-white"><Bot className="h-4 w-4" /></div><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500 shadow-sm"><Loader2 className="h-4 w-4 animate-spin text-secondary" />Preparando una respuesta clara...</div></div>}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="border-t border-gray-100 bg-white p-3">
            {error && <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Cerrar error"><X className="h-3.5 w-3.5" /></button></div>}
            <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-1.5 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary-50">
              <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value.slice(0, 2000))} onKeyDown={handleKeyDown} placeholder="Escribe o dicta tu consulta..." rows={2} maxLength={2000} disabled={isLoading} className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-2 py-1.5 text-sm text-primary outline-none placeholder:text-gray-400 disabled:opacity-60" aria-label="Mensaje para el asistente" />
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={toggleListening} disabled={!speechRecognitionSupported || isLoading} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-200 disabled:cursor-not-allowed disabled:opacity-40 ${isListening ? 'animate-pulse bg-red-100 text-red-600' : 'text-gray-500 hover:bg-gray-200 hover:text-secondary-700'}`} title={speechRecognitionSupported ? isListening ? 'Detener dictado' : 'Dictar mensaje' : 'Dictado no disponible en este navegador'} aria-label={isListening ? 'Detener dictado' : 'Dictar mensaje'}>{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                  {isListening ? <span className="text-[10px] font-medium text-red-600">Escuchando...</span> : <span className="text-[10px] text-gray-400">{input.length}/2000</span>}
                </div>
                <button type="submit" disabled={!input.trim() || isLoading} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-white shadow-sm transition-colors hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-300" aria-label="Enviar mensaje">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
              </div>
            </form>
            <p className="mt-2 text-center text-[10px] leading-4 text-gray-400">La IA puede equivocarse. Verifica la información importante.</p>
          </footer>
        </section>
      )}

      <button type="button" onClick={() => setIsOpen((current) => !current)} className={`ml-auto flex items-center justify-center bg-secondary text-white shadow-[0_10px_30px_rgba(0,109,119,0.35)] transition-all hover:-translate-y-0.5 hover:bg-secondary-700 focus:outline-none focus:ring-4 focus:ring-secondary-100 ${isOpen ? 'h-12 w-12 rounded-full' : 'h-14 gap-2 rounded-2xl px-4'}`} aria-expanded={isOpen} aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente virtual'}>
        {isOpen ? <X className="h-5 w-5" /> : <><span className="relative"><MessageCircle className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-secondary bg-accent" /></span><span className="text-sm font-semibold">Asistente SGCA</span></>}
      </button>
    </div>
  );
}
