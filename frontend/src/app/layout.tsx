import type { Metadata, Viewport } from 'next';
import { ApolloWrapper } from '@/lib/apollo-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'HabitaCR - CRM Inmobiliario',
  description: 'Sistema CRM para gestión de leads, deals y propiedades inmobiliarias de HabitaCR',
  keywords: ['CRM', 'inmobiliaria', 'leads', 'deals', 'propiedades', 'HabitaCR', 'Costa Rica'],
  authors: [{ name: 'HabitaCR' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/images/habita-logo.jpg',
    apple: '/images/habita-logo.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B4513' },
    { media: '(prefers-color-scheme: dark)', color: '#8B4513' },
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
