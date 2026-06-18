"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Languages, Sparkles, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateConversation, type ConversationTranslateOutput } from '@/ai/flows/conversation-translate';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type ChatItem = {
  original: string;
  translated: string;
  lang: string;
  timestamp: Date;
};

/**
 * @summary Fase 4: Modo Conversación Bidireccional.
 * Implementa STT (Speech-to-Text) y TTS (Text-to-Speech) integrados con Gemini.
 */
export default function ConversacionMode() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [targetLang, setTargetLang] = useState<'Spanish' | 'English'>('Spanish');
  
  const recognitionRef = useRef<any>(null);

  // --- INICIALIZACIÓN DE SÍNTESIS DE VOZ (TTS) ---
  const speakText = (text: string, langCode: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'English' ? 'es-ES' : 'en-US'; // Hablar en el idioma contrario al detectado
    window.speechSynthesis.speak(utterance);
  };

  // --- CONFIGURACIÓN DE RECONOCIMIENTO DE VOZ (STT) ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = targetLang === 'Spanish' ? 'en-US' : 'es-ES'; // Escuchar lo que el otro dice para traducir a mi idioma

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleTranslation(transcript);
      };

      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => {
        setIsRecording(false);
        toast({ title: "Error de audio", description: "No se pudo captar la voz claramente.", variant: "destructive" });
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [targetLang]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handleTranslation = async (text: string) => {
    setIsProcessing(true);
    try {
      const result = await translateConversation({
        text,
        targetLanguage: targetLang
      });

      const newItem: ChatItem = {
        original: text,
        translated: result.translatedText,
        lang: result.detectedLanguage,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);
      
      // Lanzar síntesis de voz automática
      speakText(result.translatedText, result.detectedLanguage);

    } catch (error) {
      console.error(error);
      toast({ title: "Error Espacial", description: "La señal de traducción se perdió en el vacío.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center p-6 pb-32">
      
      {/* HUD HEADER */}
      <header className="w-full max-w-2xl mt-8 mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top-4">
        <div className="glass-panel px-4 py-2 rounded-full border-primary/20 flex items-center gap-3 mb-6">
          <Languages className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-headline uppercase tracking-[0.2em] text-white/60">Companion_Mode: Activo</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-center text-white tracking-tighter">
          Conversación <span className="text-primary">Bidireccional</span>
        </h1>
        <p className="text-white/40 text-xs mt-2 text-center max-w-xs leading-relaxed">
          Kitten escucha y traduce instantáneamente. Toca el micro para empezar.
        </p>
      </header>

      {/* HISTORIAL DE CONVERSACIÓN */}
      <div className="w-full max-w-2xl flex-1 glass-panel rounded-[3rem] border-white/5 bg-white/5 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {history.length === 0 && !isProcessing && (
              <div className="h-64 flex flex-col items-center justify-center text-white/20 gap-4">
                <Sparkles className="w-12 h-12 opacity-50" />
                <p className="font-headline text-xs uppercase tracking-widest">Esperando señal vocal...</p>
              </div>
            )}
            
            {history.map((item, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-headline text-primary uppercase tracking-widest">Capturado ({item.lang})</span>
                    <span className="text-[10px] text-white/20">{item.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/60 italic">"{item.original}"</p>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-start gap-3">
                    <Volume2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-lg font-headline font-medium text-white tracking-tight leading-snug">
                      {item.translated}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-center py-4 animate-pulse">
                <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-primary/40">
                  <RefreshCcw className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-[10px] font-headline text-primary uppercase tracking-widest">Traduciendo...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CONTROL DE MICRO CENTRAL */}
      <div className="fixed bottom-28 z-40">
        <div className="relative group">
          {/* Aura pulsante cuando está activo */}
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-fuchsia-500/50 animate-pulse blur-xl" />
          )}
          
          <Button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={cn(
              "h-24 w-24 rounded-full transition-all duration-500 shadow-2xl squish-effect relative z-10",
              isRecording 
                ? "bg-fuchsia-500 hover:bg-fuchsia-600 scale-110 shadow-fuchsia-500/50" 
                : "bg-primary hover:bg-primary/80 shadow-primary/40"
            )}
          >
            {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
          </Button>

          {/* Selector de idioma rápido lateral */}
          <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex flex-col gap-2">
             <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setTargetLang(prev => prev === 'Spanish' ? 'English' : 'Spanish')}
                className="h-10 w-10 rounded-full border-white/10 bg-black/40 backdrop-blur-md"
             >
               <Languages className="w-4 h-4 text-white" />
             </Button>
          </div>
        </div>
      </div>

      {/* Decoraciones HUD laterales */}
      <div className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col gap-10 opacity-20 pointer-events-none">
        <div className="w-px h-24 bg-white" />
        <div className="w-px h-24 bg-white" />
      </div>
      <div className="fixed top-1/2 right-4 -translate-y-1/2 flex flex-col gap-10 opacity-20 pointer-events-none">
        <div className="w-px h-24 bg-white" />
        <div className="w-px h-24 bg-white" />
      </div>

    </main>
  );
}
