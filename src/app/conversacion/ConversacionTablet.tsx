
'use client';

import { useConversacion } from './use-conversacion';
import { Mic, MicOff, Camera, CameraOff, User, Users, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ConversacionTablet() {
  const logic = useConversacion();

  return (
    <div className="min-h-screen bg-background flex flex-col p-8 pb-32">
      <header className="flex justify-between items-center mb-12">
        <h1 className="font-headline font-bold text-2xl">Conversación Dual</h1>
        <div className="glass-panel px-6 py-2 rounded-full flex items-center gap-3 border-primary/20">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-headline uppercase tracking-widest text-white/60">Modo Tablet</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-8">
        <div className={cn(
          "glass-panel rounded-[3rem] p-10 flex flex-col justify-center transition-all duration-700",
          logic.isNativeTurn ? "bg-primary/10 border-primary border-2 shadow-2xl" : "opacity-30 border-white/5"
        )}>
          <User className="w-12 h-12 text-primary mb-6" />
          <h2 className="text-4xl font-headline font-bold text-white">{logic.nativeLanguage}</h2>
          <p className="mt-4 text-white/40">Presiona el centro para empezar</p>
        </div>

        <div className={cn(
          "glass-panel rounded-[3rem] p-10 flex flex-col justify-center items-end text-right transition-all duration-700",
          !logic.isNativeTurn ? "bg-secondary/10 border-secondary border-2 shadow-2xl" : "opacity-30 border-white/5"
        )}>
          <Users className="w-12 h-12 text-secondary mb-6" />
          <h2 className="text-4xl font-headline font-bold text-white">{logic.targetLanguage}</h2>
          <p className="mt-4 text-white/40">Esperando respuesta...</p>
        </div>
      </div>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8">
        <Button
          onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
          className={cn(
            "h-16 w-16 rounded-full",
            logic.isCameraActive ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"
          )}
        >
          <Camera className="w-6 h-6" />
        </Button>

        <Button
          onClick={logic.toggleSession}
          className={cn(
            "h-24 w-24 rounded-full transition-transform squish-effect",
            logic.isNativeTurn ? "bg-primary shadow-primary/40" : "bg-secondary shadow-secondary/40"
          )}
        >
          {logic.isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </Button>
      </div>
    </div>
  );
}
