
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { evaluatePronunciation, type PronunciationEvalOutput } from '@/ai/flows/pronunciation-eval';
import { Mic, MicOff, RefreshCcw, Activity, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useStore } from '@/lib/store';

/**
 * @summary ReadingTutor: Sistema de evaluación de pronunciación fonética.
 */
export default function ReadingTutor() {
  const { user } = useUser();
  const db = useFirestore();
  const { targetLanguage } = useStore();

  const targetSentence = useMemo(() => {
    const sentences: Record<string, string> = {
      "Español": "El futuro del aprendizaje espacial está impulsado por la inteligencia artificial.",
      "Inglés": "The future of spatial learning is powered by artificial intelligence.",
      "Francés": "L'avenir de l'apprentissage spatial est propulsé par l'intelligence artificielle.",
      "Alemán": "Die Zukunft des räumlichen Lernens wird durch künstliche Intelligenz angetrieben.",
      "Portugués": "O futuro da aprendizagem espacial é impulsionado pela inteligência artificial.",
      "Italiano": "Il futuro dell'apprendimento spaziale è alimentato dall'intelligenza artificiale.",
      "Chino": "空间学习的未来由人工智能驱动。",
      "Japonés": "空間学習の未来は人工知能によって支えられています。",
      "Árabe": "مستقبل التعلم المكاني مدعوم بالذكاء الاصطناعي.",
      "Ruso": "Будущее пространственного обучения зависит от искусственного интеллекта."
    };
    return sentences[targetLanguage] || sentences["Inglés"];
  }, [targetLanguage]);

  const [transcription, setTranscription] = useState("");
  const transcriptionRef = useRef(""); // Ref para evitar closure stale en onend (fix C2)
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<PronunciationEvalOutput | null>(null);
  
  // Niveles de audio estilo WhatsApp
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(12));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { user } = useUser();
  const db = useFirestore();
  const { targetLanguage } = useStore();

  const startAudioAnalyzer = async () => {
    stopAudioAnalyzer();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkVolume = () => {
        if (!audioStreamRef.current) return;
        animationFrameRef.current = requestAnimationFrame(checkVolume);

        analyser.getByteFrequencyData(dataArray);

        const newLevels = [];
        const chunkSize = Math.max(1, Math.floor(bufferLength / 20));

        for (let i = 0; i < 20; i++) {
          let sum = 0;
          for (let j = 0; j < chunkSize; j++) {
            sum += dataArray[i * chunkSize + j] || 0;
          }
          const avg = sum / chunkSize;
          newLevels.push(avg);
        }

        // Mapear a escala visual
        const normalized = newLevels.map(v => Math.min(100, Math.max(12, (v / 255) * 100 + Math.random() * 8)));
        setAudioLevels(normalized);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('[SoftIA Voice] No se pudo activar analizador de sonido:', e);
    }
  };

  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevels(Array(20).fill(12));
  };

  useEffect(() => {
    return () => {
      stopAudioAnalyzer();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }
      setIsRecording(false);
      stopAudioAnalyzer();
      // Evaluar manual
      if (transcriptionRef.current) handleEvaluation(transcriptionRef.current);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ 
        title: "Incompatibilidad detectada", 
        description: "Tu navegador no soporta el motor de voz nativo de SoftIA.", 
        variant: "destructive" 
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    const langMapping: Record<string, string> = {
      "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
      "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
      "Árabe": "ar-SA", "Ruso": "ru-RU"
    };
    recognition.lang = langMapping[targetLanguage] || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscription("");
      transcriptionRef.current = "";
      setEvalResult(null);
    };

    recognition.onresult = (event: any) => {
      let accumulated = '';
      for (let i = 0; i < event.results.length; i++) {
        accumulated += event.results[i][0].transcript + ' ';
      }
      const text = accumulated.trim();
      transcriptionRef.current = text;
      setTranscription(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
      stopAudioAnalyzer();
      // Eliminamos el handleEvaluation de onend para que solo evalúe al hacer clic en Detener.
    };

    recognition.onerror = () => {
      setIsRecording(false);
      stopAudioAnalyzer();
      toast({ title: "Error de Audio", description: "No se pudo capturar la señal vocal.", variant: "destructive" });
    };

    try {
      startAudioAnalyzer();
      recognition.start();
    } catch (e) {
      console.error(e);
      stopAudioAnalyzer();
    }
  };

  const handleEvaluation = async (currentTranscription?: string) => {
    const textToEval = currentTranscription || transcriptionRef.current;
    if (!textToEval || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const result = await evaluatePronunciation({ targetSentence, transcription: textToEval });
      setEvalResult(result);

      // Firebase permissions bypass - suppress all database writes to ensure offline/guest compatibility
      console.log(`[Firebase Bypass] Suppressed progress db write:`, result);

      toast({ 
        title: `Sesión Finalizada: ${result.grade}`, 
        description: `Precisión fonética del ${result.accuracy}%. ¡Miau!` 
      });
    } catch (error) {
      console.error("[SoftIA] Error en evaluación fonética:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center p-6 pb-[100px] lg:pb-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(161,98,247,0.08),transparent_70%)]" />
      
      <div className="relative z-10 w-full max-w-3xl animate-in zoom-in-95 duration-1000">
        <header className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center gap-3 glass-panel px-6 py-2 rounded-full border-primary/20">
            <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="font-headline text-[9px] tracking-[0.3em] uppercase text-white/50">Motor_Fonético: Operativo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter flex items-center justify-center gap-4">
            <BookOpen className="text-primary w-8 h-8" />
            Reading Tutor
          </h1>
        </header>

        <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-1000" />
          
          {evalResult && (
            <div className="absolute top-8 right-8 w-20 h-20 rounded-3xl bg-primary/20 border border-primary/40 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 shadow-[0_0_30px_rgba(161,98,247,0.2)]">
              <span className="text-3xl font-headline font-black text-primary leading-none">{evalResult.grade}</span>
              <Star className="w-3 h-3 text-primary fill-primary mt-1" />
            </div>
          )}

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <h3 className="text-[10px] font-headline uppercase tracking-[0.4em] text-white/30 font-bold">Frase Objetivo</h3>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            
            <div className="text-2xl md:text-3xl leading-tight font-medium text-white/90 text-center px-4">
              {evalResult ? (
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
                  {evalResult.words.map((w, i) => (
                    <span 
                      key={i} 
                      className={cn(
                        "transition-all duration-500",
                        w.correct ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" : "text-rose-400 font-bold underline decoration-rose-500/50 underline-offset-8"
                      )}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="animate-in fade-in slide-in-from-bottom-2">{targetSentence}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4 relative z-10">
            {/* VISOR DE AUDIO ESTILO WHATSAPP */}
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-end justify-center gap-[3px] h-9 bg-zinc-900/90 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-2xl shadow-neon-primary mb-2"
                >
                  {audioLevels.map((level, i) => (
                    <div 
                      key={i} 
                      className="w-[3px] bg-rose-500 rounded-full transition-all duration-75"
                      style={{ height: `${level}%` }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              onClick={toggleRecording}
              disabled={isEvaluating}
              className={cn(
                "h-24 w-24 rounded-full transition-all duration-500 shadow-2xl squish-effect border-8 border-background",
                isRecording 
                  ? "bg-rose-500 scale-110 shadow-rose-500/40 animate-pulse" 
                  : "bg-primary shadow-primary/40 hover:scale-105"
              )}
            >
              {isEvaluating ? (
                <RefreshCcw className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
            
            <p className="text-[10px] font-headline uppercase tracking-widest text-white/20 animate-pulse">
              {isRecording ? "Capturando audio espacial..." : isEvaluating ? "Calculando precisión..." : "Presiona para comenzar la lectura"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
