'use client';

import { useConversacion, getLocalizedLabels } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, History, Sparkles, User, Users,
  Wifi, ArrowUpDown, Volume2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
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

export function ConversacionDesktop() {
  const logic = useConversacion();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // Historial cronológico invertido
  const chronologicalHistory = [...logic.history].reverse();

  useEffect(() => {
    if (videoRef.current && logic.streamRef.current && logic.isCameraActive) {
      videoRef.current.srcObject = logic.streamRef.current;
    }
  }, [logic.isCameraActive, logic.streamRef.current]);

  return (
    <div className="h-[calc(100vh-2rem)] w-full text-white p-6 grid grid-cols-12 gap-6 overflow-hidden">
      
      {/* SECCIÓN PRINCIPAL DE INTERMEDIACIÓN (8 COLUMNAS) */}
      <main className="col-span-8 flex flex-col gap-6 h-full min-h-0">
        
        {/* PANEL DUAL DE DIÁLOGO DINÁMICO */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          
          {/* PANEL DE USUARIO LOCAL */}
          <motion.div 
            layout
            onClick={() => logic.isNativeTurn || logic.toggleTurn()}
            animate={{
              flex: logic.isNativeTurn ? 2 : 1,
              opacity: logic.isNativeTurn ? 1 : 0.6,
              scale: logic.isNativeTurn ? 1 : 0.98,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "glass-panel rounded-[2.5rem] p-8 flex flex-col justify-start relative cursor-pointer group overflow-hidden border min-h-0",
              logic.isNativeTurn 
                ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-neon-primary z-10" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] z-0"
            )}
          >
            {/* Cabecera del panel */}
            <motion.div layout className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  logic.isNativeTurn ? "bg-primary shadow-lg shadow-primary/20 text-white" : "bg-white/10 text-white/60"
                )}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold">Tú (Local)</h3>
                    {logic.isNativeTurn && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(161,98,247,1)]" />
                    )}
                  </div>
                  <p className="text-xs text-white/40">{logic.nativeLanguage} ({logic.userVoiceGender})</p>
                </div>
              </div>
              <AnimatePresence>
                {logic.isNativeTurn && (logic.isRecording || logic.isSpeaking) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full",
                      logic.isRecording 
                        ? "bg-rose-500/10 border border-rose-500/20" 
                        : "bg-primary/10 border border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-1 h-3">
                      {[0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                        <div key={i} className={cn("w-1 rounded-full animate-soundwave", logic.isRecording ? "bg-rose-500" : "bg-primary")} style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                    {logic.isRecording 
                      ? <span className="text-[9px] font-headline uppercase tracking-widest font-bold text-rose-400 ml-1">Escuchando</span>
                      : <span className="text-[9px] font-headline uppercase tracking-widest font-bold text-primary ml-1">Hablando</span>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Contenido / Historial de Guion */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
              {chronologicalHistory.length === 0 ? (
                <p className="font-headline font-bold text-2xl text-white/30 italic">Presiona el micrófono para hablar...</p>
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

          {/* PANEL DE INVITADO EXTRANJERO */}
          <motion.div 
            layout
            onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
            animate={{
              flex: !logic.isNativeTurn ? 2 : 1,
              opacity: !logic.isNativeTurn ? 1 : 0.6,
              scale: !logic.isNativeTurn ? 1 : 0.98,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "glass-panel rounded-[2.5rem] p-8 flex flex-col justify-start relative cursor-pointer group overflow-hidden border min-h-0",
              !logic.isNativeTurn 
                ? "border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent shadow-neon-secondary z-10" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] z-0"
            )}
          >
            {/* Cabecera del panel */}
            <motion.div layout className="flex justify-between items-center w-full mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                  !logic.isNativeTurn ? "bg-secondary shadow-lg shadow-secondary/20 text-white" : "bg-white/10 text-white/60"
                )}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold">Invitado</h3>
                    {!logic.isNativeTurn && (
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(155,168,245,1)]" />
                    )}
                  </div>
                  <p className="text-xs text-white/40">{logic.targetLanguage} ({logic.partnerVoiceGender})</p>
                </div>
              </div>
              <AnimatePresence>
                {!logic.isNativeTurn && (logic.isRecording || logic.isSpeaking) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full",
                      logic.isRecording 
                        ? "bg-rose-500/10 border border-rose-500/20" 
                        : "bg-secondary/10 border border-secondary/20"
                    )}
                  >
                    <div className="flex items-center gap-1 h-3">
                      {[0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                        <div key={i} className={cn("w-1 rounded-full animate-soundwave", logic.isRecording ? "bg-rose-500" : "bg-secondary")} style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                    {logic.isRecording 
                      ? <span className="text-[9px] font-headline uppercase tracking-widest font-bold text-rose-400 ml-1">Escuchando</span>
                      : <span className="text-[9px] font-headline uppercase tracking-widest font-bold text-secondary ml-1">Hablando</span>
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Contenido / Historial de Guion */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar text-left w-full pr-1">
              {chronologicalHistory.length === 0 ? (
                <p className="font-headline font-bold text-2xl text-white/30 italic">Esperando respuesta...</p>
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

        {/* CONTROLES DE ACCIÓN DE CONVERSACIÓN */}
        <div className="glass-panel rounded-3xl p-6 border-white/10 flex items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          {/* Fondo animado para el control panel */}
          {logic.isRecording && (
            <motion.div 
              layoutId="recordingBg"
              className="absolute inset-0 bg-rose-500/5 z-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
          )}

          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="outline"
              onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
              className={cn(
                "h-12 w-12 rounded-2xl border-white/10 transition-all duration-300 hover:scale-105",
                logic.isCameraActive ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/60 hover:text-white"
              )}
            >
              {logic.isCameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </Button>
          </div>

          <div className="flex items-center gap-4 relative z-10">
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

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={logic.toggleSession}
                disabled={logic.isProcessing || logic.isSpeaking}
                className={cn(
                  "h-16 px-8 rounded-full transition-all duration-500 font-headline uppercase tracking-widest text-xs font-bold gap-3 group relative overflow-hidden",
                  logic.isRecording
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 shadow-neon-emerald"
                    : logic.isSpeaking
                    ? "bg-primary/20 border border-primary/30 text-primary cursor-not-allowed"
                    : "bg-white hover:bg-white/90 text-black shadow-xl shadow-white/10"
                )}
              >
                {logic.isProcessing ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : logic.isSpeaking ? (
                  <><Volume2 className="w-5 h-5 animate-pulse" /> Hablando IA</>
                ) : logic.isRecording ? (
                  <><MicOff className="w-5 h-5" /> Detener</>
                ) : (
                  <><Mic className="w-5 h-5" /> Grabar Voz</>
                )}
              </Button>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="outline"
              onClick={() => {
                import('./use-multiplayer-sync').then(m => m.useMultiplayerSync().createRoom());
              }}
              className="h-12 px-5 rounded-2xl bg-primary/10 border-primary/20 text-primary hover:text-white hover:bg-primary/30 flex items-center gap-2 transition-all"
            >
              <Wifi className="w-4 h-4" /> Conectar
            </Button>
            <Button
              variant="outline"
              onClick={logic.toggleTurn}
              className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white/70 hover:text-white flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <ArrowUpDown className="w-4 h-4" /> Alternar
            </Button>
          </div>
        </div>

      </main>

      {/* SECCIÓN LATERAL DE TELEMETRÍA (4 COLUMNAS) */}
      <aside className="col-span-4 flex flex-col gap-6 h-full min-h-0">
        
        {/* FEED DE CÁMARA (TRANSLUCIDO) */}
        <div className="glass-panel aspect-video rounded-[2.5rem] overflow-hidden border-white/10 bg-black/40 relative shadow-2xl group">
          {logic.isCameraActive ? (
            <motion.video 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              ref={videoRef} autoPlay playsInline muted 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3">
              <CameraOff className="w-8 h-8 opacity-50" />
              <span className="text-[9px] font-headline uppercase tracking-[0.2em] font-bold">Cámara Apagada</span>
            </div>
          )}
        </div>

        {/* HISTORIAL RÁPIDO DE DIÁLOGOS */}
        <div className="flex-1 glass-panel rounded-[2.5rem] border-white/10 p-6 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-headline uppercase tracking-[0.2em] text-white/50 font-bold">Historial de Turnos</h4>
            <div className="flex items-center gap-2">
              {logic.history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => logic.clearConversation()}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Borrar historial"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <History className="w-4 h-4 text-white/70" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <AnimatePresence>
              {logic.history.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center text-white/30 text-xs italic"
                >
                  El historial está vacío.
                </motion.div>
              ) : (
                logic.history.map((item, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-headline uppercase tracking-wider text-primary font-bold">
                        {item.from} ➔ {item.to}
                      </span>
                      <span className="text-[8px] font-mono text-white/30 bg-black/20 px-2 py-1 rounded-full">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 font-medium leading-snug">"{item.original}"</p>
                    <p className="text-xs text-secondary mt-2">"{item.translated}"</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] font-headline font-bold uppercase tracking-wider text-emerald-400">Servicio Estable</span>
            </div>
            {logic.history.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 text-[9px] uppercase tracking-wider font-bold"
                onClick={() => setIsFinishDialogOpen(true)}
              >
                Finalizar
              </Button>
            )}
          </div>
        </div>

      </aside>

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Finalizar Conversación</DialogTitle>
            <DialogDescription className="text-white/50">
              Ingresa un nombre para guardar esta conversación (ej. "Con Juan") antes de limpiar la pantalla.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              id="name"
              placeholder="Nombre de la sesión..."
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setIsFinishDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                logic.saveAndClearConversation(sessionName || 'Conversación sin nombre');
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
