"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, RefreshCcw, Sparkles, User, Users, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateConversation } from '@/ai/flows/conversation-translate';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';

type ChatItem = {
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: Date;
};

/**
 * @summary Fase 4: Modo Conversación Dual (Modo Espejo).
 * Implementa intercambio automático de roles y traducción fluida de voz a voz.
 */
export default function ConversacionMode() {
  const { nativeLanguage, targetLanguage } = useStore();
  
  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const isAutoRestarting = useRef(false);

  // --- SÍNTESIS DE VOZ (TTS) ---
  const speakText = useCallback((text: string, lang: string) => {
    if (!window.speechSynthesis) return;
    
    // Detener cualquier voz previa
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Configurar idioma de voz
    utterance.lang = lang === 'Inglés' ? 'en-US' : 'es-ES';
    
    utterance.onend = () => {
      // Cuando termina de hablar, cambiamos el turno y activamos el micro automáticamente
      setIsNativeTurn(prev => !prev);
      isAutoRestarting.current = true;
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // --- TRADUCCIÓN ---
  const handleTranslation = async (text: string) => {
    if (!text.trim()) {
      setIsRecording(false);
      return;
    }

    setIsProcessing(true);
    const fromLang = isNativeTurn ? nativeLanguage : targetLanguage;
    const toLang = isNativeTurn ? targetLanguage : nativeLanguage;

    try {
      const result = await translateConversation({
        text,
        fromLanguage: fromLang,
        toLanguage: toLang
      });

      const newItem: ChatItem = {
        original: text,
        translated: result.translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);
      speakText(result.translatedText, toLang);

    } catch (error) {
      console.error(error);
      toast({ title: "Error de Traducción", description: "La señal se perdió en el vacío.", variant: "destructive" });
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RECONOCIMIENTO DE VOZ (STT) ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleTranslation(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [nativeLanguage, targetLanguage, isNativeTurn]);

  // Efecto para auto-reiniciar el micro tras el cambio de turno
  useEffect(() => {
    if (isAutoRestarting.current && !isRecording && !isProcessing) {
      isAutoRestarting.current = false;
      startMic();
    }
  }, [isNativeTurn, isRecording, isProcessing]);

  const startMic = () => {
    if (!recognitionRef.current || isRecording || isProcessing) return;
    
    // Configurar idioma según el turno
    recognitionRef.current.lang = isNativeTurn 
      ? (nativeLanguage === 'Español' ? 'es-ES' : 'en-US') 
      : (targetLanguage === 'Inglés' ? 'en-US' : 'es-ES');
      
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Recognition already started");
    }
  };

  const toggleSession = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      startMic();
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-6 pb-40 relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      {/* HEADER */}
      <header className="relative z-10 w-full max-w-4xl mt-8 mb-12 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-primary/20">
          <ArrowRightLeft className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-white/60">Modo Conversación Dual</span>
        </div>
        <h1 className="text-4xl font-headline font-bold text-white tracking-tighter">
          Compañero <span className="text-primary">Espacial</span>
        </h1>
      </header>

      {/* BENTO GRID DE TURNOS */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Mi Turno (Nativo) */}
        <div className={cn(
          "glass-panel p-8 rounded-[2.5rem] transition-all duration-700 border-2",
          isNativeTurn ? "border-primary bg-primary/10 scale-105 shadow-2xl shadow-primary/20" : "border-white/5 opacity-40 grayscale"
        )}>
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", isNativeTurn ? "bg-primary text-white" : "bg-white/5")}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-headline uppercase tracking-widest text-primary/80">Mi Turno</p>
              <h3 className="text-xl font-headline font-bold text-white">{nativeLanguage}</h3>
            </div>
          </div>
          <div className="h-20 flex items-center justify-center border-t border-white/5 pt-4">
            {isNativeTurn && isRecording && <div className="flex gap-1 h-8 items-center"><div className="w-1 bg-primary animate-bounce h-4" /><div className="w-1 bg-primary animate-bounce h-8 [animation-delay:0.2s]" /><div className="w-1 bg-primary animate-bounce h-5 [animation-delay:0.4s]" /></div>}
            {!isNativeTurn && <p className="text-xs text-white/20 italic">Esperando...</p>}
          </div>
        </div>

        {/* Turno Invitado (Objetivo) */}
        <div className={cn(
          "glass-panel p-8 rounded-[2.5rem] transition-all duration-700 border-2",
          !isNativeTurn ? "border-secondary bg-secondary/10 scale-105 shadow-2xl shadow-secondary/20" : "border-white/5 opacity-40 grayscale"
        )}>
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", !isNativeTurn ? "bg-secondary text-white" : "bg-white/5")}>
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-headline uppercase tracking-widest text-secondary/80">Turno Invitado</p>
              <h3 className="text-xl font-headline font-bold text-white">{targetLanguage}</h3>
            </div>
          </div>
          <div className="h-20 flex items-center justify-center border-t border-white/5 pt-4">
            {!isNativeTurn && isRecording && <div className="flex gap-1 h-8 items-center"><div className="w-1 bg-secondary animate-bounce h-4" /><div className="w-1 bg-secondary animate-bounce h-8 [animation-delay:0.2s]" /><div className="w-1 bg-secondary animate-bounce h-5 [animation-delay:0.4s]" /></div>}
            {isNativeTurn && <p className="text-xs text-white/20 italic">Esperando...</p>}
          </div>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="relative z-10 w-full max-w-4xl flex-1 glass-panel rounded-[3rem] border-white/5 bg-white/5 overflow-hidden flex flex-col min-h-[400px]">
        <ScrollArea className="flex-1 p-8">
          <div className="space-y-8">
            {history.length === 0 && !isProcessing && (
              <div className="h-60 flex flex-col items-center justify-center text-white/20 gap-4 opacity-50">
                <Sparkles className="w-12 h-12 animate-pulse" />
                <p className="font-headline text-xs uppercase tracking-[0.4em]">Inicia la transmisión espacial</p>
              </div>
            )}
            
            {history.map((item, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className={cn(
                  "p-8 rounded-[2.5rem] border space-y-4",
                  item.from === nativeLanguage ? "bg-primary/5 border-primary/20" : "bg-secondary/5 border-secondary/20"
                )}>
                  <div className="flex items-center justify-between opacity-40">
                    <span className="text-[10px] font-headline uppercase tracking-widest">{item.from} → {item.to}</span>
                    <span className="text-[10px]">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-white/40 italic leading-relaxed">"{item.original}"</p>
                  <div className="h-px bg-white/5" />
                  <p className="text-2xl font-headline font-bold text-white tracking-tight leading-tight">
                    {item.translated}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-center py-10">
                <div className="flex items-center gap-4 glass-panel px-8 py-4 rounded-full border-primary/40 animate-pulse">
                  <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-xs font-headline text-primary uppercase tracking-[0.2em]">Sincronizando...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CONTROL DE MICRO CENTRAL */}
      <div className="fixed bottom-32 z-40">
        <div className="relative group">
          {isRecording && (
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping blur-3xl opacity-50",
              isNativeTurn ? "bg-primary" : "bg-secondary"
            )} />
          )}
          
          <Button
            onClick={toggleSession}
            disabled={isProcessing}
            className={cn(
              "h-28 w-28 rounded-full transition-all duration-700 shadow-2xl squish-effect relative z-10",
              isRecording 
                ? (isNativeTurn ? "bg-primary scale-110 shadow-primary/60" : "bg-secondary scale-110 shadow-secondary/60") 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            )}
          >
            {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </Button>
        </div>
      </div>
    </main>
  );
}
