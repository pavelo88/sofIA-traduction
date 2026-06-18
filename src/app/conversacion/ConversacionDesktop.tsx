
'use client';

import { useConversacion } from './use-conversacion';
import { Mic, MicOff, Camera, CameraOff, History, Activity, Sparkles, User, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export function ConversacionDesktop() {
  const logic = useConversacion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && logic.streamRef.current) {
      videoRef.current.srcObject = logic.streamRef.current;
    }
  }, [logic.isCameraActive, logic.streamRef.current]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* COLUMNA 1: SIDEBAR & HISTORIAL (25%) */}
      <aside className="w-[25%] border-r border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col p-6">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-lg">SoftIA Nexus</h2>
          </div>
          <p className="text-[10px] font-headline text-white/40 uppercase tracking-[0.2em]">SISTEMA_VVOZ: ONLINE</p>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-white/60">
            <History className="w-4 h-4" />
            <span className="text-xs font-headline uppercase tracking-widest">Interacciones</span>
          </div>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {logic.history.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] leading-relaxed">
                  <p className="text-white/40 mb-1">{item.from} → {item.to}</p>
                  <p className="font-medium text-white/90">"{item.translated}"</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* COLUMNA 2: LIENZO DE TRADUCCIÓN (50%) */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="w-full max-w-4xl grid grid-cols-2 gap-8 relative z-10">
          {/* LADO USUARIO */}
          <div className={cn(
            "group relative glass-panel p-8 rounded-[3rem] transition-all duration-1000 border-2",
            logic.isNativeTurn ? "border-primary bg-primary/10 shadow-[0_0_50px_-12px_rgba(161,98,247,0.3)]" : "border-white/5 opacity-40 grayscale"
          )}>
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <User className="text-white w-6 h-6" />
            </div>
            <h3 className="text-sm font-headline uppercase tracking-widest text-primary mb-6">Módulo Nativo</h3>
            <div className="h-40 flex flex-col justify-center">
              <p className="text-3xl font-headline font-bold text-white mb-2">{logic.nativeLanguage}</p>
              <p className="text-xs text-white/40 italic">Esperando frecuencia de voz...</p>
            </div>
          </div>

          {/* LADO INVITADO */}
          <div className={cn(
            "group relative glass-panel p-8 rounded-[3rem] transition-all duration-1000 border-2",
            !logic.isNativeTurn ? "border-secondary bg-secondary/10 shadow-[0_0_50px_-12px_rgba(155,168,245,0.3)]" : "border-white/5 opacity-40 grayscale"
          )}>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="text-white w-6 h-6" />
            </div>
            <h3 className="text-sm font-headline uppercase tracking-widest text-secondary mb-6">Módulo Invitado</h3>
            <div className="h-40 flex flex-col justify-center text-right">
              <p className="text-3xl font-headline font-bold text-white mb-2">{logic.targetLanguage}</p>
              <p className="text-xs text-white/40 italic">Esperando frecuencia de voz...</p>
            </div>
          </div>
        </div>

        {/* ACCIÓN CENTRAL */}
        <div className="mt-16 flex items-center gap-8">
           <Button
            variant="outline"
            onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
            className={cn(
              "h-16 w-16 rounded-full border border-white/10 transition-all squish-effect",
              logic.isCameraActive ? "bg-primary/20 text-primary border-primary/40" : "bg-white/5 text-white/40"
            )}
          >
            {logic.isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-28 w-28 rounded-full transition-all duration-500 shadow-2xl squish-effect relative z-10",
              logic.isRecording 
                ? (logic.isNativeTurn ? "bg-primary scale-110" : "bg-secondary scale-110") 
                : "bg-white/10 text-white border border-white/10"
            )}
          >
            {logic.isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </Button>
        </div>
      </main>

      {/* COLUMNA 3: ANÁLISIS & CÁMARA (25%) */}
      <aside className="w-[25%] border-l border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col p-6">
        <div className="mb-8 glass-panel aspect-video rounded-3xl overflow-hidden border-white/10 relative bg-black">
          {logic.isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <CameraOff className="w-12 h-12" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-headline uppercase tracking-[0.2em] text-white/60">Telemetría de Voz</h4>
            <Activity className="w-4 h-4 text-primary animate-pulse" />
          </div>
          
          <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-white/40 uppercase">Precisión IA</span>
              <span className="text-xs font-bold text-primary">98.4%</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="w-[98%] h-full bg-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/5 flex flex-col items-center">
              <Star className="w-4 h-4 text-secondary mb-2" />
              <span className="text-[9px] text-white/40 uppercase">Género Yo</span>
              <span className="text-[10px] font-bold mt-1 uppercase">{logic.userVoiceGender}</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/5 flex flex-col items-center">
              <Users className="w-4 h-4 text-secondary mb-2" />
              <span className="text-[9px] text-white/40 uppercase">Género Él</span>
              <span className="text-[10px] font-bold mt-1 uppercase">{logic.partnerVoiceGender}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
