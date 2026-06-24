"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Upload, FileText, Camera, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ original: string; translated: string } | null>(null);
  const { targetLanguage, saveGenericSession } = useStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetLanguage', targetLanguage);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el documento');
      }

      setResult({ original: data.original, translated: data.translated });
      
      // Guardar en historial
      saveGenericSession('documentos' as any, `Documento ${file.name.substring(0, 15)}...`, {
        original: data.original,
        translated: data.translated
      });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 pb-[100px] lg:pb-16 flex flex-col max-w-5xl mx-auto w-full">
      <header className="mb-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4">
        <div>
          <h1 className="font-headline text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <FileText className="text-primary w-5 h-5" />
            </div>
            Documentos
          </h1>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
            Traduce PDFs o fotos de documentos al {targetLanguage}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* PANEL IZQUIERDO: UPLOAD */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center border-white/5 space-y-6">
          <div className="w-full relative rounded-2xl border-2 border-dashed border-white/20 p-8 text-center hover:border-primary/50 transition-colors flex flex-col items-center gap-4">
            <input 
              type="file" 
              accept="application/pdf,image/*" 
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              {file ? (
                <FileText className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-white/40" />
              )}
            </div>
            <div>
              <p className="font-medium text-white/80">
                {file ? file.name : "Sube un archivo PDF o JPG"}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Toca para seleccionar o usa la cámara
              </p>
            </div>
            
            {/* Boton para moviles que abre directo la camara (dependiendo del OS) */}
            <label className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-sm font-medium z-20">
              <Camera className="w-4 h-4" />
              Tomar Foto
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <Button 
            onClick={handleProcess} 
            disabled={!file || isProcessing}
            className="w-full h-14 rounded-2xl font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            Traducir Documento
          </Button>
        </div>

        {/* PANEL DERECHO: RESULTADO */}
        <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col h-full overflow-hidden min-h-[500px]">
          <h2 className="text-sm font-headline text-primary uppercase tracking-widest mb-4">
            Resultado de Traducción
          </h2>
          
          {result ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
              <div>
                <p className="text-xs font-headline text-white/40 uppercase tracking-widest mb-2">Original</p>
                <div className="p-4 rounded-2xl bg-white/5 text-white/80 text-sm whitespace-pre-wrap">
                  {result.original}
                </div>
              </div>
              <div>
                <p className="text-xs font-headline text-primary uppercase tracking-widest mb-2">Traducido ({targetLanguage})</p>
                <div className="p-4 rounded-2xl bg-primary/10 text-white text-sm whitespace-pre-wrap border border-primary/20">
                  {result.translated}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm">El texto traducido aparecerá aquí</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
