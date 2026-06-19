
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Send, 
  Sparkles,
  Zap,
  Activity,
  Star,
  Mic,
  MicOff,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Pantalla Principal: Dashboard de SoftIA (v3.4.0 - Resiliencia Total Guest/Firestore)
 */
export default function Home() {
  const { learningProgress, nativeLanguage, targetLanguage } = useStore();
  const { user } = useUser();
  const db = useFirestore();

  // Solo intentamos leer de Firestore si NO es una sesión de invitado
  const isGuest = useMemo(() => !user?.uid || user.uid.startsWith('guest-session'), [user?.uid]);

  const progressRef = useMemo(() => {
    if (!db || isGuest || !user?.uid) return null;
    return doc(db, 'user_progress', user.uid);
  }, [db, user?.uid, isGuest]);

  const { data: progressData } = useDoc(progressRef);
  const currentLevel = progressData?.accuracy_percentage ?? learningProgress;

  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨ ¡Prrr!');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [apiErrorType, setApiErrorType] = useState<'429' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage === 'Inglés' ? 'en-US' : 'es-ES';
    window.speechSynthesis.speak(utterance);
  };

  const handleKittenChat = useCallback(async (textToSubmit?: string) => {
    const finalInput = textToSubmit || inputRef.current;
    if (!finalInput.trim() || isLoading) return;

    setIsLoading(true);
    setApiErrorType(null);
    if (!textToSubmit) setInput('');

    try {
      // Flujo de IA (Independiente de Firestore)
      const result = await aiTutorConversation({
        message: finalInput,
        chatHistory: [],
        nativeLanguage,
        targetLanguage
      });
      
      setKittenResponse(result.response);
      speak(result.response);

      // Persistencia condicional: Solo si es usuario real
      if (!isGuest && user?.uid) {
        const msgData = {
          role: 'user' as const,
          content: finalInput,
          timestamp: new Date().toISOString(),
          user_email: user?.email || 'user@softia.com',
          user_id: user.uid
        };
        addDoc(collection(db, 'users', user.uid, 'chat_history'), msgData).catch(() => {});
      }

    } catch (error: any) {
      console.error("Error en chat de Kitten:", error);
      if (error.message?.includes('429')) setApiErrorType('429');
      setKittenResponse("¡Miau! Algo interfirió con mi señal espacial.");
    } finally {
      setIsLoading(false);
    }
  }, [db, isLoading, nativeLanguage, targetLanguage, user?.email, user?.uid, isGuest]);

  useEffect(() => {
    setIsMounted(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = nativeLanguage === 'Español' ? 'es-ES' : 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleKittenChat(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      
      recognitionRef.current = recognition;
    }
  }, [nativeLanguage, handleKittenChat]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({ title: "Voz no disponible", description: "Revisa los permisos de tu navegador." });
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 150);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      <header className="relative z-20 w-full max-w-4xl pt-16 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        
        {apiErrorType === '429' && (
          <Alert variant="destructive" className="mb-6 border-rose-500/50 bg-rose-500/10 backdrop-blur-md">
            <Wallet className="h-5 w-5 text-rose-500" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs">Energía Agotada (429)</AlertTitle>
          </Alert>
        )}

        <div className="glass-panel p-8 rounded-[3rem] w-full flex flex-col md:flex-row items-center gap-8 border-white/10 shadow-primary/10 shadow-2xl">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-5xl" role="img" aria-label="Kitten Avatar">🐱</span>
            </div>
            <div className={cn("absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-background", isRecording ? "bg-rose-500 animate-ping" : "bg-green-500")} />
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
                placeholder={isRecording ? "Kitten te escucha..." : `Escribe algo en ${targetLanguage}...`}
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-sm focus-visible:ring-primary text-white"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={toggleVoice}
                  disabled={isLoading}
                  className={cn(
                    "h-12 w-12 rounded-2xl squish-effect shrink-0 transition-all duration-300 shadow-lg",
                    isRecording 
                      ? "bg-rose-500 hover:bg-rose-600" 
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button 
                  onClick={() => handleKittenChat()}
                  disabled={isLoading || !input.trim()}
                  className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/80 squish-effect shrink-0"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Activity className="w-4 h-4 text-green-500" /> NÚCLEO_IA: ONLINE
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5">
            <Star className="w-4 h-4 text-primary fill-primary" /> NIVEL: {currentLevel}%
          </div>
          {isGuest && (
            <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-rose-400 border-rose-500/20">
              MODO INVITADO (NO SYNC)
            </div>
          )}
        </div>
      </header>
    </main>
  );
}
