
"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Send, 
  Sparkles,
  Zap,
  Activity,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';

/**
 * Pantalla Principal: Dashboard de SoftIA
 * Se ha eliminado el fondo de cámara para optimizar batería y se ha restaurado el chat input.
 */
export default function Home() {
  const { learningProgress } = useStore();
  const db = useFirestore();

  // --- PERSISTENCIA: HUD DINÁMICO ---
  const { data: progressData } = useDoc(doc(db, 'user_progress', 'demo-user'));
  const currentLevel = progressData?.accuracy_percentage ?? learningProgress;

  // --- ESTADOS DE REACCIÓN INTERACTIVA ---
  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨ ¡Prrr!');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Manejador de eventos que envía la solicitud a Gemini y guarda en Firestore.
   */
  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');

    try {
      // 1. Guardar mensaje del usuario
      addDoc(collection(db, 'chat_history'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

      // 2. Llamada a IA
      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] 
      });
      
      setKittenResponse(result.response);

      // 3. Guardar respuesta de Kitten
      addDoc(collection(db, 'chat_history'), {
        role: 'model',
        content: result.response,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

    } catch (error) {
      console.error("Error en chat:", error);
      setKittenResponse("¡Miau!... algo interfirió con mi señal espacial. 🚀");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center">
      
      {/* Fondo estático para ahorro de batería en Home */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      {/* --- PANEL SUPERIOR: KITTEN ASSISTANT --- */}
      <header className="relative z-20 w-full max-w-4xl pt-16 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="glass-panel p-8 rounded-[3rem] w-full flex flex-col md:flex-row items-center gap-8 border-white/10 shadow-primary/10 shadow-2xl">
          
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-5xl" role="img" aria-label="Kitten">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" />
          </div>

          <div className="flex-1 space-y-6 w-full text-center md:text-left">
            <div className="text-lg font-medium text-white/90 leading-relaxed italic min-h-[3rem] flex items-center justify-center md:justify-start">
              {isLoading ? (
                <span className="flex items-center gap-3 text-primary text-sm font-headline uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" /> Kitten está pensando...
                </span>
              ) : (
                `"${kittenResponse}"`
              )}
            </div>
            
            <div className="flex gap-3">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKittenChat()}
                placeholder="Escribe a Kitten..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-sm focus-visible:ring-primary text-white placeholder:text-white/30"
              />
              <Button 
                onClick={handleKittenChat}
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/80 squish-effect shrink-0"
              >
                {isLoading ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores de Sistema */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60">
            <Activity className="w-4 h-4 text-green-500" /> NÚCLEO_IA: ONLINE
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60">
            <Star className="w-4 h-4 text-primary fill-primary" /> PROGRESO: {currentLevel}%
          </div>
        </div>
      </header>

      {/* Decoraciones HUD */}
      <div className="fixed top-10 left-10 w-16 h-16 border-t border-l border-white/10 rounded-tl-2xl pointer-events-none opacity-20" />
      <div className="fixed top-10 right-10 w-16 h-16 border-t border-r border-white/10 rounded-tr-2xl pointer-events-none opacity-20" />
    </main>
  );
}
