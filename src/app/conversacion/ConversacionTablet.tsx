'use client';

import { useState } from 'react';
import { useConversacion, getLocalizedLabels } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, RotateCw, Sparkles, Settings2, Sparkle, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ConversacionTablet() {
  const logic = useConversacion();
  const [isTableModeActive, setIsTableModeActive] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // Historial cronológico invertido
  const chronologicalHistory = [...logic.history].reverse();

  return (
    <div className="h-[100dvh] overflow-hidden bg-black text-white flex flex-col p-10 pb-32">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="font-headline font-bold text-2xl tracking-tight">Nexus Tablet</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              import('./use-multiplayer-sync').then(m => m.useMultiplayerSync().createRoom());
            }}
            className="h-12 px-6 rounded-2xl border transition-all duration-500 font-headline uppercase text-[10px] tracking-widest font-bold bg-primary/10 text-primary border-primary/20 shadow-neon-primary hover:bg-primary/20"
          >
            Conectar
          </Button>
          {logic.history.length > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                className="h-12 px-6 rounded-2xl transition-all duration-500 font-headline uppercase text-[10px] tracking-widest font-bold"
                onClick={() => setIsFinishDialogOpen(true)}
              >
                Finalizar Conversación
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logic.clearConversation()}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Borrar historial"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          )}
          <Button
            onClick={() => setIsTableModeActive(!isTableModeActive)}
            className={cn("h-12 px-6 rounded-2xl border transition-all duration-500 font-headline uppercase text-[10px] tracking-widest font-bold", isTableModeActive ? "bg-primary text-white border-primary/50 shadow-neon-primary" : "bg-white/[0.02] border-white/10 text-white/60")}
          >
            <RotateCw className={cn("w-4 h-4 mr-3 transition-transform", isTableModeActive && "rotate-180")} />
            Modo Mesa
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-2 gap-10 min-h-0">
        {/* PANEL DE USUARIO LOCAL */}
        <motion.div 
          layout
          onClick={() => logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            scale: logic.isNativeTurn ? 1 : 0.95,
            opacity: logic.isNativeTurn ? 1 : 0.5
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-start border transition-colors cursor-pointer hover:bg-primary/[0.03] min-h-0", logic.isNativeTurn ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-neon-primary" : "border-white/5 bg-white/[0.02]")}
        >
          <div className="flex items-center gap-4 mb-6">
            <User className={cn("w-8 h-8", logic.isNativeTurn ? "text-primary" : "text-white/40")} />
            <span className="text-xs uppercase font-headline font-bold text-white/50">Tú (Local)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
            {chronologicalHistory.length === 0 ? (
              <p className="text-2xl font-headline font-bold text-white/30 italic">Toca el micrófono para empezar a hablar...</p>
            ) : (
              chronologicalHistory.map((item, idx) => {
                const isSelf = item.from === logic.nativeLanguage;
                const labels = getLocalizedLabels(logic.nativeLanguage);
                return (
                  <div key={idx} className={cn("text-sm transition-all duration-300", isSelf ? "text-white" : "text-white/60")}>
                    <span className={cn("font-bold mr-2 text-[10px] uppercase tracking-wider", isSelf ? "text-primary" : "text-white/30")}>
                      {isSelf ? labels.self : labels.other}
                    </span>
                    <span className="font-medium text-lg leading-relaxed">{isSelf ? item.original : item.translated}</span>
                  </div>
                );
              })
            )}
            {logic.isRecording && logic.isNativeTurn && logic.liveTranscript && (
              <div className="text-sm text-primary/70 animate-pulse italic">
                <span className="font-bold mr-2 text-[10px] uppercase tracking-wider">Transcribiendo:</span>
                <span className="text-lg">{logic.liveTranscript}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* PANEL DE INVITADO */}
        <motion.div 
          layout
          onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            scale: !logic.isNativeTurn ? 1 : 0.95,
            opacity: !logic.isNativeTurn ? 1 : 0.5
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-start border transition-colors items-end text-right cursor-pointer hover:bg-secondary/[0.03] min-h-0", !logic.isNativeTurn ? "border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent shadow-neon-secondary" : "border-white/5 bg-white/[0.02]", isTableModeActive && "rotate-180")}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs uppercase font-headline font-bold text-white/50">Invitado</span>
            <Users className={cn("w-8 h-8", !logic.isNativeTurn ? "text-secondary" : "text-white/40")} />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
            {chronologicalHistory.length === 0 ? (
              <p className="text-2xl font-headline font-bold text-white/30 italic">Esperando inicio...</p>
            ) : (
              chronologicalHistory.map((item, idx) => {
                const isSelf = item.from === logic.targetLanguage;
                const labels = getLocalizedLabels(logic.targetLanguage);
                return (
                  <div key={idx} className={cn("text-sm transition-all duration-300", isSelf ? "text-white" : "text-white/60")}>
                    <span className={cn("font-bold mr-2 text-[10px] uppercase tracking-wider", isSelf ? "text-secondary" : "text-white/30")}>
                      {isSelf ? labels.self : labels.other}
                    </span>
                    <span className="font-medium text-lg leading-relaxed">{isSelf ? item.original : item.translated}</span>
                  </div>
                );
              })
            )}
            {logic.isRecording && !logic.isNativeTurn && logic.liveTranscript && (
              <div className="text-sm text-secondary/70 animate-pulse italic">
                <span className="font-bold mr-2 text-[10px] uppercase tracking-wider">Transcribiendo:</span>
                <span className="text-lg">{logic.liveTranscript}</span>
              </div>
            )}
          </div>
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

        {/* VISOR DE AUDIO ESTILO WHATSAPP */}
        {logic.isRecording && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-end justify-center gap-[3px] h-9 bg-zinc-900/90 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-2xl shadow-neon-primary mb-2"
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
              disabled={logic.isProcessing || logic.isSpeaking}
              className={cn(
                "h-24 w-24 rounded-full transition-all duration-300 flex items-center justify-center border-4 border-transparent shadow-2xl relative",
                logic.isRecording 
                  ? "bg-rose-500 scale-95 border-rose-500/20 shadow-neon-emerald" 
                  : logic.isSpeaking
                  ? "bg-primary/30 border border-primary/40"
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {logic.isRecording && (
                <div className="absolute inset-0 bg-rose-400/50 animate-ping rounded-full z-0" />
              )}
              {logic.isSpeaking && (
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-full z-0" />
              )}
              <div className="relative z-10">
                {logic.isProcessing ? <Sparkle className="w-10 h-10 animate-spin" />
                  : logic.isSpeaking ? <Sparkle className="w-10 h-10 text-primary animate-pulse" />
                  : logic.isRecording ? <MicOff className="w-10 h-10 text-white" /> 
                  : <Mic className="w-10 h-10" />}
              </div>
            </Button>
          </motion.div>

          <Button variant="ghost" className="h-16 w-16 rounded-full border border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white">
            <Settings2 className="w-6 h-6" />
          </Button>

          {logic.history.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setIsFinishDialogOpen(true)}
              className="h-16 px-6 rounded-full font-headline font-bold uppercase tracking-wider text-xs"
            >
              Finalizar
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline">Finalizar Conversación</DialogTitle>
            <DialogDescription className="text-white/50 text-base">
              Ingresa un nombre para guardar esta sesión antes de limpiar la pantalla.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Input
              id="name"
              placeholder="Nombre de la sesión..."
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-xl text-lg px-6"
            />
          </div>
          <DialogFooter className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              className="h-14 px-8 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-lg"
              onClick={() => setIsFinishDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-bold"
              onClick={() => {
                logic.saveAndClearConversation(sessionName || 'Conversación');
                setIsFinishDialogOpen(false);
                setSessionName('');
              }}
            >
              Guardar y Limpiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
