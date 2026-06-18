
"use client";

import { useState, useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { arTextTranslation, type ARTextTranslationOutput } from '@/ai/flows/ar-text-translation';
import { Sparkles, Activity, Cpu, Zap, Radio } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

/**
 * ARLens: Escáner espacial automático continuo.
 * Utiliza visión computacional de Gemini para traducir el entorno en tiempo real.
 */
export default function ARLens() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<ARTextTranslationOutput['detections']>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const db = useFirestore();

  // --- INICIALIZACIÓN DE CÁMARA ---
  useEffect(() => {
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Fallo al acceder al hardware de cámara:", err);
        setCameraError("VISIÓN_OFF: No se detectó entrada de video.");
      }
    }
    startCamera();

    // Limpieza de tracks al desmontar
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // --- BUCLE DE ESCANEO AUTOMÁTICO (Cada 3 segundos) ---
  useEffect(() => {
    const scanInterval = setInterval(() => {
      if (!isProcessing && videoRef.current && videoRef.current.readyState === 4) {
        captureAndAnalyze();
      }
    }, 4500); // Intervalo de 4.5s para balancear latencia y cuota de IA

    return () => clearInterval(scanInterval);
  }, [isProcessing]);

  /**
   * Captura el frame actual del video, lo convierte a Base64 y lo envía a Gemini.
   */
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Capturar frame del video
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // Llamada al flujo de traducción espacial
      const result = await arTextTranslation({
        photoDataUri: base64Image,
        targetLanguage: 'Español'
      });

      // Actualizar detecciones con animación
      setDetections(result.detections);

      // Persistencia silenciosa en Firestore
      if (result.detections.length > 0) {
        addDoc(collection(db, 'chat_history'), {
          role: 'model',
          content: `Módulo Visión: Detectados ${result.detections.length} elementos en el campo visual.`,
          timestamp: new Date().toISOString(),
          user_email: 'demo@softia.com',
          metadata: { type: 'auto_ar_scan', count: result.detections.length }
        });
      }

    } catch (error) {
      console.warn("Intervalo de escaneo omitido o error de IA:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 md:pl-32 overflow-hidden">
      <SidebarNav />

      {/* Viewport AR de Pantalla Completa Simulado */}
      <div className="w-full max-w-6xl aspect-[16/9] glass-panel rounded-[3.5rem] relative overflow-hidden border-white/5 shadow-2xl group">
        
        {/* Stream de Cámara en Vivo */}
        <div className="absolute inset-0 z-0 bg-neutral-950">
          {!cameraError ? (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
              <Radio className="w-16 h-16 mb-4 animate-pulse" />
              <p className="font-headline tracking-widest uppercase text-[10px]">{cameraError}</p>
            </div>
          )}
          
          {/* Overlay de gradiente para mejorar legibilidad de UI */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Canvas Oculto para Capturas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* ANIMACIÓN LÁSER DE ESCANEO CONTINUO */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_rgba(161,98,247,0.6)] animate-scan opacity-60" />
        </div>

        {/* HUD: Detecciones Espaciales con "Morphing Transitions" */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {detections.map((det, index) => (
            <div 
              key={`${index}-${det.translatedText}`}
              className="absolute animate-in fade-in zoom-in slide-in-from-bottom-2 duration-700 ease-out"
              style={{ left: `${det.x}%`, top: `${det.y}%`, transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              <div className="group pointer-events-auto relative -translate-x-1/2 -translate-y-1/2">
                <div className="bg-primary/20 backdrop-blur-md border border-primary/40 px-5 py-2 rounded-full shadow-2xl shadow-primary/20 flex items-center gap-3 transition-all hover:scale-110 hover:bg-primary/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-white text-[11px] font-headline font-bold uppercase tracking-wider">
                    {det.translatedText}
                  </span>
                </div>
                
                {/* Tooltip Holográfico */}
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-[9px] text-white/70 whitespace-nowrap flex flex-col items-center">
                    <span className="text-white/30 uppercase tracking-tighter mb-0.5">Original Source</span>
                    {det.originalText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ELEMENTOS DE TELEMETRÍA HUD (Decorativos y Funcionales) */}
        <div className="absolute top-10 left-10 z-30 flex flex-col gap-3 pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border-primary/20 animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-3 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-primary font-headline uppercase tracking-widest leading-none mb-1">Vision_Engine</span>
              <span className="text-[10px] text-white font-headline font-bold">SPATIAL_SYNC: {isProcessing ? "PROCESSING" : "ACTIVE"}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="glass-panel px-3 py-1.5 rounded-xl text-[8px] text-white/40 font-headline flex items-center gap-2">
              <Cpu className="w-3 h-3" /> LATENCY: 184MS
            </div>
            <div className="glass-panel px-3 py-1.5 rounded-xl text-[8px] text-white/40 font-headline flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-500" /> POWER: OPTIMIZED
            </div>
          </div>
        </div>

        {/* Notificación de Escaneo en Tiempo Real */}
        <div className="absolute bottom-10 right-10 z-30">
          <div className={cn(
            "flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-500",
            isProcessing ? "bg-primary/20 border-primary shadow-lg shadow-primary/20" : "bg-black/40 border-white/5 backdrop-blur-md"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isProcessing ? "bg-primary animate-ping" : "bg-white/20")} />
            <span className="text-[9px] font-headline text-white uppercase tracking-[0.2em]">
              {isProcessing ? "Analizando Geometría..." : "Escaneando Realidad"}
            </span>
          </div>
        </div>

        {/* Marcos de Esquina de Mira */}
        <div className="absolute top-6 left-6 w-16 h-16 border-t border-l border-white/10 rounded-tl-3xl pointer-events-none" />
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r border-white/10 rounded-tr-3xl pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l border-white/10 rounded-bl-3xl pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r border-white/10 rounded-br-3xl pointer-events-none" />
      </div>
    </main>
  );
}

