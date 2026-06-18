"use client";

import { useState, useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { evaluatePronunciation, type PronunciationEvalOutput } from '@/ai/flows/pronunciation-eval';
import { Mic, RefreshCcw, Star, CheckCircle2, XCircle, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * ReadingTutor: Sistema de evaluación de pronunciación con visión AR de fondo.
 */
export default function ReadingTutor() {
  // --- ESTADOS DE LA FRASE Y EVALUACIÓN ---
  const [targetSentence] = useState("The future of spatial learning is powered by artificial intelligence.");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<PronunciationEvalOutput | null>(null);

  // --- REFERENCIAS DE CÁMARA (AR Background) ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const db = useFirestore();

  // --- LÓGICA DE CÁMARA (REUTILIZADA DEL HOME) ---
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("No se pudo activar la cámara para el fondo AR.");
      }
    }
    startCamera();
  }, []);

  // --- RECONOCIMIENTO DE VOZ (Web Speech API) ---
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Navegador no compatible",
        description: "Tu navegador no soporta el reconocimiento de voz nativo.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscription("");
      setEvalResult(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscription(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (transcription) handleEvaluation();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error", event.error);
      setIsRecording(false);
    };

    recognition.start();
  };

  /**
   * Envía la transcripción a Gemini y actualiza Firestore.
   */
  const handleEvaluation = async () => {
    if (!transcription || isEvaluating) return;
    setIsEvaluating(true);

    try {
      // 1. Llamada a la IA de Evaluación
      const result = await evaluatePronunciation({
        targetSentence,
        transcription
      });
      setEvalResult(result);

      // 2. Persistencia: Actualizar progreso del usuario en tiempo real
      await setDoc(doc(db, 'user_progress', 'demo-user'), {
        accuracy_percentage: result.accuracy,
        last_grade: result.grade,
        updated_at: new Date().toISOString()
      }, { merge: true });

      toast({
        title: `¡Sesión Terminada! Nota: ${result.grade}`,
        description: `Has alcanzado un ${result.accuracy}% de precisión.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error en la evaluación",
        description: "Kitten no pudo analizar tu pronunciación.",
        variant: "destructive"
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-6 md:pl-32">
      
      {/* Background AR Feed */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 grayscale-[0.5]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0" />

      <SidebarNav />

      {/* Contenedor Principal Lector */}
      <div className="relative z-10 w-full max-w-3xl animate-in zoom-in-95 duration-700">
        
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-primary/20 mb-4">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-headline text-[10px] tracking-[0.2em] uppercase text-white/60">Tutor de Lectura Proactivo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter">
            Práctica de <span className="text-primary">Pronunciación</span>
          </h1>
        </header>

        {/* Card de Lectura Glassmorphism */}
        <div className="glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
          
          {/* Decoración de Grado si existe */}
          {evalResult && (
            <div className="absolute top-6 right-6 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-bounce">
              <span className="text-2xl font-headline font-black text-primary">{evalResult.grade}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-headline uppercase tracking-widest text-white/30">Frase Objetivo (Inglés)</h3>
            <div className="text-2xl md:text-3xl leading-snug font-medium text-white/90">
              {evalResult ? (
                <div className="flex flex-wrap gap-2">
                  {evalResult.words.map((w, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        "transition-colors duration-500",
                        w.correct ? "text-emerald-400" : "text-rose-400 font-bold underline decoration-rose-500/30"
                      )}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              ) : (
                <p>{targetSentence}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-headline uppercase tracking-widest text-white/30">Tu Transcripción</h3>
            <p className={cn(
              "text-lg italic min-h-[3rem]",
              isRecording ? "text-primary animate-pulse" : "text-white/60"
            )}>
              {transcription || (isRecording ? "Escuchando..." : "Presiona el botón para empezar a hablar...")}
            </p>
          </div>

          {/* Controles */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={startSpeechRecognition}
              disabled={isRecording || isEvaluating}
              className={cn(
                "h-24 w-24 rounded-full transition-all duration-500 shadow-2xl squish-effect group",
                isRecording 
                  ? "bg-rose-500 hover:bg-rose-600 scale-110 shadow-rose-500/40" 
                  : "bg-primary hover:bg-primary/80 shadow-primary/40"
              )}
            >
              {isEvaluating ? (
                <RefreshCcw className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Mic className={cn("w-8 h-8 text-white", isRecording && "animate-pulse")} />
              )}
            </Button>
          </div>
        </div>

        {/* HUD de progreso rápido */}
        <div className="mt-8 flex justify-center gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase font-headline">Precisión Media</p>
              <p className="text-xl font-headline font-bold text-white">{evalResult?.accuracy ?? "0"}%</p>
            </div>
          </div>
          {evalResult && (
            <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <p className="text-[10px] text-white/40 uppercase font-headline">Estado</p>
                <p className="text-xl font-headline font-bold text-emerald-400">¡Superado!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decoraciones HUD */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-20">
        <div className="glass-panel px-4 py-2 rounded-full border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-headline text-white/60 tracking-widest uppercase">AUDIO_SYNC: ACTIVE</span>
        </div>
      </div>
    </main>
  );
}
