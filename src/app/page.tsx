
"use client";

import { useState, useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Camera, 
  BookOpen, 
  Mic, 
  BarChart3, 
  Send, 
  Sparkles,
  Zap,
  Activity,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Home() {
  const { learningProgress, thermalTemperature } = useStore();
  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Función para conectar con Gemini a través de Genkit
  // Esta función envía el mensaje al flujo 'aiTutorConversation' que ya está configurado
  // para actuar como un gatito profesor amable.
  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');

    try {
      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] // Podríamos persistir el historial aquí si fuera necesario
      });
      
      setKittenResponse(result.response);
    } catch (error) {
      setKittenResponse("Miau... algo salió mal en la nube. ¡Inténtalo de nuevo!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center">
      {/* 1. ESTRUCTURA VISUAL (SIMULADOR DE CÁMARA AR) */}
      <div className="absolute inset-0 z-0">
        {/* Fondo con degradado profundo y efecto de grano */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `url('https://picsum.photos/seed/bg-noise/1920/1080')`, backgroundSize: 'cover', mixBlendMode: 'overlay' }} 
        />
        {/* Línea de escaneo animada (definida en globals.css) */}
        <div className="ar-scanner absolute inset-0 opacity-10 pointer-events-none" />
      </div>

      <SidebarNav />

      {/* HUD SUPERIOR: Kitten Assistant */}
      <header className="relative z-20 w-full max-w-4xl pt-8 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="glass-panel p-6 rounded-[2.5rem] w-full flex items-center gap-6 border-white/10 shadow-primary/20 shadow-2xl">
          {/* Avatar del Gatito */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-4xl">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background flex items-center justify-center" />
          </div>

          {/* Globo de texto y Input */}
          <div className="flex-1 space-y-3">
            <div className="text-sm font-medium text-white/90 leading-relaxed italic">
              "{kittenResponse}"
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKittenChat()}
                placeholder="Escribe a Kitten..."
                className="bg-white/5 border-white/10 h-10 rounded-xl text-xs focus-visible:ring-primary"
              />
              <Button 
                onClick={handleKittenChat}
                disabled={isLoading}
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 squish-effect"
              >
                {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores de Sistema (HUD) */}
        <div className="flex gap-4 mt-6">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Activity className="w-3 h-3 text-green-500" /> JSI: 4.2ms
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Sparkles className="w-3 h-3 text-primary" /> Core: 2.5
          </div>
        </div>
      </header>

      {/* 2. PANEL INFERIOR FLOTANTE (BENTO GRID GLASSMORPHISM) */}
      <footer className="fixed bottom-10 z-20 w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass-panel bg-black/40 backdrop-blur-3xl rounded-[3rem] border-white/5 shadow-2xl">
          
          <Link href="/lens" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-primary/20 border border-white/5 group-hover:border-primary/30 squish-effect">
              <Camera className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">AR Lens</span>
            </div>
          </Link>

          <Link href="/reading" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-secondary/20 border border-white/5 group-hover:border-secondary/30 squish-effect">
              <BookOpen className="w-8 h-8 text-secondary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Lectura</span>
            </div>
          </Link>

          <Link href="/chat" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-primary/20 border border-white/5 group-hover:border-primary/30 squish-effect">
              <Mic className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Voz</span>
            </div>
          </Link>

          <Link href="/" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-secondary/20 border border-white/5 group-hover:border-secondary/30 squish-effect">
              <BarChart3 className="w-8 h-8 text-secondary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Progreso</span>
            </div>
          </Link>

        </div>
      </footer>

      {/* Decoración de Esquinas (Crosshairs) */}
      <div className="fixed top-6 left-6 w-12 h-12 border-t border-l border-white/20 rounded-tl-xl pointer-events-none" />
      <div className="fixed top-6 right-6 w-12 h-12 border-t border-r border-white/20 rounded-tr-xl pointer-events-none" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-b border-l border-white/20 rounded-bl-xl pointer-events-none" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-b border-r border-white/20 rounded-br-xl pointer-events-none" />
    </main>
  );
}
