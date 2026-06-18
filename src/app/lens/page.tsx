
"use client";

import { useState, useEffect, useRef } from 'react';
import { arTextTranslation, type ARTextTranslationOutput } from '@/ai/flows/ar-text-translation';
import { Sparkles, Radio, Languages, MousePointer2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * @summary ARLens: Escáner espacial activado por toque.
 * Lógica de ciclo de vida de hardware v5.0 optimizada para prevenir fugas de memoria.
 */
export default function ARLens() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<ARTextTranslationOutput['detections']>([]);
  const [latestDetection, setLatestDetection] = useState<{original: string, translated: string} | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tapRipple, setTapRipple] = useState<{ x: number, y: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const db = useFirestore();

  // --- GESTIÓN CRÍTICA DEL HARDWARE (CÁMARA) ---
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        console.log(`[SoftIA Hardware] AR Lens inicializado: ${stream.id}`);
      } catch (err) {
        console.error("[SoftIA Hardware] Fallo al acceder al hardware de cámara:", err);
        setCameraError("VISIÓN_OFF: Acceso denegado o hardware no detectado.");
      }
    }
    
    startCamera();

    // LIMPIEZA TOTAL: Apagar hardware instantáneamente para mitigar consumo de batería
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          track.stop();
          console.log(`[SoftIA Hardware] AR Lens track destruido: ${track.kind} - ${track.label}`);
        });
        activeStream = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      const result = await arTextTranslation({
        photoDataUri: base64Image,
        targetLanguage: 'Español'
      });

      setDetections(result.detections);
      
      if (result.detections.length > 0) {
        const first = result.detections[0];
        setLatestDetection({ original: first.originalText, translated: first.translatedText });

        addDoc(collection(db, 'chat_history'), {
          role: 'model',
          content: `Traducción AR: "${first.originalText}" -> "${first.translatedText}"`,
          timestamp: new Date().toISOString(),
          user_email: 'demo@softia.com',
          metadata: { type: 'ar_tap_scan' }
        });
      }
    } catch (error) {
      console.warn("Error en escaneo táctil:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isProcessing || cameraError) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTapRipple({ x, y });
    setTimeout(() => setTapRipple(null), 1000);
    captureAndAnalyze();
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      
      <div 
        ref={containerRef}
        onClick={handleViewportClick}
        className="w-full max-w-6xl aspect-[16/9] glass-panel rounded-[3.5rem] relative overflow-hidden border-white/5 shadow-2xl cursor-crosshair group"
      >
        <div className="absolute inset-0 z-0 bg-neutral-950">
          {!cameraError ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
              <Radio className="w-16 h-16 mb-4 animate-pulse" />
              <p className="font-headline tracking-widest uppercase text-[10px]">{cameraError}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {tapRipple && (
          <div className="absolute z-50 pointer-events-none" style={{ left: `${tapRipple.x}%`, top: `${tapRipple.y}%` }}>
            <div className="w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/20 animate-ping" />
            <div className="w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_15px_rgba(161,98,247,0.8)]" />
          </div>
        )}

        {/* HUD Detecciones */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {detections.map((det, index) => (
            <div key={`${index}`} className="absolute animate-in fade-in zoom-in duration-700" style={{ left: `${det.x}%`, top: `${det.y}%` }}>
              <div className="bg-primary/20 backdrop-blur-md border border-primary/40 px-5 py-2 rounded-full -translate-x-1/2 -translate-y-1/2">
                <span className="text-white text-[11px] font-headline font-bold uppercase tracking-wider">{det.translatedText}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Telemetría */}
        <div className="absolute top-10 left-10 z-30 flex flex-col gap-3 pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border-primary/20">
            <MousePointer2 className="w-4 h-4 text-primary animate-bounce" />
            <span className="text-[10px] text-white font-headline font-bold uppercase tracking-widest">Toca para Escanear</span>
          </div>
        </div>

        {/* Dashboard Inferior */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xl pointer-events-none">
          <div className="glass-panel p-6 rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border-white/10 shadow-2xl flex flex-col items-center text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <Sparkles className="w-6 h-6 text-primary animate-spin" />
                <span className="text-xs font-headline text-primary uppercase tracking-[0.2em] animate-pulse">Analizando...</span>
              </div>
            ) : latestDetection ? (
              <div className="w-full space-y-2 animate-in fade-in">
                <p className="text-xs text-primary font-medium italic opacity-70">"{latestDetection.original}"</p>
                <p className="text-lg md:text-xl font-headline font-bold text-white tracking-tight">{latestDetection.translated}</p>
              </div>
            ) : (
              <span className="text-[10px] font-headline text-white/40 uppercase tracking-[0.3em] py-4">Sistema de Visión Listo</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
