'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, Sparkles, Globe, Settings2, Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';

export function ConversacionMobile() {
  const logic = useConversacion();

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col p-5 pb-32 overflow-hidden">
      <header className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-headline tracking-[0.2em] text-white/40">SoftIA Talk</span>
        </div>
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border-white/5 bg-white/[0.02]">
          <span className="text-[9px] font-headline font-bold text-white/60">{logic.nativeLanguage.substring(0,3)}</span>
          <Globe className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-headline font-bold text-primary">{logic.targetLanguage.substring(0,3)}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className={cn("relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center", logic.isNativeTurn ? "bg-primary/10 border-primary/40" : "bg-white/[0.01] border-white/[0.03] opacity-30")}>
          <User className="w-3 h-3 text-primary absolute top-5 left-6" />
          <p className="text-2xl font-headline font-bold text-white">{logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
        <div className={cn("relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center text-right items-end", !logic.isNativeTurn ? "bg-secondary/10 border-secondary/40" : "bg-white/[0.01] border-white/[0.03] opacity-30")}>
          <Users className="w-3 h-3 text-secondary absolute top-5 right-6" />
          <p className="text-2xl font-headline font-bold text-white">{!logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
      </div>

      {/* PANEL DE CONTROL MOBILE REFACTORIZADO */}
      <div className="fixed bottom-10 left-0 right-0 px-8 flex flex-col items-center gap-4 pointer-events-none">
        
        {/* INDICADOR DE TELEMETRÍA */}
        <div className="pointer-events-auto text-[8px] font-mono tracking-[0.3em] uppercase text-white/40 bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
          {logic.nativeLanguage.substring(0,2)} ➔ {logic.targetLanguage.substring(0,2)}
        </div>

        <div className="flex items-center justify-between w-full pointer-events-auto gap-4">
          <Button
            onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
            variant="ghost"
            className={cn("h-14 w-14 rounded-2xl border bg-white/[0.03] transition-colors", logic.isCameraActive ? "text-primary border-primary/20" : "text-white/20 border-white/5")}
          >
            {logic.isCameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-20 w-20 rounded-full transition-all duration-300 squish-effect flex items-center justify-center",
              logic.isRecording 
                ? "bg-rose-500 scale-95 shadow-[0_0_40px_rgba(244,63,94,0.4)] animate-pulse" 
                : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.25)]"
            )}
          >
            {logic.isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 bg-white/[0.03] text-white/20">
                <Settings2 className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-[#09090b]/95 backdrop-blur-3xl border-white/10 rounded-t-[3rem] pb-12">
              <SheetHeader className="mb-8">
                <SheetTitle className="text-white">Ajustes de Sesión</SheetTitle>
                <SheetDescription className="sr-only">Configura voces y hardware</SheetDescription>
              </SheetHeader>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase text-white/40 tracking-widest">Género Voz Tú</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" className={cn("h-10 px-4 rounded-xl", logic.userVoiceGender === 'masculino' ? "bg-primary" : "bg-white/5 text-white/20")}>M</Button>
                    <Button variant="ghost" className={cn("h-10 px-4 rounded-xl", logic.userVoiceGender === 'femenino' ? "bg-primary" : "bg-white/5 text-white/20")}>F</Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase text-white/40 tracking-widest">Género Voz Invitado</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" className={cn("h-10 px-4 rounded-xl", logic.partnerVoiceGender === 'masculino' ? "bg-secondary" : "bg-white/5 text-white/20")}>M</Button>
                    <Button variant="ghost" className={cn("h-10 px-4 rounded-xl", logic.partnerVoiceGender === 'femenino' ? "bg-secondary" : "bg-white/5 text-white/20")}>F</Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
