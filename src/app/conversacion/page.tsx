
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

  if (isDesktop) return <ConversacionDesktop />;
  if (isTablet) return <ConversacionTablet />;
  return <ConversacionMobile />;
}
