'use client';

import { useState } from 'react';
import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, 
  RotateCw, ArrowRightLeft, Sparkles, Activity, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * @summary Conversación Tablet v4.0.
 * Introduce el modo "Mesa Redonda" (Spatial Mirroring) para facilitar el cara a cara.
 */
export function ConversacionTablet() {
  const logic = useConversacion();
  const [isTableModeActive, setIsTableModeActive] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col p-10 pb-32">
      {/* HEADER DE MESA REDONDA */}
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-tight leading-none mb-1">Nexus Tablet</h1>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-green-500" />
              <span className="text-[9px] uppercase font-headline tracking-widest text-white/30">Enlace Espacial Operativo</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsTableModeActive(!isTableModeActive)}
            className={cn(
              "h-12 px-6 rounded-2xl border transition-all duration-500 squish-effect font-headline uppercase text-[10px] tracking-widest",
              isTableModeActive ? "bg-primary border-primary/40 text-white shadow-lg shadow-primary/20" : "bg-white/[0.02] border-white/[0.05] text-white/40"
            )}
          >
            <RotateCw className={cn("w-4 h-4 mr-3 transition-transform duration-500", isTableModeActive && "rotate-180")} />
            {isTableModeActive ? "Modo Mesa Activo" : "Activar Modo Mesa"}
          </Button>
          
          <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-white/20">
            <Settings2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* REJILLA SIMÉTRICA CARA A CARA */}
      <div className="flex-1 grid grid-cols-2 gap-10">
        {/* PANEL LOCAL (USUARIO) */}
        <div className={cn(
          "glass-panel rounded-[4rem] p-12 flex flex-col justify-center transition-all duration-1000 border-2 relative",
          logic.isNativeTurn 
            ? "border-primary/40 bg-primary/[0.04] shadow-[0_0_80px_-20px_rgba(161,98,247,0.2)]" 
            : "border-white/[0.02] bg-white/[0.01] opacity-30 grayscale-[0.8]"
        )}>
          <div className="absolute top-10 left-12 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[10px] font-headline uppercase tracking-widest text-primary font-bold">Módulo Tú</h3>
              <p className="text-xs text-white/40">{logic.nativeLanguage}</p>
            </div>
          </div>
          
          <p className="text-5xl font-headline font-bold text-white leading-tight mt-12">
            {logic.isNativeTurn ? (logic.history[0]?.from === logic.nativeLanguage ? logic.history[0]?.original : "Esperando tu voz...") : ""}
          </p>
        </div>

        {/* PANEL REMOTO (INVITADO) - ROTACIÓN ESPACIAL */}
        <div className={cn(
          "glass-panel rounded-[4rem] p-12 flex flex-col justify-center items-end text-right transition-all duration-1000 border-2 relative",
          !logic.isNativeTurn 
            ? "border-secondary/40 bg-secondary/[0.04] shadow-[0_0_80px_-20px_rgba(155,168,245,0.2)]" 
            : "border-white/[0.02] bg-white/[0.01] opacity-30 grayscale-[0.8]",
          isTableModeActive && "rotate-180" // ROTACIÓN 180° PARA CARA A CARA
        )}>
          <div className="absolute top-10 right-12 flex flex-row-reverse items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[10px] font-headline uppercase tracking-widest text-secondary font-bold">Módulo Invitado</h3>
              <p className="text-xs text-white/40">{logic.targetLanguage}</p>
            </div>
          </div>

          <p className="text-5xl font-headline font-bold text-white leading-tight mt-12">
            {!logic.isNativeTurn ? (logic.history[0]?.from === logic.targetLanguage ? logic.history[0]?.original : "Escuchando...") : ""}
          </p>
        </div>
      </div>

      {/* BARRA DE ACCIÓN CENTRALIZADA */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10">
        <Button
          onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
          className={cn(
            "h-16 w-16 rounded-3xl transition-all duration-500 border",
            logic.isCameraActive ? "bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/20" : "bg-white/[0.03] border-white/[0.05] text-white/30"
          )}
        >
          {logic.isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
        </Button>

        <div className="relative">
          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-28 w-28 rounded-full shadow-2xl transition-all duration-700 squish-effect border-8 border-white/5",
              logic.isRecording 
                ? (logic.isNativeTurn ? "bg-primary scale-110" : "bg-secondary scale-110") 
                : "bg-white/[0.05] text-white backdrop-blur-3xl hover:border-primary/40"
            )}
          >
            {logic.isProcessing ? (
              <Sparkles className="w-10 h-10 animate-spin" />
            ) : (
              logic.isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />
            )}
          </Button>
          {logic.isRecording && (
            <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-ping opacity-40" />
          )}
        </div>

        <div className="glass-panel h-16 px-8 rounded-3xl border-white/5 bg-white/[0.02] flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-headline tracking-widest text-white/30 mb-1">Tú</span>
            <div className="flex gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", logic.userVoiceGender === 'masculino' ? "bg-primary" : "bg-white/10")} />
              <div className={cn("w-1.5 h-1.5 rounded-full", logic.userVoiceGender === 'femenino' ? "bg-primary" : "bg-white/10")} />
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-headline tracking-widest text-white/30 mb-1">Invitado</span>
            <div className="flex gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full", logic.partnerVoiceGender === 'masculino' ? "bg-secondary" : "bg-white/10")} />
              <div className={cn("w-1.5 h-1.5 rounded-full", logic.partnerVoiceGender === 'femenino' ? "bg-secondary" : "bg-white/10")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
