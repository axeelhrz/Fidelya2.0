import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ClientLayout } from './ClientLayout';

// Configuración optimizada de fuentes
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: true,
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: false, // Solo se carga cuando se necesita
});

export const metadata: Metadata = {
  title: 'Fidelya - Sistema de Gestión de Socios y Beneficios',
  description: 'La plataforma que conecta asociaciones, socios y comercios en un ecosistema inteligente de beneficios y fidelización.',
  keywords: ['fidelidad', 'socios', 'comercios', 'beneficios', 'gestión', 'asociaciones', 'QR', 'validación'],
  authors: [{ name: 'Fidelya Team' }],
  openGraph: {
    title: 'Fidelya - Sistema de Gestión de Socios y Beneficios',
    description: 'La plataforma que conecta asociaciones, socios y comercios en un ecosistema inteligente de beneficios y fidelización.',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fidelya - Sistema de Gestión de Socios y Beneficios',
    description: 'La plataforma que conecta asociaciones, socios y comercios en un ecosistema inteligente de beneficios y fidelización.',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} ${plusJakarta.variable} ${playfair.variable} font-sans antialiased`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}