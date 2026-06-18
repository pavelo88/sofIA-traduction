import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { BottomNav } from '@/components/layout/bottom-nav';

/**
 * RootLayout: Estructura base de SoftIA.
 * Forzamos una actualización de renderizado para sincronizar variables de entorno (Ref: EnvSync_v2).
 */

export const metadata: Metadata = {
  title: 'SoftIA Translate | AR Spatial Learning',
  description: 'Sistema de traducción AR y tutor de aprendizaje con inteligencia artificial espacial.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden pb-24">
        <FirebaseClientProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <BottomNav />
          <FirebaseErrorListener />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
