
'use client';

import { useViewport } from '@/hooks/use-viewport';
import { ConversacionMobile } from './ConversacionMobile';
import { ConversacionTablet } from './ConversacionTablet';
import { ConversacionDesktop } from './ConversacionDesktop';

/**
 * @summary Despachador de vista para el módulo Conversación.
 * Arquitectura Adaptativa Senior (Viewport-Driven).
 */
export default function ConversacionPage() {
  const { isMobile, isTablet, isDesktop, mounted } = useViewport();

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      {/* BACKGROUND IMAGE - Faint */}
      <div className="absolute inset-0 z-0 bg-[url('/images/kitty-globe.png')] bg-cover bg-center opacity-5 pointer-events-none" />
      
      {/* GRADIENT OVERLAYS */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/40 via-transparent to-background/90 pointer-events-none" />
      
      <div className="relative z-10 w-full h-full">
        {isDesktop && <ConversacionDesktop />}
        {isTablet && <ConversacionTablet />}
        {!isDesktop && !isTablet && <ConversacionMobile />}
      </div>
    </main>
  );
}
