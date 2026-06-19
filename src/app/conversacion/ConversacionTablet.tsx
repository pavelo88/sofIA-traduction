'use client';

import { useState } from 'react';
import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, RotateCw, Sparkles, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ConversacionTablet() {
  const logic = useConversacion();
  const [isTableModeActive, setIsTableModeActive] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col p-10 pb-32">
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-headline font-bold text-2xl tracking-tight">Nexus Tablet</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsTableModeActive(!isTableModeActive)}
            className={cn("h-12 px-6 rounded-2xl border transition-all duration-500 font-headline uppercase text-[10px] tracking-widest", isTableModeActive ? "bg-primary text-white" : "bg-white/[0.02] border-white/5 text-white/40")}
          >
            <RotateCw className={cn("w-4 h-4 mr-3 transition-transform", isTableModeActive && "rotate-180")} />
            Modo Mesa
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-10">
        <div className={cn("glass-panel rounded-[4rem] p-12 flex flex-col justify-center border-2 transition-all duration-1000", logic.isNativeTurn ? "border-primary/40 bg-primary/5 shadow-2xl" : "border-white/5 opacity-30")}>
          <User className="w-8 h-8 text-primary mb-6" />
          <p className="text-4xl font-headline font-bold">{logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
        <div className={cn("glass-panel rounded-[4rem] p-12 flex flex-col justify-center border-2 transition-all duration-1000 items-end text-right", !logic.isNativeTurn ? "border-secondary/40 bg-secondary/5 shadow-2xl" : "border-white/5 opacity-30", isTableModeActive && "rotate-180")}>
          <Users className="w-8 h-8 text-secondary mb-6" />
          <p className="text-4xl font-headline font-bold">{!logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
      </div>

      {/* PANEL DE CONTROL TABLET REFACTORIZADO */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        
        <div className="text-[10px] font-mono tracking-[0.4em] uppercase text-white/30 bg-white/[0.02] px-8 py-2 rounded-full border border-white/5 backdrop-blur-md">
          {logic.nativeLanguage} ➔ {logic.targetLanguage} | Turno: {logic.isNativeTurn ? "Tú" : "Invitado"}
        </div>

        <div className="flex items-center gap-10">
          <Button
            onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
            className={cn("h-16 w-16 rounded-3xl border bg-white/[0.03] transition-colors", logic.isCameraActive ? "text-primary border-primary/20" : "text-white/20 border-white/5")}
          >
            {logic.isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-28 w-28 rounded-full transition-all duration-300 flex items-center justify-center border-8 border-white/5",
              logic.isRecording 
                ? "bg-rose-500 scale-95 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse" 
                : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_40px_rgba(168,85,247,0.3)] hover:scale-105"
            )}
          >
            {logic.isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
          </Button>

          <Button variant="ghost" className="h-16 w-16 rounded-3xl border border-white/5 bg-white/[0.03] text-white/20">
            <Settings2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
