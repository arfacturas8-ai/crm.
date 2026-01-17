import type { Metadata, Viewport } from 'next';
import { ApolloWrapper } from '@/lib/apollo-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'CRM - Sistema de Gestión de Clientes',
  description: 'Sistema CRM para gestión de leads, deals y propiedades inmobiliarias',
  keywords: ['CRM', 'inmobiliaria', 'leads', 'deals', 'propiedades'],
  authors: [{ name: 'CRM Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
