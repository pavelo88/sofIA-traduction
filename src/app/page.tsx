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
  const { learningProgress, nativeLanguage, targetLanguage } = useStore();
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
  
  const recognitionRef = useRef<any>(null);
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
      const result = await aiTutorConversation({
        message: finalInput,
        chatHistory: [],
        nativeLanguage,
        targetLanguage
      });
      
      setKittenResponse(result.response);
      speak(result.response);

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
    <main className="relative min-h-screen bg-background overflow-y-auto flex flex-col items-center pb-48 lg:pb-16">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/10 via-background to-background" />

      <header className="relative z-20 w-full max-w-4xl pt-16 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        
        {apiErrorType === '429' && (
          <Alert variant="destructive" className="mb-6 border-rose-500/50 bg-rose-500/10 backdrop-blur-md">
            <Wallet className="h-5 w-5 text-rose-500" />
            <AlertTitle className="font-headline uppercase tracking-widest text-xs">Energía Agotada (429)</AlertTitle>
          </Alert>
        )}

        {/* CONTENEDOR DE BIENVENIDA */}
        <div className="glass-panel p-8 rounded-[2.5rem] w-full flex flex-col md:flex-row items-center gap-8 border-white/10 shadow-primary/10 shadow-2xl bg-black/40 backdrop-blur-3xl">
          <div className="relative shrink-0">
            <div className="w-24 h-24 flex items-center justify-center">
              <span className="text-7xl drop-shadow-[0_0_30px_rgba(161,98,247,0.8)]" role="img" aria-label="Kitten Avatar">🐱</span>
            </div>
            <div className={cn("absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center", isRecording ? "bg-rose-500 animate-ping" : "bg-green-500")} />
          </div>

          <div className="flex-1 space-y-6 w-full text-center md:text-left">
            <div className="text-lg font-medium text-white/90 leading-relaxed italic min-h-[3rem] flex items-center justify-center md:justify-start">
              {isLoading ? (
                <span className="flex items-center gap-3 text-primary text-sm font-headline uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" /> Procesando voz...
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
                placeholder={isRecording ? "Kitten te escucha..." : `Escribe algo para hablar...`}
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

        {/* ESTADOS DEL SISTEMA */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5 bg-white/[0.02]">
            <Activity className="w-4 h-4 text-green-500" /> NÚCLEO_IA: ONLINE
          </div>
          <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60 border-white/5 bg-white/[0.02]">
            <Star className="w-4 h-4 text-primary fill-primary" /> NIVEL: {currentLevel}%
          </div>
          {isGuest && (
            <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 text-[10px] uppercase tracking-widest text-rose-400 border-rose-500/20 bg-rose-500/5">
              MODO INVITADO
            </div>
          )}
        </div>

        {/* BENTO GRID DE ACCESO RÁPIDO */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 text-left">
          
          <Link href="/lens" className="group">
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-primary/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline font-bold text-lg text-white">Lente AR Visión</h3>
                <p className="text-xs text-white/40 leading-relaxed">Escanea textos en el mundo real y tradúcelos de manera inmersiva.</p>
              </div>
            </div>
          </Link>

          <Link href="/conversacion" className="group">
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-secondary/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-secondary transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline font-bold text-lg text-white">Conversación Dual</h3>
                <p className="text-xs text-white/40 leading-relaxed">Intermediación y traducción por voz fluida para entablar diálogos en tiempo real.</p>
              </div>
            </div>
          </Link>

          <Link href="/reading" className="group">
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-emerald-500/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline font-bold text-lg text-white">Práctica de Lectura</h3>
                <p className="text-xs text-white/40 leading-relaxed">Mejora tu pronunciación leyendo frases objetivo con retroalimentación espacial.</p>
              </div>
            </div>
          </Link>

          <Link href="/chat" className="group">
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 hover:border-purple-500/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300 flex flex-col justify-between h-48 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline font-bold text-lg text-white">Chat Tutor Kitten</h3>
                <p className="text-xs text-white/40 leading-relaxed">Entabla chats informales con tu gatito asistente virtual en tu idioma objetivo.</p>
              </div>
            </div>
          </Link>

        </div>

      </header>
    </main>
  );
}
