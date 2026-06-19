
'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, Sparkles, Globe, Settings2, Sparkle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';

/**
 * @summary ConversacionMobile Refactorizada.
 * El micrófono es ahora un Botón Flotante de Acción (FAB) por encima de la BottomNav.
 */
export function ConversacionMobile() {
  const logic = useConversacion();

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col p-5 pb-32 overflow-hidden">
      <header className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-headline tracking-[0.2em] text-white/40">SoftIA Mobile</span>
        </div>
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/5 bg-white/[0.02]">
          <span className="text-[9px] font-headline font-bold text-white/60">{logic.nativeLanguage.substring(0,3)}</span>
          <Globe className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-headline font-bold text-primary">{logic.targetLanguage.substring(0,3)}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden mb-12">
        <div className={cn("relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center", logic.isNativeTurn ? "bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(161,98,247,0.1)]" : "bg-white/[0.01] border-white/[0.03] opacity-30")}>
          <User className="w-4 h-4 text-primary absolute top-6 left-6" />
          <p className="text-2xl font-headline font-bold text-white">{logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
        <div className={cn("relative flex-1 rounded-[2.5rem] p-6 transition-all duration-700 border-2 flex flex-col justify-center text-right items-end", !logic.isNativeTurn ? "bg-secondary/10 border-secondary/40 shadow-[0_0_30px_rgba(155,168,245,0.1)]" : "bg-white/[0.01] border-white/[0.03] opacity-30")}>
          <Users className="w-4 h-4 text-secondary absolute top-6 right-6" />
          <p className="text-2xl font-headline font-bold text-white">{!logic.isNativeTurn ? logic.history[0]?.original : ""}</p>
        </div>
      </div>

      {/* BOTÓN FLOTANTE DE ACCIÓN (FAB) - MICRÓFONO */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          <div className="text-[8px] font-mono tracking-[0.3em] uppercase text-white/40 bg-black/80 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-xl">
             {logic.isNativeTurn ? "Turno Local" : "Turno Invitado"}
          </div>
          
          <Button
            onClick={logic.toggleSession}
            disabled={logic.isProcessing}
            className={cn(
              "h-24 w-24 rounded-full transition-all duration-500 squish-effect flex items-center justify-center border-4 border-black/40 shadow-2xl",
              logic.isRecording 
                ? "bg-rose-500 scale-95 shadow-[0_0_50px_rgba(244,63,94,0.5)] animate-pulse" 
                : "bg-gradient-to-tr from-primary to-purple-600 text-white shadow-[0_0_40px_rgba(161,98,247,0.4)]"
            )}
          >
            {logic.isProcessing ? <Sparkle className="w-10 h-10 animate-spin" /> : (logic.isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />)}
          </Button>
        </div>
      </div>

      {/* CONTROLES AUXILIARES */}
      <div className="absolute bottom-24 right-8 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40">
              <Settings2 className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-zinc-950 border-white/10 rounded-t-[3rem] pb-12">
            <SheetHeader>
              <SheetTitle className="text-white">Ajustes de IA</SheetTitle>
              <SheetDescription className="text-white/40">Configura el motor de voz y hardware.</SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-6">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase text-white/40 tracking-widest">Cámara AR</Label>
                <Button onClick={() => logic.setIsCameraActive(!logic.isCameraActive)} className={cn("h-10 px-6 rounded-xl", logic.isCameraActive ? "bg-primary" : "bg-white/5")}>
                  {logic.isCameraActive ? "On" : "Off"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
