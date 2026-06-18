"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, RefreshCcw, Sparkles, User, Users, ArrowRightLeft, Camera, CameraOff } from 'lucide-react';
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
 * @summary Modo Conversación Dual (Modo Espejo) v2.0.
 * Optimizaciones: Control estricto de cámara, flujo de voz directo, género de TTS.
 */
export default function ConversacionMode() {
  const { nativeLanguage, targetLanguage, userVoiceGender, partnerVoiceGender } = useStore();
  
  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAutoRestarting = useRef(false);

  // --- MAPEO DE IDIOMAS PARA RECONOCIMIENTO Y TTS ---
  const langMap: Record<string, string> = {
    "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
    "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
    "Árabe": "ar-SA", "Ruso": "ru-RU"
  };

  // --- SÍNTESIS DE VOZ (TTS) CON GÉNERO ---
  const speakText = useCallback((text: string, langName: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = langMap[langName] || 'en-US';
    utterance.lang = langCode;

    // Intentar seleccionar voz por género
    const voices = window.speechSynthesis.getVoices();
    const genderToFind = isNativeTurn ? partnerVoiceGender : userVoiceGender;
    
    // Filtro heurístico de voces según género (basado en nombres comunes de voces del sistema)
    const matchingVoice = voices.find(v => 
      v.lang.startsWith(langCode.split('-')[0]) && 
      (genderToFind === 'femenino' 
        ? /female|woman|zira|samantha|helena|laura/i.test(v.name)
        : /male|man|david|mark|pablo|sergio/i.test(v.name))
    ) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (matchingVoice) utterance.voice = matchingVoice;
    
    utterance.onend = () => {
      setIsNativeTurn(prev => !prev);
      isAutoRestarting.current = true;
    };

    window.speechSynthesis.speak(utterance);
  }, [isNativeTurn, userVoiceGender, partnerVoiceGender]);

  // --- TRADUCCIÓN DIRECTA ---
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
      toast({ title: "Error de Traducción", description: "Se perdió la señal espacial.", variant: "destructive" });
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- CONTROL DE CÁMARA (ESTRICTO) ---
  useEffect(() => {
    async function toggleCameraHardware() {
      if (isCameraActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: false 
          });
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Hardware Camera Error:", err);
          setIsCameraActive(false);
          toast({ title: "Error de Cámara", description: "No se pudo acceder al hardware.", variant: "destructive" });
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    }
    toggleCameraHardware();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

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
        // Envío directo al backend, sin guardar en estado intermedio
        handleTranslation(transcript);
      };

      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [nativeLanguage, targetLanguage, isNativeTurn]);

  // Auto-reinicio del micro tras cambio de turno
  useEffect(() => {
    if (isAutoRestarting.current && !isRecording && !isProcessing) {
      isAutoRestarting.current = false;
      startMic();
    }
  }, [isNativeTurn, isRecording, isProcessing]);

  const startMic = () => {
    if (!recognitionRef.current || isRecording || isProcessing) return;
    const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
    recognitionRef.current.lang = langMap[currentLang] || 'en-US';
    try { recognitionRef.current.start(); } catch (e) {}
  };

  const toggleSession = () => {
    if (isRecording) recognitionRef.current?.stop();
    else startMic();
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 pb-32 relative">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      {/* HEADER */}
      <header className="relative z-10 w-full max-w-4xl mt-4 mb-8 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-primary/20">
          <ArrowRightLeft className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-white/60">Traductor Espacial Dual</span>
        </div>
      </header>

      {/* VISTA PREVIA CÁMARA (Opcional) */}
      {isCameraActive && (
        <div className="relative z-20 w-full max-w-lg aspect-video mb-6 glass-panel rounded-[2rem] overflow-hidden border-primary/20 bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 bg-rose-500 px-3 py-1 rounded-full text-[10px] font-headline text-white animate-pulse">LIVE</div>
        </div>
      )}

      {/* BENTO GRID DE TURNOS (RESPONSIVE) */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row gap-4 mb-6">
        {/* Mi Turno (Nativo) */}
        <div className={cn(
          "flex-1 glass-panel p-6 rounded-[2rem] transition-all duration-700 border-2",
          isNativeTurn ? "border-primary bg-primary/10 shadow-xl shadow-primary/20" : "border-white/5 opacity-40 grayscale"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isNativeTurn ? "bg-primary text-white" : "bg-white/5")}>
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-headline uppercase tracking-widest text-primary/80">Mi Turno ({userVoiceGender})</p>
              <h3 className="text-lg font-headline font-bold text-white">{nativeLanguage}</h3>
            </div>
          </div>
          <div className="h-12 flex items-center justify-center border-t border-white/5 pt-2">
            {isNativeTurn && isRecording && <div className="flex gap-1 h-6 items-center"><div className="w-1 bg-primary animate-bounce h-3" /><div className="w-1 bg-primary animate-bounce h-6 [animation-delay:0.2s]" /><div className="w-1 bg-primary animate-bounce h-4 [animation-delay:0.4s]" /></div>}
            {!isNativeTurn && <p className="text-[10px] text-white/20 italic">En espera...</p>}
          </div>
        </div>

        {/* Turno Invitado (Objetivo) */}
        <div className={cn(
          "flex-1 glass-panel p-6 rounded-[2rem] transition-all duration-700 border-2",
          !isNativeTurn ? "border-secondary bg-secondary/10 shadow-xl shadow-secondary/20" : "border-white/5 opacity-40 grayscale"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", !isNativeTurn ? "bg-secondary text-white" : "bg-white/5")}>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-headline uppercase tracking-widest text-secondary/80">Invitado ({partnerVoiceGender})</p>
              <h3 className="text-lg font-headline font-bold text-white">{targetLanguage}</h3>
            </div>
          </div>
          <div className="h-12 flex items-center justify-center border-t border-white/5 pt-2">
            {!isNativeTurn && isRecording && <div className="flex gap-1 h-6 items-center"><div className="w-1 bg-secondary animate-bounce h-3" /><div className="w-1 bg-secondary animate-bounce h-6 [animation-delay:0.2s]" /><div className="w-1 bg-secondary animate-bounce h-4 [animation-delay:0.4s]" /></div>}
            {isNativeTurn && <p className="text-[10px] text-white/20 italic">En espera...</p>}
          </div>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="relative z-10 w-full max-w-5xl flex-1 glass-panel rounded-[2.5rem] border-white/5 bg-white/5 overflow-hidden flex flex-col min-h-[300px]">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {history.length === 0 && !isProcessing && (
              <div className="h-40 flex flex-col items-center justify-center text-white/20 gap-3 opacity-50">
                <Sparkles className="w-10 h-10 animate-pulse" />
                <p className="font-headline text-[10px] uppercase tracking-[0.3em]">Comienza a hablar</p>
              </div>
            )}
            
            {history.map((item, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={cn(
                  "p-6 rounded-[1.5rem] border space-y-3",
                  item.from === nativeLanguage ? "bg-primary/5 border-primary/20" : "bg-secondary/5 border-secondary/20"
                )}>
                  <div className="flex items-center justify-between opacity-30">
                    <span className="text-[9px] font-headline uppercase tracking-widest">{item.from} → {item.to}</span>
                    <span className="text-[9px]">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-white/40 italic leading-relaxed">"{item.original}"</p>
                  <div className="h-px bg-white/5" />
                  <p className="text-xl font-headline font-bold text-white tracking-tight leading-tight">
                    {item.translated}
                  </p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-center py-6">
                <div className="flex items-center gap-3 glass-panel px-6 py-3 rounded-full border-primary/40 animate-pulse">
                  <RefreshCcw className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-[10px] font-headline text-primary uppercase tracking-[0.2em]">Traduciendo...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CONTROLES FLOTANTES */}
      <div className="fixed bottom-28 z-40 flex items-center gap-6">
        <Button
          variant="outline"
          onClick={() => setIsCameraActive(!isCameraActive)}
          className={cn(
            "h-16 w-16 rounded-full border border-white/10 transition-all squish-effect",
            isCameraActive ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/40"
          )}
        >
          {isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
        </Button>

        <div className="relative group">
          {isRecording && (
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping blur-2xl opacity-40",
              isNativeTurn ? "bg-primary" : "bg-secondary"
            )} />
          )}
          <Button
            onClick={toggleSession}
            disabled={isProcessing}
            className={cn(
              "h-24 w-24 rounded-full transition-all duration-500 shadow-2xl squish-effect relative z-10",
              isRecording 
                ? (isNativeTurn ? "bg-primary scale-105" : "bg-secondary scale-105") 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            )}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
        </div>
      </div>
    </main>
  );
}
