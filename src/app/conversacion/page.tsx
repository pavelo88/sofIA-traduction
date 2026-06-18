
"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Languages, Sparkles, RefreshCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { translateConversation } from '@/ai/flows/conversation-translate';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatItem = {
  original: string;
  translated: string;
  lang: string;
  timestamp: Date;
};

/**
 * @summary Fase 4: Modo Conversación con Selectores de Idioma.
 * Se ha corregido el toggle del micrófono y se han añadido controles de idioma.
 */
export default function ConversacionMode() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  // Selectores de idioma dinámicos
  const [myLang, setMyLang] = useState('Español');
  const [targetLang, setTargetLang] = useState('Inglés');
  
  const recognitionRef = useRef<any>(null);

  // --- SÍNTESIS DE VOZ (TTS) ---
  const speakText = (text: string, toLang: string) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    // Configurar idioma de voz basado en el objetivo
    utterance.lang = toLang === 'Inglés' ? 'en-US' : 'es-ES';
    window.speechSynthesis.speak(utterance);
  };

  // --- RECONOCIMIENTO DE VOZ (STT) ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Escuchar en el idioma que corresponda al usuario actual
      recognition.lang = myLang === 'Español' ? 'es-ES' : 'en-US';

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleTranslation(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast({ title: "Señal débil", description: "No pude captar tu voz espacial.", variant: "destructive" });
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [myLang]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
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
      speakText(result.translatedText, targetLang);

    } catch (error) {
      console.error(error);
      toast({ title: "Error de Traducción", description: "La señal se perdió en el vacío.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const swapLanguages = () => {
    const temp = myLang;
    setMyLang(targetLang);
    setTargetLang(temp);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center p-6 pb-40">
      
      {/* HEADER & SELECTORES */}
      <header className="w-full max-w-2xl mt-8 mb-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-headline font-bold text-white tracking-tight">
          Compañero <span className="text-primary">Espacial</span>
        </h1>

        <div className="flex items-center gap-3 glass-panel p-2 rounded-2xl border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-[10px] font-headline uppercase tracking-widest text-primary h-8 px-4">
                Yo: {myLang} <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-white/10">
              <DropdownMenuItem onClick={() => setMyLang('Español')}>Español</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMyLang('Inglés')}>Inglés</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={swapLanguages} className="h-8 w-8 text-white/40 hover:text-primary">
            <RefreshCcw className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-[10px] font-headline uppercase tracking-widest text-secondary h-8 px-4">
                Tutor: {targetLang} <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-popover border-white/10">
              <DropdownMenuItem onClick={() => setTargetLang('Español')}>Español</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTargetLang('Inglés')}>Inglés</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* LISTA DE CONVERSACIÓN */}
      <div className="w-full max-w-2xl flex-1 glass-panel rounded-[2.5rem] border-white/5 bg-white/5 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {history.length === 0 && !isProcessing && (
              <div className="h-40 flex flex-col items-center justify-center text-white/20 gap-4">
                <Sparkles className="w-10 h-10 opacity-30" />
                <p className="font-headline text-[10px] uppercase tracking-[0.3em]">Pulsa para empezar a hablar</p>
              </div>
            )}
            
            {history.map((item, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between opacity-40">
                    <span className="text-[9px] font-headline uppercase tracking-[0.2em]">{item.lang}</span>
                    <span className="text-[9px]">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-white/50 italic leading-relaxed">"{item.original}"</p>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-start gap-4">
                    <Volume2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <p className="text-xl font-headline font-semibold text-white tracking-tight leading-snug">
                      {item.translated}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-center py-6 animate-pulse">
                <div className="flex items-center gap-3 glass-panel px-6 py-3 rounded-full border-primary/40">
                  <RefreshCcw className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-[10px] font-headline text-primary uppercase tracking-widest">Analizando...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CONTROL DE MICRO */}
      <div className="fixed bottom-32 z-40">
        <div className="relative group">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping blur-2xl" />
          )}
          
          <Button
            onClick={toggleRecording}
            disabled={isProcessing}
            className={cn(
              "h-24 w-24 rounded-full transition-all duration-500 shadow-2xl squish-effect relative z-10",
              isRecording 
                ? "bg-rose-500 hover:bg-rose-600 scale-110 shadow-rose-500/50" 
                : "bg-primary hover:bg-primary/80 shadow-primary/40"
            )}
          >
            {isRecording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
          </Button>
        </div>
      </div>
    </main>
  );
}
