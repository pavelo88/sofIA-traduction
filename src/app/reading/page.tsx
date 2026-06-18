"use client";

import { useState, useEffect, useRef } from 'react';
import { evaluatePronunciation, type PronunciationEvalOutput } from '@/ai/flows/pronunciation-eval';
import { Mic, RefreshCcw, Star, CheckCircle2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * @summary ReadingTutor: Sistema de evaluación de pronunciación.
 * Ciclo de vida de cámara corregido para evitar drenaje de batería.
 */
export default function ReadingTutor() {
  const [targetSentence] = useState("The future of spatial learning is powered by artificial intelligence.");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<PronunciationEvalOutput | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const db = useFirestore();

  // --- GESTIÓN DE HARDWARE (CÁMARA BACKDROP) ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Cámara de fondo no disponible.");
      }
    }
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "No compatible", description: "Tu navegador no soporta voz nativa.", variant: "destructive" });
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
      setTranscription(event.results[current][0].transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (transcription) handleEvaluation();
    };

    recognition.start();
  };

  const handleEvaluation = async () => {
    if (!transcription || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const result = await evaluatePronunciation({ targetSentence, transcription });
      setEvalResult(result);

      await setDoc(doc(db, 'user_progress', 'demo-user'), {
        accuracy_percentage: result.accuracy,
        last_grade: result.grade,
        updated_at: new Date().toISOString()
      }, { merge: true });

      toast({ title: `¡Nota: ${result.grade}!`, description: `Precisión: ${result.accuracy}%` });
    } catch (error) {
      console.error(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-6">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 grayscale-[0.5]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-0" />

      <div className="relative z-10 w-full max-w-3xl animate-in zoom-in-95 duration-700">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-primary/20 mb-4">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-headline text-[10px] tracking-[0.2em] uppercase text-white/60">Audio_Sync: Activo</span>
          </div>
          <h1 className="text-4xl font-headline font-bold text-white tracking-tighter">Práctica de Pronunciación</h1>
        </header>

        <div className="glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl space-y-8 relative">
          {evalResult && (
            <div className="absolute top-6 right-6 w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-bounce">
              <span className="text-2xl font-headline font-black text-primary">{evalResult.grade}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-headline uppercase tracking-widest text-white/30">Target_Sentence</h3>
            <div className="text-2xl leading-snug font-medium text-white/90">
              {evalResult ? (
                <div className="flex flex-wrap gap-2">
                  {evalResult.words.map((w, i) => (
                    <span key={i} className={cn(w.correct ? "text-emerald-400" : "text-rose-400 font-bold underline")}>{w.word}</span>
                  ))}
                </div>
              ) : <p>{targetSentence}</p>}
            </div>
          </div>

          <div className="flex justify-center pt-6">
            <Button 
              onClick={startSpeechRecognition}
              disabled={isRecording || isEvaluating}
              className={cn(
                "h-20 w-20 rounded-full transition-all duration-500 shadow-2xl squish-effect",
                isRecording ? "bg-rose-500 scale-110" : "bg-primary shadow-primary/40"
              )}
            >
              {isEvaluating ? <RefreshCcw className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
