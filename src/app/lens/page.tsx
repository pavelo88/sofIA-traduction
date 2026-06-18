"use client";

import { useState, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { arTextTranslation, type ARTextTranslationOutput } from '@/ai/flows/ar-text-translation';
import { Camera, Upload, RefreshCcw, Languages, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

/**
 * Pantalla ARLens: Simulador de visión espacial con Gemini Vision.
 */
export default function ARLens() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<ARTextTranslationOutput['detections']>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = useFirestore();

  /**
   * Procesa la imagen subida, llama a Gemini Vision y guarda en Firestore.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDetections([]);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setCapturedImage(base64String);

      try {
        // 1. Llamada a la IA (OCR Espacial)
        const result = await arTextTranslation({
          photoDataUri: base64String,
          targetLanguage: 'Español'
        });

        setDetections(result.detections);

        // 2. Persistencia: Guardar el hallazgo en Firestore
        if (result.detections.length > 0) {
          addDoc(collection(db, 'chat_history'), {
            role: 'model',
            content: `He detectado y traducido ${result.detections.length} textos en tu entorno. ¡El mundo ahora es más claro! 🐱✨`,
            timestamp: new Date().toISOString(),
            user_email: 'demo@softia.com',
            metadata: { type: 'ar_detection', count: result.detections.length }
          });
        }

      } catch (error) {
        console.error(error);
        toast({
          title: "Error de Escaneo",
          description: "Kitten no pudo procesar la imagen espacial. Revisa tu conexión.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 md:pl-32">
      <SidebarNav />

      {/* Viewport AR */}
      <div className="w-full max-w-5xl aspect-[16/9] glass-panel rounded-[3rem] relative overflow-hidden border-white/5 shadow-2xl">
        
        {/* Fondo: Imagen capturada o placeholder */}
        <div className="absolute inset-0 z-0 bg-neutral-900">
          {capturedImage ? (
            <img src={capturedImage} alt="AR Viewport" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
              <Camera className="w-20 h-20 mb-4 animate-pulse" />
              <p className="font-headline tracking-widest uppercase text-xs">Waiting for spatial input...</p>
            </div>
          )}
        </div>

        {/* Capa de Escaneo (Animación) */}
        {isProcessing && <div className="ar-scanner absolute inset-0 z-10 pointer-events-none" />}

        {/* HUD: Detecciones Espaciales */}
        {!isProcessing && detections.map((det, index) => (
          <div 
            key={index}
            className="absolute z-20 animate-in fade-in zoom-in duration-500"
            style={{ left: `${det.x}%`, top: `${det.y}%` }}
          >
            <div className="group relative -translate-x-1/2 -translate-y-1/2">
              <div className="bg-primary/30 backdrop-blur-md border border-primary/50 px-4 py-2 rounded-full shadow-2xl shadow-primary/40 flex items-center gap-2 cursor-help transition-transform hover:scale-110">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-white text-xs font-headline font-bold uppercase">{det.translatedText}</span>
              </div>
              
              {/* Tooltip con texto original al hacer hover */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-[10px] text-white/60 whitespace-nowrap">
                Original: {det.originalText}
              </div>
            </div>
          </div>
        ))}

        {/* Controles de Interfaz */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center gap-4 z-30">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="h-16 px-8 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-xl text-white font-headline gap-3 squish-effect"
          >
            {isProcessing ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
            {isProcessing ? "ANALIZANDO ENTORNO..." : "CAPTURAR REALIDAD"}
          </Button>

          {capturedImage && !isProcessing && (
            <Button 
              onClick={() => { setCapturedImage(null); setDetections([]); }}
              variant="ghost"
              className="h-16 w-16 rounded-2xl bg-black/40 text-white hover:bg-black/60 border border-white/5"
            >
              <RefreshCcw className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Elementos Decorativos HUD */}
        <div className="absolute top-8 left-8 z-30 flex items-center gap-4">
          <div className="glass-panel px-4 py-2 rounded-full text-[10px] text-primary font-headline tracking-tighter border-primary/20">
            AI_VISION_MODULE: ACTIVE
          </div>
          <div className="glass-panel px-4 py-2 rounded-full text-[10px] text-white/40 font-headline tracking-tighter">
            LATENCY: 142MS
          </div>
        </div>
      </div>
    </main>
  );
}
