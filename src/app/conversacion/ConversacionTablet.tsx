'use client';

import { useState } from 'react';
import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, RotateCw, Sparkles, Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversacionTablet() {
  const logic = useConversacion();
  const [isTableModeActive, setIsTableModeActive] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-10 pb-32">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-headline font-bold text-2xl tracking-tight">Nexus Tablet</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setIsTableModeActive(!isTableModeActive)}
            className={cn("h-12 px-6 rounded-2xl border transition-all duration-500 font-headline uppercase text-[10px] tracking-widest font-bold", isTableModeActive ? "bg-primary text-white border-primary/50 shadow-neon-primary" : "bg-white/[0.02] border-white/10 text-white/60")}
          >
            <RotateCw className={cn("w-4 h-4 mr-3 transition-transform", isTableModeActive && "rotate-180")} />
            Modo Mesa
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-10">
        <motion.div 
          layout
          animate={{
            scale: logic.isNativeTurn ? 1 : 0.95,
            opacity: logic.isNativeTurn ? 1 : 0.5
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-center border transition-colors", logic.isNativeTurn ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-neon-primary" : "border-white/5 bg-white/[0.02]")}
        >
          <div className="flex items-center gap-4 mb-6">
            <User className={cn("w-8 h-8", logic.isNativeTurn ? "text-primary" : "text-white/40")} />
            <span className="text-xs uppercase font-headline font-bold text-white/50">Tú (Local)</span>
          </div>
          <p className="text-4xl font-headline font-bold leading-tight">{logic.isNativeTurn ? logic.history.find(h => h.from === logic.nativeLanguage)?.original || "" : ""}</p>
        </motion.div>

        <motion.div 
          layout
          animate={{
            scale: !logic.isNativeTurn ? 1 : 0.95,
            opacity: !logic.isNativeTurn ? 1 : 0.5
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-center border transition-colors items-end text-right", !logic.isNativeTurn ? "border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent shadow-neon-secondary" : "border-white/5 bg-white/[0.02]", isTableModeActive && "rotate-180")}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs uppercase font-headline font-bold text-white/50">Invitado</span>
            <Users className={cn("w-8 h-8", !logic.isNativeTurn ? "text-secondary" : "text-white/40")} />
          </div>
          <p className="text-4xl font-headline font-bold leading-tight">{!logic.isNativeTurn ? logic.history.find(h => h.from === logic.targetLanguage)?.original || "" : ""}</p>
        </motion.div>
      </div>

      {/* PANEL DE CONTROL TABLET REFACTORIZADO */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={logic.isNativeTurn ? 't1' : 't2'}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="text-[10px] font-headline font-bold tracking-[0.4em] uppercase text-white/80 bg-white/10 px-8 py-2 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            {logic.nativeLanguage.substring(0,3)} ➔ {logic.targetLanguage.substring(0,3)} | Turno: {logic.isNativeTurn ? "Tú" : "Invitado"}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-10 glass-panel p-4 rounded-full border-white/10 bg-white/[0.02] shadow-2xl">
          <Button
            onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
            className={cn("h-16 w-16 rounded-full border transition-colors", logic.isCameraActive ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/40 border-white/10")}
          >
            {logic.isCameraActive ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </Button>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              onClick={logic.toggleSession}
              disabled={logic.isProcessing}
              className={cn(
                "h-24 w-24 rounded-full transition-all duration-300 flex items-center justify-center border-4 border-transparent shadow-2xl relative",
                logic.isRecording 
                  ? "bg-rose-500 scale-95 border-rose-500/20" 
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {logic.isRecording && (
                <div className="absolute inset-0 bg-rose-400/50 animate-ping rounded-full z-0" />
              )}
              <div className="relative z-10">
                {logic.isRecording ? <MicOff className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10" />}
              </div>
            </Button>
          </motion.div>

          <Button variant="ghost" className="h-16 w-16 rounded-full border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white">
            <Settings2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
