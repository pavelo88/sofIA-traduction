
"use client";

import { useState, useEffect, useRef } from 'react';
import { arTextTranslation, type ARTextTranslationOutput } from '@/ai/flows/ar-text-translation';
import { Sparkles, Radio, MousePointer2, Info, Camera, ScanText } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * @summary ARLens: Escáner espacial inmersivo de pantalla completa (Cinematic Experience).
 * Refactorización v7.1: Sincronización con subcolección de historial por usuario.
 */
export default function ARLens() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<ARTextTranslationOutput['detections']>([]);
  const [latestDetection, setLatestDetection] = useState<{original: string, translated: string} | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tapRipple, setTapRipple] = useState<{ x: number, y: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useUser();
  const db = useFirestore();

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
      } catch (err) {
        setCameraError("Acceso al hardware de cámara denegado.");
      }
    }
    
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
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
      
      if (result.detections.length > 0 && user?.uid) {
        const first = result.detections[0];
        setLatestDetection({ original: first.originalText, translated: first.translatedText });

        addDoc(collection(db, 'users', user.uid, 'chat_history'), {
          role: 'model',
          content: `Traducción AR: "${first.originalText}" -> "${first.translatedText}"`,
          timestamp: new Date().toISOString(),
          user_email: user.email || 'guest@softia.com',
          user_id: user.uid,
          metadata: { type: 'ar_tap_scan' }
        });
      }
    } catch (error) {
      console.warn("[SoftIA Lens] Error en escaneo espacial:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isProcessing || cameraError) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    setTapRipple({ x, y });
    setTimeout(() => setTapRipple(null), 1000);
    captureAndAnalyze();
  };

  return (
    <main 
      className="fixed inset-0 bg-black overflow-hidden cursor-crosshair group"
      onClick={handleViewportClick}
    >
      <div className="absolute inset-0 z-0">
        {!cameraError ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover z-0 rounded-none opacity-90 transition-opacity duration-1000" 
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 bg-zinc-950 z-0">
            <Radio className="w-16 h-16 mb-4 animate-pulse" />
            <p className="font-headline tracking-widest uppercase text-[10px]">{cameraError}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none z-[1]" />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {tapRipple && (
        <div className="absolute z-50 pointer-events-none" style={{ left: `${tapRipple.x}%`, top: `${tapRipple.y}%` }}>
          <div className="w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-primary/10 animate-ping" />
          <div className="w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_20px_rgba(161,98,247,0.9)]" />
        </div>
      )}

      <div className="absolute inset-0 z-20 pointer-events-none">
        {detections.map((det, index) => (
          <div key={`${index}`} className="absolute animate-in fade-in zoom-in duration-700" style={{ left: `${det.x}%`, top: `${det.y}%` }}>
            <div className="bg-primary/30 backdrop-blur-2xl border border-primary/40 px-5 py-2 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-2xl flex items-center gap-2">
              <ScanText className="w-3 h-3 text-primary" />
              <span className="text-white text-[10px] font-headline font-bold uppercase tracking-widest">{det.translatedText}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-10 left-10 right-10 z-30 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-3">
          <MousePointer2 className="w-3.5 h-3.5 text-primary animate-bounce" />
          <span className="text-[9px] text-white/70 font-headline font-bold uppercase tracking-[0.2em]">Interactúa con el entorno</span>
        </div>
        
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          <span className="text-[9px] text-white/70 font-headline font-bold uppercase tracking-[0.2em]">Spatial_Eye: v4.0</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl pointer-events-none">
        <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center transition-all duration-700 pointer-events-auto">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="relative">
                <Sparkles className="w-10 h-10 text-primary animate-spin" />
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-headline text-primary font-bold uppercase tracking-[0.3em]">Analizando Matriz Espacial</span>
                <p className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Procesando visión por computadora...</p>
              </div>
            </div>
          ) : latestDetection ? (
            <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center gap-3 text-white/40">
                <div className="h-px w-8 bg-white/10" />
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Traducción Confirmada</span>
                <div className="h-px w-8 bg-white/10" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-primary/60 font-medium italic">"{latestDetection.original}"</p>
                <p className="text-2xl md:text-3xl font-headline font-bold text-white tracking-tight leading-tight">
                  {latestDetection.translated}
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[8px] text-white/20 uppercase tracking-[0.4em]">Toca otra vez para escanear</span>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-2">
                <Camera className="w-6 h-6 text-white/20" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-headline text-white/50 uppercase tracking-[0.4em]">Lente AR SoftIA</span>
                <p className="text-[8px] text-white/30 uppercase tracking-widest font-medium">Enfoca cualquier texto del mundo real</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
