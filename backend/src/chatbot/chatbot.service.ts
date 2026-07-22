import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDto } from './dto/chat.dto';

interface GroqResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {}

  async chat(dto: ChatDto, user: { id: number; rol: string }) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const model =
      this.configService.get<string>('GROQ_MODEL') ||
      'llama-3.3-70b-versatile';

    if (!apiKey || apiKey === 'apikey') {
      throw new ServiceUnavailableException(
        'El asistente aún no está configurado. Reemplaza GROQ_API_KEY en backend/.env.',
      );
    }

    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException('Escribe una consulta antes de enviarla.');
    }

    const history = (dto.history || [])
      .filter((item) => item.content.trim())
      .slice(-10)
      .map((item) => ({
        role: item.role,
        content: item.content.trim(),
      }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.25,
          max_completion_tokens: 900,
          user: String(user.id),
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(user.rol, dto.currentPath),
            },
            ...history,
            { role: 'user', content: message },
          ],
        }),
      });

      const data = (await response.json().catch(() => ({}))) as GroqResponse;

      if (!response.ok) {
        this.logger.warn(
          `Groq respondió ${response.status}: ${data.error?.message || 'sin detalle'}`,
        );
        if (response.status === 429) {
          throw new HttpException(
            'El asistente está recibiendo muchas consultas. Intenta nuevamente en unos segundos.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new ServiceUnavailableException(
            'La clave de Groq no es válida. Revisa GROQ_API_KEY en backend/.env.',
          );
        }
        throw new BadGatewayException(
          'Groq no pudo procesar la consulta en este momento.',
        );
      }

      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        throw new BadGatewayException(
          'El asistente devolvió una respuesta vacía. Intenta reformular la consulta.',
        );
      }

      return { reply, model };
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof ServiceUnavailableException ||
        (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS)
      ) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'La respuesta tardó demasiado. Intenta nuevamente.',
        );
      }

      this.logger.error(
        'No se pudo conectar con Groq',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'No se pudo conectar con el asistente. Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private getSystemPrompt(role: string, currentPath?: string) {
    const roleGuidance: Record<string, string> = {
      ADMIN: 'gestión de usuarios, configuración y supervisión general',
      TRABAJADOR: 'creación, corrección y seguimiento de requerimientos',
      JEFE_AREA: 'revisión y aprobación de requerimientos del área',
      ANALISTA_COMPRAS:
        'solicitudes de cotización, evaluación de ofertas y órdenes de compra',
      GERENTE: 'aprobación gerencial de requerimientos y órdenes de compra',
      PROVEEDOR: 'presentación de ofertas y seguimiento de órdenes adjudicadas',
      ENCARGADO_ALMACEN:
        'recepciones, devoluciones, inventario y control de stock',
      CONTADOR: 'facturas, validación documental, pagos e incidencias',
    };

    return `Eres SGCA Asistente, el asistente virtual del Sistema de Gestión de Compras y Aprovisionamiento de la Universidad Nacional de Trujillo.

Tu objetivo es orientar al usuario dentro del sistema y explicar con claridad los procesos de compras. El rol actual es ${role}; prioriza ayuda sobre ${roleGuidance[role] || 'el uso general del sistema'}. La pantalla actual es ${currentPath || '/dashboard'}.

El flujo principal es: requerimiento -> aprobación del jefe -> aprobación gerencial cuando corresponde -> solicitud de cotización -> ofertas de proveedores -> selección -> orden de compra -> aprobación -> recepción e inventario -> factura -> pago. Los módulos visibles dependen del rol.

Reglas obligatorias:
- Responde siempre en español, de forma breve, clara y cordial.
- Usa párrafos cortos y listas numeradas cuando expliques pasos.
- Destaca términos importantes con **negrita**, sin abusar.
- No inventes registros, montos, estados, permisos ni acciones realizadas.
- No tienes acceso directo a los datos que aparecen en pantalla ni puedes modificar el sistema. Si preguntan por datos concretos, explica dónde consultarlos o pide que compartan el código/estado visible.
- No solicites contraseñas, tokens, claves API ni datos bancarios.
- Si una acción no corresponde al rol actual, indícalo y menciona el rol responsable.
- Si la pregunta no se relaciona con SGCA, compras, inventario, proveedores, facturación o uso del sistema, redirige amablemente al ámbito del SGCA.
- No digas que una operación quedó registrada, aprobada, pagada o enviada; solo orientas.`;
  }
}
