'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, Sparkles, Globe, Settings2, Sparkle, History, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversacionMobile() {
  const logic = useConversacion();

  // Historial cronológico invertido
  const chronologicalHistory = [...logic.history].reverse();

  return (
    <div className="fixed inset-0 bg-black flex flex-col p-5 pb-32 overflow-hidden">
      <header className="flex items-center justify-between mb-4 pt-2 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-headline tracking-[0.2em] text-white/40 font-bold">SoftIA Mobile</span>
        </div>
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/10 bg-white/[0.05]">
          <span className="text-[9px] font-headline font-bold text-white/60">{logic.nativeLanguage.substring(0,3)}</span>
          <Globe className="w-3 h-3 text-white/20" />
          <span className="text-[9px] font-headline font-bold text-primary">{logic.targetLanguage.substring(0,3)}</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden mb-12 relative z-10">
        {/* PANEL DE USUARIO LOCAL (ESPAÑOL) */}
        <motion.div 
          layout
          onClick={() => logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            flex: logic.isNativeTurn ? 2 : 1,
            opacity: logic.isNativeTurn ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative rounded-[2.5rem] p-6 border flex flex-col justify-start overflow-hidden cursor-pointer hover:bg-primary/[0.03] transition-all", 
            logic.isNativeTurn ? "bg-primary/10 border-primary/40 shadow-neon-primary" : "bg-white/[0.02] border-white/5"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className={cn("w-4 h-4", logic.isNativeTurn ? "text-primary" : "text-white/30")} />
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">Tú (Español)</span>
            </div>
            {logic.isNativeTurn && logic.isRecording && (
              <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Grabando</span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
            {chronologicalHistory.length === 0 ? (
              <p className="font-headline font-bold text-lg text-white/30 italic">Toca el micrófono para empezar a hablar...</p>
            ) : (
              chronologicalHistory.map((item, idx) => {
                const isSelf = item.from === logic.nativeLanguage;
                return (
                  <div key={idx} className={cn("text-sm transition-all duration-300", isSelf ? "text-white" : "text-white/60")}>
                    <span className={cn("font-bold mr-1.5 text-[10px] uppercase tracking-wider", isSelf ? "text-primary" : "text-white/30")}>
                      {isSelf ? "Yo dije:" : "Él dijo:"}
                    </span>
                    <span className="font-medium text-base leading-relaxed">{isSelf ? item.original : item.translated}</span>
                  </div>
                );
              })
            )}
            {logic.isRecording && logic.isNativeTurn && logic.liveTranscript && (
              <div className="text-sm text-primary/70 animate-pulse italic">
                <span className="font-bold mr-1.5 text-[10px] uppercase tracking-wider">Transcribiendo:</span>
                <span className="text-base">{logic.liveTranscript}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* PANEL DE INVITADO (EXTRANJERO) */}
        <motion.div 
          layout
          onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            flex: !logic.isNativeTurn ? 2 : 1,
            opacity: !logic.isNativeTurn ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative rounded-[2.5rem] p-6 border flex flex-col justify-start overflow-hidden cursor-pointer hover:bg-secondary/[0.03] transition-all", 
            !logic.isNativeTurn ? "bg-secondary/10 border-secondary/40 shadow-neon-secondary" : "bg-white/[0.02] border-white/5"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">Invitado ({logic.targetLanguage})</span>
              <Users className={cn("w-4 h-4", !logic.isNativeTurn ? "text-secondary" : "text-white/30")} />
            </div>
            {!logic.isNativeTurn && logic.isRecording && (
              <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Grabando</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
            {chronologicalHistory.length === 0 ? (
              <p className="font-headline font-bold text-lg text-white/30 italic">Esperando que inicie el invitado...</p>
            ) : (
              chronologicalHistory.map((item, idx) => {
                const isSelf = item.from === logic.targetLanguage;
                return (
                  <div key={idx} className={cn("text-sm transition-all duration-300", isSelf ? "text-white" : "text-white/60")}>
                    <span className={cn("font-bold mr-1.5 text-[10px] uppercase tracking-wider", isSelf ? "text-secondary" : "text-white/30")}>
                      {isSelf ? "Yo dije:" : "La persona dijo:"}
                    </span>
                    <span className="font-medium text-base leading-relaxed">{isSelf ? item.original : item.translated}</span>
                  </div>
                );
              })
            )}
            {logic.isRecording && !logic.isNativeTurn && logic.liveTranscript && (
              <div className="text-sm text-secondary/70 animate-pulse italic">
                <span className="font-bold mr-1.5 text-[10px] uppercase tracking-wider">Transcribiendo:</span>
                <span className="text-base">{logic.liveTranscript}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* BOTÓN FLOTANTE DE ACCIÓN (FAB) */}
      <div className="absolute bottom-[100px] lg:bottom-20 left-1/2 -translate-x-1/2 z-50">
        <div className="flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div 
              key={logic.isNativeTurn ? 'local' : 'guest'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[9px] font-headline tracking-widest font-bold uppercase text-white/60 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-xl shadow-lg"
            >
               {logic.isNativeTurn ? "Turno Local" : "Turno Invitado"}
            </motion.div>
          </AnimatePresence>

          {/* VISOR DE AUDIO ESTILO WHATSAPP */}
          {logic.isRecording && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-end justify-center gap-[3px] h-9 bg-zinc-900/90 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-2xl shadow-neon-primary"
            >
              {logic.audioLevels.map((level, i) => (
                <div 
                  key={i} 
                  className="w-[3px] bg-rose-500 rounded-full transition-all duration-75"
                  style={{ height: `${level}%` }}
                />
              ))}
            </motion.div>
          )}
          
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              onClick={logic.toggleSession}
              disabled={logic.isProcessing || logic.isSpeaking}
              className={cn(
                "h-20 w-20 rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl relative overflow-hidden",
                logic.isRecording 
                  ? "bg-rose-500 scale-95 shadow-neon-emerald" 
                  : logic.isSpeaking
                  ? "bg-primary/30 border border-primary/40"
                  : "bg-white hover:bg-white/90 text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              )}
            >
              {logic.isRecording && (
                <div className="absolute inset-0 bg-rose-400/50 animate-ping rounded-full z-0" />
              )}
              {logic.isSpeaking && (
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-full z-0" />
              )}
              <div className="relative z-10">
                {logic.isProcessing ? <Sparkle className="w-8 h-8 animate-spin" /> 
                  : logic.isSpeaking ? <Sparkle className="w-8 h-8 text-primary animate-pulse" />
                  : logic.isRecording ? <MicOff className="w-8 h-8 text-white" /> 
                  : <Mic className="w-8 h-8" />}
              </div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* CONTROLES AUXILIARES DERECHA E IZQUIERDA */}
      <div className="absolute bottom-[100px] lg:bottom-20 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-12 w-12 rounded-full bg-white/10 border border-white/10 text-white/60 hover:text-white backdrop-blur-md">
              <Settings2 className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-zinc-950/95 backdrop-blur-3xl border-white/10 rounded-t-[2.5rem] pb-8 px-6">
            <SheetHeader className="mt-4">
              <SheetTitle className="text-white text-left font-headline">Ajustes Rápidos</SheetTitle>
              <SheetDescription className="text-white/40 text-left">Controla cámara y preferencias locales.</SheetDescription>
            </SheetHeader>
            <div className="mt-8 space-y-4">
              <div className="glass-panel p-4 rounded-2xl flex justify-between items-center bg-white/[0.02]">
                <Label className="text-xs uppercase text-white/60 tracking-widest font-bold">Cámara AR</Label>
                <Button 
                  onClick={() => logic.setIsCameraActive(!logic.isCameraActive)} 
                  className={cn("h-10 px-6 rounded-xl transition-colors", logic.isCameraActive ? "bg-primary text-white" : "bg-white/10 text-white/40")}
                >
                  {logic.isCameraActive ? <Camera className="w-4 h-4 mr-2" /> : <CameraOff className="w-4 h-4 mr-2" />}
                  {logic.isCameraActive ? "Activada" : "Desactivada"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="absolute bottom-[100px] lg:bottom-20 left-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="h-12 w-12 rounded-full bg-white/10 border border-white/10 text-white/60 hover:text-white backdrop-blur-md">
              <History className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-zinc-950/95 backdrop-blur-3xl border-white/10 rounded-t-[2.5rem] pb-8 px-6 h-[70vh] flex flex-col">
            <SheetHeader className="mt-4 shrink-0">
              <SheetTitle className="text-white text-left font-headline flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Historial de Conversación
              </SheetTitle>
              <SheetDescription className="text-white/40 text-left">Registro de todos los mensajes traducidos.</SheetDescription>
            </SheetHeader>
            
            <ScrollArea className="flex-1 mt-6 border border-white/5 rounded-2xl bg-white/[0.02] p-4">
              {logic.history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/30 text-sm">
                  No hay mensajes aún.
                </div>
              ) : (
                <div className="space-y-4">
                  {logic.history.map((msg, idx) => (
                    <div key={idx} className={cn("p-4 rounded-2xl", msg.from === logic.nativeLanguage ? "bg-primary/10 ml-8" : "bg-secondary/10 mr-8")}>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">
                        {msg.from === logic.nativeLanguage ? "Tú" : "Invitado"}
                      </div>
                      <div className="text-sm text-white/90 font-medium mb-1">{msg.original}</div>
                      <div className="text-xs text-white/50">{msg.translated}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
