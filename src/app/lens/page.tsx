"use client";

import { useState, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { arTextTranslation } from '@/ai/flows/ar-text-translation';
import { Camera, Upload, RefreshCcw, Languages, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

export default function ARLens() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const [targetLang, setTargetLang] = useState('Español');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateTranslation, incrementProgress } = useStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Simulación de llamada al flujo de Genkit
        const translation = await arTextTranslation({
          photoDataUri: base64String,
          targetLanguage: targetLang
        });

        setResult(translation);
        updateTranslation(translation.originalText, translation.translatedText);
        incrementProgress(5);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error de IA",
        description: "No se pudo procesar la imagen. Verifica tu conexión.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 md:pl-32">
      <SidebarNav />

      {/* AR Viewport Simulator */}
      <div className="w-full max-w-4xl aspect-[16/9] glass-panel rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border-white/5 shadow-2xl">
        <div className="scanline" />
        
        {!result && !isProcessing && (
          <div className="text-center space-y-6 z-20">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 animate-pulse-glow">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-2xl mb-2 text-white">AR Vision Lens</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Sube una imagen o activa la cámara para traducir texto en tiempo real.
              </p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="glass-button h-12 px-8 rounded-2xl flex items-center gap-2 text-white"
              >
                <Upload className="w-4 h-4" /> Subir Prueba
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <RefreshCcw className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="font-headline text-primary">Procesando OCR & Gemini Cloud...</p>
          </div>
        )}

        {result && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm p-12 flex flex-col justify-center items-center z-30 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-full max-w-2xl space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-headline uppercase tracking-widest text-primary/80">Original</span>
                <div className="glass-panel p-6 rounded-2xl border-white/10 text-xl text-white/60 italic">
                  "{result.originalText}"
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-headline uppercase tracking-widest text-secondary">Traducción ({targetLang})</span>
                <div className="glass-panel p-8 rounded-2xl border-primary/30 bg-primary/10 text-2xl font-headline text-white shadow-primary/20 shadow-2xl">
                  {result.translatedText}
                </div>
              </div>

              <Button 
                onClick={() => setResult(null)}
                variant="ghost" 
                className="mx-auto flex items-center gap-2 text-muted-foreground hover:text-white"
              >
                <RefreshCcw className="w-4 h-4" /> Nueva Captura
              </Button>
            </div>
          </div>
        )}

        {/* HUD Elements */}
        <div className="absolute top-6 left-6 flex items-center gap-4 z-40">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-xs border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500" /> SYSTEM_ONLINE
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-xs border-white/5">
            <Languages className="w-3 h-3 text-primary" /> {targetLang}
          </div>
        </div>
      </div>
    </main>
  );
}
