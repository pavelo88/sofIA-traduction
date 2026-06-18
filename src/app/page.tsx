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
  MicOff,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Pantalla Principal: Dashboard de SoftIA (v2.2.0 - Toggle Voice & Billing Check)
 */
export default function Home() {
  const { learningProgress } = useStore();
  const db = useFirestore();

  const { data: progressData } = useDoc(doc(db, 'user_progress', 'demo-user'));
  const currentLevel = progressData?.accuracy_percentage ?? learningProgress;

  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨ ¡Prrr!');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [apiErrorType, setApiErrorType] = useState<'403' | '429' | 'other' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      // Mantenemos el micro abierto hasta que el usuario decida pararlo
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        }
      };

      recognition.onend = () => {
        // Solo cambiamos el estado si el sistema lo detiene forzosamente
        // pero mantenemos la lógica de toggle manual
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Error de voz:', event.error);
        setIsRecording(false);
        if (event.error !== 'no-speech') {
          toast({
            title: "Señal de voz interrumpida",
            description: "Hubo un problema captando tu voz. Intenta de nuevo.",
            variant: "destructive"
          });
        }
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
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    // Si estamos grabando, detenemos para procesar
    if (isRecording) {
      toggleVoice();
    }

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
      
      if (errorMsg.includes('403') || errorMsg.includes('blocked')) {
        setApiErrorType('403');
        setKittenResponse("Mi señal está bloqueada por un escudo de seguridad. 🛡️");
      } else if (errorMsg.includes('429') || errorMsg.includes('exhausted') || errorMsg.includes('credits')) {
        setApiErrorType('429');
        setKittenResponse("¡Miau! Me he quedado sin energía espacial (créditos). Necesito una recarga en AI Studio. 🔋");
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
        
        {apiErrorType === '429' && (
          <Alert variant="destructive" className="mb-6 border-rose-500/50 bg-rose-500/10 backdrop-blur-md animate-in slide-in-from-top-2">
            <Wallet className="h-5 w-5 text-rose-500" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs text-rose-500">Energía Agotada (429) 🔋</AlertTitle>
            <AlertDescription className="text-xs opacity-90 mt-2 text-white">
              Tus créditos prepago en Google AI Studio se han agotado. Para continuar:
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Ve a <a href="https://aistudio.google.com/app/billing" target="_blank" className="underline font-bold">AI Studio Billing</a>.</li>
                <li>Verifica tu plan o añade créditos a tu cuenta de prepago.</li>
                <li>O utiliza una clave de API diferente con cuota disponible.</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {apiErrorType === '403' && (
          <Alert variant="destructive" className="mb-6 border-amber-500/50 bg-amber-500/10 backdrop-blur-md animate-in slide-in-from-top-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs text-amber-500">Diagnóstico de Seguridad (403) 🛡️</AlertTitle>
            <AlertDescription className="text-xs opacity-90 mt-2 text-white">
              La API está bloqueada. Revisa las <strong>Restricciones de la Clave de API</strong> en Google Cloud Console.
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
                      ? "bg-rose-500 hover:bg-rose-600 animate-pulse shadow-rose-500/60" 
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
