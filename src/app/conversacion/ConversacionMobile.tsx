'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, 
  Sparkles, Settings2, Globe, Mic2, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

/**
 * @summary Conversación Mobile v4.0 (Mobile-First Compacto).
 * Prioriza la ergonomía táctil y el acceso rápido mediante Bottom Sheets.
 */
export function ConversacionMobile() {
  const logic = useConversacion();

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col p-5 pb-32 overflow-hidden">
      {/* HEADER COMPACTO */}
      <header className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-headline tracking-[0.2em] text-white/40 leading-none">SoftIA Talk</span>
            <span className="text-[8px] uppercase font-headline tracking-widest text-primary animate-pulse">Enlace Activo</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border-white/5 bg-white/[0.02]">
          <span className="text-[9px] font-headline font-bold text-white/60">{logic.nativeLanguage}</span>
          <Globe className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-headline font-bold text-primary">{logic.targetLanguage}</span>
        </div>
      </header>

      {/* ÁREA DE INTERACCIÓN BENTO APILADA */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* PANEL YO */}
        <div className={cn(
          "relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center overflow-hidden",
          logic.isNativeTurn 
            ? "bg-primary/10 border-primary/40 shadow-[0_0_40px_-10px_rgba(161,98,247,0.2)]" 
            : "bg-white/[0.01] border-white/[0.03] opacity-30 grayscale-[0.8]"
        )}>
          <div className="absolute top-5 left-6 flex items-center gap-2">
            <User className="w-3 h-3 text-primary" />
            <span className="text-[8px] uppercase font-headline tracking-widest text-primary font-bold">Tú (Local)</span>
          </div>
          <p className="text-2xl font-headline font-bold text-white leading-tight">
            {logic.isNativeTurn && logic.history[0]?.from === logic.nativeLanguage ? logic.history[0]?.original : "Esperando voz..."}
          </p>
        </div>

        {/* PANEL INVITADO */}
        <div className={cn(
          "relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center text-right items-end overflow-hidden",
          !logic.isNativeTurn 
            ? "bg-secondary/10 border-secondary/40 shadow-[0_0_40px_-10px_rgba(155,168,245,0.2)]" 
            : "bg-white/[0.01] border-white/[0.03] opacity-30 grayscale-[0.8]"
        )}>
          <div className="absolute top-5 right-6 flex flex-row-reverse items-center gap-2">
            <Users className="w-3 h-3 text-secondary" />
            <span className="text-[8px] uppercase font-headline tracking-widest text-secondary font-bold">Invitado (Remoto)</span>
          </div>
          <p className="text-2xl font-headline font-bold text-white leading-tight">
             {!logic.isNativeTurn && logic.history[0]?.from === logic.targetLanguage ? logic.history[0]?.original : "Escuchando..."}
          </p>
        </div>
      </div>

      {/* CONTROLES FLOTANTES INFERIORES */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex items-center justify-between gap-4 pointer-events-none">
        {/* CÁMARA TOGGLE */}
        <Button
          onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
          variant="ghost"
          className={cn(
            "h-14 w-14 rounded-full border pointer-events-auto transition-all duration-500 squish-effect",
            logic.isCameraActive ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/[0.03] border-white/[0.05] text-white/30"
          )}
        >
          {logic.isCameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
        </Button>

        {/* MICRO CENTRAL SOBREDIMENSIONADO */}
        <div className="relative pointer-events-auto">
          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-24 w-24 rounded-full shadow-2xl transition-all duration-700 squish-effect border-4 border-white/5",
              logic.isRecording 
                ? (logic.isNativeTurn ? "bg-primary scale-110 shadow-primary/40" : "bg-secondary scale-110 shadow-secondary/40") 
                : "bg-white/[0.05] text-white backdrop-blur-3xl"
            )}
          >
            {logic.isProcessing ? (
              <Sparkles className="w-8 h-8 animate-spin" />
            ) : (
              logic.isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />
            )}
          </Button>
          {logic.isRecording && (
            <div className="absolute -inset-2 rounded-full border border-primary/30 animate-ping opacity-40" />
          )}
        </div>

        {/* BOTTOM SHEET AJUSTES */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="h-14 w-14 rounded-full border border-white/[0.05] bg-white/[0.03] text-white/30 pointer-events-auto squish-effect"
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-[#09090b]/95 backdrop-blur-3xl border-white/10 rounded-t-[3rem] px-8 pb-12">
            <SheetHeader className="mb-8">
              <SheetTitle className="text-white font-headline text-xl flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-primary" /> Ajustes de Sesión
              </SheetTitle>
              <SheetDescription className="sr-only">Configura voces y telemetría</SheetDescription>
            </SheetHeader>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Género Voz Tú</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" size="sm" 
                      className={cn("h-10 px-4 rounded-xl", logic.userVoiceGender === 'masculino' ? "bg-primary text-white" : "bg-white/5 text-white/20")}
                    >M</Button>
                    <Button 
                      variant="ghost" size="sm" 
                      className={cn("h-10 px-4 rounded-xl", logic.userVoiceGender === 'femenino' ? "bg-primary text-white" : "bg-white/5 text-white/20")}
                    >F</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest text-white/40">Género Voz Invitado</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" size="sm" 
                      className={cn("h-10 px-4 rounded-xl", logic.partnerVoiceGender === 'masculino' ? "bg-secondary text-white" : "bg-white/5 text-white/20")}
                    >M</Button>
                    <Button 
                      variant="ghost" size="sm" 
                      className={cn("h-10 px-4 rounded-xl", logic.partnerVoiceGender === 'femenino' ? "bg-secondary text-white" : "bg-white/5 text-white/20")}
                    >F</Button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/20">Uso de Nube IA</span>
                  <Info className="w-3 h-3 text-white/20" />
                </div>
                <Progress value={78} className="h-1 bg-white/5" />
                <p className="text-[8px] uppercase tracking-[0.3em] text-center text-white/30 font-headline">Sistema_v4.2.1 Stable</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
