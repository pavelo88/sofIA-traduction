"use client";

import { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useStore } from '@/lib/store';
// Conexión con la capa de IA de Genkit (utiliza la clave configurada de Gemini en el backend)
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Camera, 
  BookOpen, 
  Mic, 
  BarChart3, 
  Send, 
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function Home() {
  const { learningProgress } = useStore();
  
  // --- ESTADOS DE REACCIÓN INTERACTIVA ---
  // input: Almacena el texto que el usuario está redactando en tiempo real
  const [input, setInput] = useState('');
  // kittenResponse: Mensaje actual visible en la burbuja flotante del tutor
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨ ¡Prrr!');
  // isLoading: Estado booleano para controlar las transiciones de carga y el indicador "escribiendo..."
  const [isLoading, setIsLoading] = useState(false);
  // isMounted: Previene discrepancias de hidratación en entornos Next.js SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Manejador de eventos que envía la solicitud a la API de Gemini a través de Genkit.
   * Modifica los estados antes y después de la llamada para asegurar retroalimentación visual continua.
   */
  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    // Activamos el estado de carga y respaldamos el mensaje del usuario
    setIsLoading(true);
    const userMessage = input;
    setInput('');

    try {
      // Invocamos el flujo con el prompt del sistema actualizado
      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] // En el futuro se puede conectar con Firestore para persistencia duradera
      });
      
      // Actualizamos la interfaz con la respuesta auténtica del modelo de lenguaje
      setKittenResponse(result.response);
    } catch (error) {
      // Manejo amigable de fallos temporales en la nube
      setKittenResponse("¡Miau!... algo interfirió con mi señal espacial en la nube. ¡Inténtalo de nuevo, por favor! 🚀");
    } finally {
      // Concluimos la animación de escritura
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center">
      
      {/* --- ESTRUCTURA VISUAL: HUD DE CÁMARA AR SIMULADA --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `url('https://picsum.photos/seed/bg-noise/1920/1080')`, backgroundSize: 'cover', mixBlendMode: 'overlay' }} 
        />
        <div className="ar-scanner absolute inset-0 opacity-10 pointer-events-none" />
      </div>

      <SidebarNav />

      {/* --- PANEL SUPERIOR FLOTANTE: KITTEN ASSISTANT INTERACTIVO --- */}
      <header className="relative z-20 w-full max-w-4xl pt-8 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="glass-panel p-6 rounded-[2.5rem] w-full flex items-center gap-6 border-white/10 shadow-primary/20 shadow-2xl">
          
          {/* Avatar Animado de Kitten */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-4xl">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background flex items-center justify-center" />
          </div>

          {/* Burbuja Dinámica e Input de Texto */}
          <div className="flex-1 space-y-3">
            <div className="text-sm font-medium text-white/90 leading-relaxed italic min-h-[2.5rem] flex items-center">
              {isLoading ? (
                <span className="flex items-center gap-2 text-primary text-xs font-headline uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" /> Kitten está pensando en las estrellas...
                </span>
              ) : (
                `"${kittenResponse}"`
              )}
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKittenChat()}
                placeholder="Escribe a Kitten..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-10 rounded-xl text-xs focus-visible:ring-primary text-white"
              />
              <Button 
                onClick={handleKittenChat}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 squish-effect"
              >
                {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores de Rendimiento Espacial */}
        <div className="flex gap-4 mt-6">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Activity className="w-3 h-3 text-green-500" /> JSI_STREAM: ACTIVE
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Sparkles className="w-3 h-3 text-primary" /> PROG_LOG: {learningProgress}%
          </div>
        </div>
      </header>

      {/* --- PANEL INFERIOR FLOTANTE: BENTO GRID --- */}
      <footer className="fixed bottom-10 z-20 w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass-panel bg-black/40 backdrop-blur-3xl rounded-[3rem] border-white/5 shadow-2xl">
          
          <Link href="/lens" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-primary/20 border border-white/5 group-hover:border-primary/30 squish-effect">
              <Camera className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Lente AR</span>
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
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Voz Chat</span>
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

      {/* Retículas HUD Decorativas */}
      <div className="fixed top-6 left-6 w-12 h-12 border-t border-l border-white/20 rounded-tl-xl pointer-events-none" />
      <div className="fixed top-6 right-6 w-12 h-12 border-t border-r border-white/20 rounded-tr-xl pointer-events-none" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-b border-l border-white/20 rounded-bl-xl pointer-events-none" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-b border-r border-white/20 rounded-br-xl pointer-events-none" />
    </main>
  );
}
