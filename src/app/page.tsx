
"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Send, 
  Sparkles,
  Zap,
  Activity,
  Star,
  ShieldAlert,
  Mic,
  MicOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Pantalla Principal: Dashboard de SoftIA (v2.1.0 - Voice Enabled)
 * Maneja la interacción con Kitten, diagnóstico de sistema y ahora reconocimiento de voz.
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
  const [apiErrorType, setApiErrorType] = useState<'403' | 'other' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Configuración inicial de reconocimiento de voz
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Error de voz:', event.error);
        setIsRecording(false);
        toast({
          title: "Señal de voz perdida",
          description: "Hubo un problema captando tu voz en el vacío.",
          variant: "destructive"
        });
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voz no soportada",
        description: "Tu dispositivo no admite reconocimiento de voz nativo.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setApiErrorType(null);
    const userMessage = input;
    setInput('');

    try {
      addDoc(collection(db, 'chat_history'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] 
      });
      
      setKittenResponse(result.response);

      addDoc(collection(db, 'chat_history'), {
        role: 'model',
        content: result.response,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

    } catch (error: any) {
      console.error("Error en chat de Kitten:", error);
      const errorMsg = error.message?.toLowerCase() || "";
      if (errorMsg.includes('403') || errorMsg.includes('blocked') || errorMsg.includes('forbidden')) {
        setApiErrorType('403');
        setKittenResponse("Mi señal está siendo bloqueada por un escudo de energía. ¡Miau! 😿");
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
      
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      <header className="relative z-20 w-full max-w-4xl pt-16 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        
        {apiErrorType === '403' && (
          <Alert variant="destructive" className="mb-6 border-amber-500/50 bg-amber-500/10 backdrop-blur-md animate-in slide-in-from-top-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs text-amber-500">Diagnóstico de Seguridad 🛡️</AlertTitle>
            <AlertDescription className="text-xs opacity-90 mt-2 text-white">
              Si ya habilitaste la API y sigue fallando, revisa las <strong>Restricciones de la Clave de API</strong> en Google Cloud:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Ve a <b>APIs y servicios &gt; Credenciales</b>.</li>
                <li>Edita tu Clave de API.</li>
                <li>Asegúrate de que <b>"Generative Language API"</b> esté permitida.</li>
                <li>O selecciona "Sin restricciones" para pruebas rápidas.</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="glass-panel p-8 rounded-[3rem] w-full flex flex-col md:flex-row items-center gap-8 border-white/10 shadow-primary/10 shadow-2xl">
          
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-5xl" role="img" aria-label="Kitten Avatar">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" />
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
                placeholder="Escribe o habla con Kitten..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-sm focus-visible:ring-primary text-white placeholder:text-white/30"
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={toggleVoice}
                  disabled={isLoading}
                  className={cn(
                    "h-12 w-12 rounded-2xl squish-effect shrink-0 transition-all duration-300 shadow-lg",
                    isRecording 
                      ? "bg-rose-500 hover:bg-rose-600 animate-pulse shadow-rose-500/40" 
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  )}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

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
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Activity className="w-4 h-4 text-green-500" /> NÚCLEO_IA: {apiErrorType ? 'LIMITADO' : 'ONLINE'}
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Star className="w-4 h-4 text-primary fill-primary" /> PROGRESO: {currentLevel}%
          </div>
        </div>
      </header>

      <div className="fixed top-10 left-10 w-16 h-16 border-t border-l border-white/10 rounded-tl-2xl pointer-events-none opacity-20" />
      <div className="fixed top-10 right-10 w-16 h-16 border-t border-r border-white/10 rounded-tr-2xl pointer-events-none opacity-20" />
    </main>
  );
}
