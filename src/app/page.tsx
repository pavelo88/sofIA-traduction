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
  Wallet,
  Camera,
  BookOpen,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useUser } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function Home() {
  const { learningProgress, nativeLanguage, targetLanguage, saveGenericSession } = useStore();
  const { user } = useUser();
  const db = useFirestore();

  const isGuest = useMemo(() => !user?.uid || user.uid.startsWith('guest-session'), [user?.uid]);

  const progressRef = useMemo(() => {
    if (!db || isGuest || !user?.uid) return null;
    return doc(db, 'user_progress', user.uid);
  }, [db, user?.uid, isGuest]);

  const { data: progressData } = useDoc(progressRef);
  const currentLevel = progressData?.accuracy_percentage ?? learningProgress;

  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión de traducción o aprendizaje espacial hoy? 🐱✨');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [apiErrorType, setApiErrorType] = useState<'429' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: '¡Hola! Soy Kitten. ¿Listo para nuestra sesión de traducción o aprendizaje espacial hoy? 🐱✨' }
  ]);
  const chatHistoryRef = useRef(chatHistory);
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    // Auto-save history
    if (chatHistory.length > 1) {
      saveGenericSession('chat', 'Chat con Kitten', chatHistory);
    }
  }, [chatHistory, saveGenericSession]);

  const recognitionRef = useRef<any>(null);
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // El speaker mixto se carga dinámicamente cuando se necesita
  const handleKittenChat = useCallback(async (textToSubmit?: string) => {
    const finalInput = textToSubmit || inputRef.current;
    if (!finalInput.trim() || isLoading) return;

    setIsLoading(true);
    setApiErrorType(null);
    if (!textToSubmit) setInput('');

    const currentHistory = chatHistoryRef.current.map(h => ({ role: h.role, content: h.content }));

    try {
      const result = await aiTutorConversation({
        message: finalInput,
        chatHistory: currentHistory,
        nativeLanguage,
        targetLanguage
      });
      
      setKittenResponse(result.response.replace(/<\/?lang>/g, ''));
      import('@/lib/voice/mixed-speaker').then(({ speakMixedText }) => {
        speakMixedText(
          result.response,
          nativeLanguage,
          targetLanguage,
          'femenino',
          'femenino'
        );
      });

      setChatHistory(prev => [
        ...prev,
        { role: 'user' as const, content: finalInput },
        { role: 'model' as const, content: result.response }
      ]);

      // Firebase permissions bypass - suppress all database writes to ensure offline/guest compatibility
      console.log(`[Firebase Bypass] Suppressed chat history db write:`, finalInput);

    } catch (error: any) {
      console.error("Error en chat de Kitten:", error);
      if (error.message?.includes('429')) setApiErrorType('429');
      setKittenResponse("¡Miau! Algo interfirió con mi señal espacial.");
    } finally {
      setIsLoading(false);
    }
  }, [db, isLoading, nativeLanguage, targetLanguage, user?.email, user?.uid, isGuest]);

  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voz no disponible", description: "Revisa los permisos de tu navegador." });
      return;
    }

    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      if (inputRef.current.trim()) {
        handleKittenChat(inputRef.current.trim());
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    const langMapping: Record<string, string> = {
      "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
      "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
      "Árabe": "ar-SA", "Ruso": "ru-RU"
    };
    recognition.lang = langMapping[nativeLanguage] || 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      isRecordingRef.current = true;
      setInput(''); // Limpiar antes de grabar
    };

    recognition.onresult = (event: any) => {
      let accumulated = '';
      for (let i = 0; i < event.results.length; i++) {
        accumulated += event.results[i][0].transcript + ' ';
      }
      setInput(accumulated.trim());
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        // Auto-reinicio si se corta por silencio pero el usuario no ha presionado detener
        setTimeout(() => {
          if (isRecordingRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 50);
        return;
      }
      setIsRecording(false);
    };

    recognition.onerror = () => {}; // Ignorar, onend reiniciará si es necesario

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setTimeout(() => { try { recognition.start(); } catch (e) {} }, 150);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative h-[100dvh] bg-background overflow-hidden flex flex-col items-center">
      {/* BACKGROUND IMAGE - Faint */}
      <div className="absolute inset-0 z-0 bg-[url('/images/kitty-globe.png')] bg-cover bg-center opacity-5 pointer-events-none" />

      {/* HEADER / TITULO */}
      <div className="w-full max-w-2xl px-6 pt-12 pb-2 text-center z-10 shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 drop-shadow-md">
          SoftIA Tutor
        </h1>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Aprendizaje Espacial</p>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 w-full max-w-2xl overflow-y-auto custom-scrollbar px-6 pb-4 flex flex-col items-center">

      {/* VISTA INICIAL (GATO Y MENSAJE) */}
      {chatHistory.length <= 1 && (
        <div className="flex flex-col items-center w-full max-w-2xl px-6 z-10 animate-in fade-in zoom-in duration-700">
          {/* IMAGEN DEL GATO */}
          <div className="w-full max-w-[280px] aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20 mb-8 border border-white/5 group">
            <div className="absolute inset-0 bg-[url('/images/kitty-globe.png')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          </div>

          {/* MENSAJE DE BIENVENIDA */}
          <div className="glass-panel p-6 rounded-3xl border-primary/20 shadow-neon-primary bg-zinc-950/60 backdrop-blur-xl w-full relative group">
            <p className="text-white/90 leading-relaxed font-medium italic text-base md:text-lg text-center">
              "¡Hola! Soy Kitten. ¿Listo para nuestra sesión de traducción o aprendizaje espacial hoy? 😽✨"
            </p>
          </div>
        </div>
      )}

      {/* CHAT INTERFACE */}
      {chatHistory.length > 1 && (
        <div className="w-full max-w-2xl flex-1 flex flex-col space-y-4 px-4 z-10 animate-in slide-in-from-bottom-8 duration-500">
          {/* Boton para cerrar chat y volver al inicio */}
          <div className="flex justify-between items-center px-2 py-4 mb-2">
            <h2 className="text-sm font-headline text-primary uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Chat Activo
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setChatHistory([{ role: 'model', content: kittenResponse }])}
              className="text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-full text-xs transition-colors"
            >
              Cerrar Chat
            </Button>
          </div>

          <div className="flex flex-col space-y-6 pb-8">
            {chatHistory.slice(1).map((msg, idx) => (
              <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "p-4 rounded-3xl max-w-[85%] text-sm md:text-base leading-relaxed shadow-lg relative group",
                  msg.role === 'user' ? "bg-primary/80 text-white rounded-br-sm" : "glass-panel text-white/90 rounded-bl-sm"
                )}>
                  {msg.content}
                  
                  {/* Boton de Play para reproducir (solo respuestas de IA) */}
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => {
                        import('@/lib/voice/mixed-speaker').then(({ speakMixedText }) => {
                          speakMixedText(msg.content, nativeLanguage, targetLanguage, 'femenino', 'femenino');
                        });
                      }}
                      className="absolute -right-12 bottom-0 p-2 rounded-full bg-white/5 hover:bg-primary/20 text-white/40 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="glass-panel p-4 rounded-3xl rounded-bl-sm text-sm text-primary animate-pulse flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESPACIADOR FLEXIBLE PARA EMPUJAR INPUT ABAJO SI NO HAY CHAT */}
      <div className="flex-1 min-h-[2rem]" />
      </div> {/* <-- CIERRE DE SCROLLABLE CONTENT AREA */}

      {/* BOTTOM CONTROL BAR */}
      <div className="w-full max-w-2xl px-6 z-40 pb-24 shrink-0 mt-2">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleKittenChat(); }}
          className="glass-panel p-2 rounded-[2.5rem] border-white/10 shadow-2xl flex items-center gap-3 bg-zinc-950/90 backdrop-blur-3xl relative overflow-hidden"
        >
          {isRecording && <div className="absolute inset-0 bg-primary/10 animate-pulse" />}
          
          <Button 
            type="button"
            onClick={() => handleKittenChat()}
            disabled={isLoading || !input.trim()}
            className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary/20 squish-effect shrink-0 relative z-10 transition-colors text-white hover:text-primary"
          >
            <Send className="w-5 h-5 ml-1" />
          </Button>

          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleKittenChat()}
            placeholder={isRecording ? "Kitten escucha..." : "Escribe un mensaje..."}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none h-14 text-sm md:text-base focus-visible:ring-0 text-white placeholder:text-white/30 relative z-10 px-0"
          />

          <Button 
            onClick={toggleVoice}
            disabled={isLoading}
            className={cn(
              "h-14 w-14 rounded-full squish-effect shrink-0 transition-all duration-300 relative z-10 shadow-xl",
              isRecording 
                ? "bg-rose-500 hover:bg-rose-600 shadow-neon-emerald" 
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
        </form>
      </div>

    </main>
  );
}
