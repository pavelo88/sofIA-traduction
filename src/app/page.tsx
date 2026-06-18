"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Send, 
  Sparkles,
  Zap,
  Activity,
  Star,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

/**
 * Pantalla Principal: Dashboard de SoftIA
 * Maneja la interacción con Kitten y muestra el estado del sistema.
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
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Manejador de eventos que envía la solicitud a Gemini y guarda en Firestore.
   * Incluye detección de errores 403 (API bloqueada).
   */
  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setApiError(null);
    const userMessage = input;
    setInput('');

    try {
      // 1. Guardar mensaje del usuario en Firestore (Optimista)
      addDoc(collection(db, 'chat_history'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

      // 2. Llamada a la IA de Kitten
      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] 
      });
      
      setKittenResponse(result.response);

      // 3. Guardar respuesta de Kitten para memoria a largo plazo
      addDoc(collection(db, 'chat_history'), {
        role: 'model',
        content: result.response,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

    } catch (error: any) {
      console.error("Error en chat de Kitten:", error);
      
      // Detección específica de API no habilitada (Error 403)
      if (error.message?.includes('403') || error.message?.toLowerCase().includes('blocked') || error.message?.toLowerCase().includes('forbidden')) {
        setApiError("¡Miau! 😿 El acceso a mi cerebro espacial está bloqueado (Error 403). Debes habilitar la 'Generative Language API' en tu Google Cloud Console para este proyecto.");
        setKittenResponse("Mi señal está siendo bloqueada por un escudo de energía. ¡Necesito ayuda técnica! 🚀");
      } else {
        setKittenResponse("¡Miau!... algo interfirió con mi señal espacial. Revisa tu conexión cósmica. 🚀");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center">
      
      {/* Fondo estático con gradiente espacial */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      {/* --- PANEL SUPERIOR: KITTEN ASSISTANT --- */}
      <header className="relative z-20 w-full max-w-4xl pt-16 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        
        {apiError && (
          <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10 backdrop-blur-md animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs">Error Crítico de API</AlertTitle>
            <AlertDescription className="text-xs opacity-90 mt-2">
              {apiError}
              <br />
              <a 
                href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                target="_blank" 
                rel="noreferrer"
                className="underline mt-2 inline-block font-bold"
              >
                Habilitar API aquí →
              </a>
            </AlertDescription>
          </Alert>
        )}

        <div className="glass-panel p-8 rounded-[3rem] w-full flex flex-col md:flex-row items-center gap-8 border-white/10 shadow-primary/10 shadow-2xl">
          
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-5xl" role="img" aria-label="Kitten Avatar">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" title="Sistema Online" />
          </div>

          <div className="flex-1 space-y-6 w-full text-center md:text-left">
            <div className="text-lg font-medium text-white/90 leading-relaxed italic min-h-[3rem] flex items-center justify-center md:justify-start">
              {isLoading ? (
                <span className="flex items-center gap-3 text-primary text-sm font-headline uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" /> Kitten procesando...
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
                placeholder="Escribe un mensaje espacial a Kitten..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-sm focus-visible:ring-primary text-white placeholder:text-white/30"
              />
              <Button 
                onClick={handleKittenChat}
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/80 squish-effect shrink-0 shadow-lg shadow-primary/20"
              >
                {isLoading ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores del Sistema en el HUD */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Activity className="w-4 h-4 text-green-500" /> NÚCLEO_IA: {apiError ? 'BLOQUEADO' : 'ONLINE'}
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Star className="w-4 h-4 text-primary fill-primary" /> PROGRESO: {currentLevel}%
          </div>
        </div>
      </header>

      {/* Elementos Decorativos de la Interfaz Espacial */}
      <div className="fixed top-10 left-10 w-16 h-16 border-t border-l border-white/10 rounded-tl-2xl pointer-events-none opacity-20" />
      <div className="fixed top-10 right-10 w-16 h-16 border-t border-r border-white/10 rounded-tr-2xl pointer-events-none opacity-20" />
    </main>
  );
}
