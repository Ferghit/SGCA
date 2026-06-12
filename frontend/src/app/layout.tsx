import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SGCA - Sistema de Gestion de Compras y Aprovisionamiento',
  description: 'Sistema academico UNT - Ingenieria de Sistemas VII',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
