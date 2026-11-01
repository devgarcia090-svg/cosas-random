import type { Metadata, Viewport } from 'next';
import { NEGOCIO } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: `Tarjeta de fidelidad · ${NEGOCIO.nombre}`,
  description: `${NEGOCIO.sellosPremio} cortes y el siguiente al 50 %.`,
  robots: { index: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: NEGOCIO.colores.fondo,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto flex min-h-full max-w-md flex-col px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
