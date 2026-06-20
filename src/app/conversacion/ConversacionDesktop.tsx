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
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { NewChatSetupModal } from '@/components/modals/NewChatSetupModal';

export function ConversacionDesktop() {
  const logic = useConversacion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { defaultNativeName, defaultTargetName, setDefaultNativeName, setDefaultTargetName } = useStore();
  const { toast } = useToast();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Chino', 'Japonés', 'Árabe', 'Ruso'];

  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');

  // Historial cronológico invertido
  const chronologicalHistory = [...logic.history].reverse();
  const [isChatSetupOpen, setIsChatSetupOpen] = useState(logic.history.length === 0);

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
              flex: logic.isNativeTurn ? "1 1 auto" : "0 0 100px",
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
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                  logic.isNativeTurn ? "bg-primary shadow-lg shadow-primary/20 text-white" : "bg-white/10 text-white/60"
                )}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={logic.nativeName} 
                      onChange={(e) => logic.setNativeName(e.target.value)} 
                      onBlur={() => {
                        if (logic.nativeName && logic.nativeName !== defaultNativeName) {
                          toast({
                            title: "¿Guardar nombre por defecto?",
                            description: `¿Deseas que "${logic.nativeName}" sea tu nombre para futuras sesiones?`,
                            action: (
                              <Button variant="outline" size="sm" onClick={() => setDefaultNativeName(logic.nativeName)}>
                                Guardar
                              </Button>
                            ),
                          });
                        }
                      }}
                      placeholder="Usuario"
                      className="h-6 w-32 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-primary transition-all"
                    />
                    {logic.isNativeTurn && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(161,98,247,1)]" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={logic.nativeLanguage} 
                      onChange={e => logic.setNativeLanguage(e.target.value)} 
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-xs px-2 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
                    >
                      {languages.map(l => <option key={l} value={l} className="bg-zinc-900 text-white">{l}</option>)}
                    </select>
                    <select 
                      value={logic.userVoiceGender} 
                      onChange={e => logic.setUserVoiceGender(e.target.value as any)} 
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-xs px-2 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
                    >
                      <option value="masculino" className="bg-zinc-900 text-white">Masculino</option>
                      <option value="femenino" className="bg-zinc-900 text-white">Femenino</option>
                    </select>
                  </div>
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
            <AnimatePresence>
              {logic.isNativeTurn && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 overflow-y-auto space-y-4 custom-scrollbar w-full pr-2 pb-4"
                >
                  {chronologicalHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/30 italic">
                      Presiona el micrófono para hablar...
                    </div>
                  ) : (
                    chronologicalHistory.map((item, idx) => {
                      const isSelf = item.from === logic.nativeLanguage;
                      return (
                        <div key={idx} className={cn("flex flex-col w-full max-w-[85%] mb-2", isSelf ? "ml-auto items-end" : "mr-auto items-start")}>
                          <span className={cn("text-[9px] uppercase tracking-wider mb-1 px-1 font-bold", isSelf ? "text-primary/70" : "text-white/40")}>
                            {isSelf ? logic.nativeName : logic.targetName}
                          </span>
                          <div className={cn("p-4 rounded-2xl shadow-lg", isSelf ? "bg-primary/90 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                            <p className="text-base font-medium leading-relaxed">{item.original}</p>
                            <p className="text-xs opacity-70 mt-1.5 italic border-t border-white/20 pt-1.5">{item.translated}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {logic.isRecording && logic.isNativeTurn && (
                    <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-2">
                      <span className="text-[9px] uppercase tracking-wider mb-1 px-1 font-bold text-primary/70 animate-pulse">
                        {logic.liveTranscript ? "Transcribiendo..." : "Escuchando..."}
                      </span>
                      <div className="p-4 rounded-2xl shadow-lg bg-primary/40 text-white rounded-tr-sm border border-primary/50 animate-pulse">
                        {logic.liveTranscript ? (
                          <p className="text-base font-medium leading-relaxed">{logic.liveTranscript}</p>
                        ) : (
                          <div className="flex items-center gap-1.5 h-6">
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {logic.isProcessing && logic.isNativeTurn && (
                    <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-2">
                      <span className="text-[9px] uppercase tracking-wider mb-1 px-1 font-bold text-primary/70 animate-pulse">
                        Traduciendo...
                      </span>
                      <div className="p-4 rounded-2xl shadow-lg bg-primary/20 text-primary-foreground rounded-tr-sm border border-primary/30 flex items-center gap-3">
                        <div className="flex gap-2">
                           <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" />
                           <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                           <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <p className="text-base font-medium italic opacity-80">Preparando tu mensaje...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PANEL DE INVITADO EXTRANJERO */}
          <motion.div 
            layout
            onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
            animate={{
              flex: !logic.isNativeTurn ? "1 1 auto" : "0 0 100px",
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
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
                  !logic.isNativeTurn ? "bg-secondary shadow-lg shadow-secondary/20 text-white" : "bg-white/10 text-white/60"
                )}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={logic.targetName} 
                      onChange={(e) => logic.setTargetName(e.target.value)} 
                      onBlur={() => {
                        if (logic.targetName && logic.targetName !== defaultTargetName) {
                          toast({
                            title: "¿Guardar nombre por defecto?",
                            description: `¿Deseas que "${logic.targetName}" sea el nombre del invitado para futuras sesiones?`,
                            action: (
                              <Button variant="outline" size="sm" onClick={() => setDefaultTargetName(logic.targetName)}>
                                Guardar
                              </Button>
                            ),
                          });
                        }
                      }}
                      placeholder="Invitado"
                      className="h-6 w-32 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-secondary text-right transition-all"
                    />
                    {!logic.isNativeTurn && (
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(155,168,245,1)]" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={logic.targetLanguage} 
                      onChange={e => logic.setTargetLanguage(e.target.value)} 
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-xs px-2 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
                    >
                      {languages.map(l => <option key={l} value={l} className="bg-zinc-900 text-white">{l}</option>)}
                    </select>
                    <select 
                      value={logic.partnerVoiceGender} 
                      onChange={e => logic.setPartnerVoiceGender(e.target.value as any)} 
                      className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-xs px-2 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
                    >
                      <option value="masculino" className="bg-zinc-900 text-white">Masculino</option>
                      <option value="femenino" className="bg-zinc-900 text-white">Femenino</option>
                    </select>
                  </div>
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
            <AnimatePresence>
              {!logic.isNativeTurn && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 overflow-y-auto space-y-4 custom-scrollbar w-full pr-2 pb-4"
                >
                  {chronologicalHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/30 italic">
                      Esperando respuesta...
                    </div>
                  ) : (
                    chronologicalHistory.map((item, idx) => {
                      const isSelf = item.from === logic.targetLanguage;
                      return (
                        <div key={idx} className={cn("flex flex-col w-full max-w-[85%] mb-2", isSelf ? "ml-auto items-end" : "mr-auto items-start")}>
                          <span className={cn("text-[9px] uppercase tracking-wider mb-1 px-1 font-bold", isSelf ? "text-secondary/70" : "text-white/40")}>
                            {isSelf ? logic.targetName : logic.nativeName}
                          </span>
                          <div className={cn("p-4 rounded-2xl shadow-lg", isSelf ? "bg-secondary/90 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                            <p className="text-base font-medium leading-relaxed">{item.original}</p>
                            <p className="text-xs opacity-70 mt-1.5 italic border-t border-white/20 pt-1.5">{item.translated}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {logic.isRecording && !logic.isNativeTurn && (
                    <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-2">
                      <span className="text-[9px] uppercase tracking-wider mb-1 px-1 font-bold text-secondary/70 animate-pulse">
                        {logic.liveTranscript ? "Transcribiendo..." : "Escuchando..."}
                      </span>
                      <div className="p-4 rounded-2xl shadow-lg bg-secondary/40 text-white rounded-tr-sm border border-secondary/50 animate-pulse">
                        {logic.liveTranscript ? (
                          <p className="text-base font-medium leading-relaxed">{logic.liveTranscript}</p>
                        ) : (
                          <div className="flex items-center gap-1.5 h-6">
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {logic.isProcessing && !logic.isNativeTurn && (
                    <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-2">
                      <span className="text-[9px] uppercase tracking-wider mb-1 px-1 font-bold text-secondary/70 animate-pulse">
                        Traduciendo...
                      </span>
                      <div className="p-4 rounded-2xl shadow-lg bg-secondary/20 text-secondary-foreground rounded-tr-sm border border-secondary/30 flex items-center gap-3">
                        <div className="flex gap-2">
                           <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" />
                           <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                           <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <p className="text-base font-medium italic opacity-80">Preparando respuesta...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* CONTROLES DE ACCIÓN DE CONVERSACIÓN */}
        <div className="relative">
          {/* Timer Overlay */}
          <AnimatePresence>
            {logic.isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-black/80 backdrop-blur-xl px-8 py-3 rounded-full border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">Transcurrido</span>
                  <span className="text-rose-400 font-mono text-xl font-bold">{formatTime(logic.recordingTime)}</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold mb-1">Restante</span>
                  <span className="text-white font-mono text-xl font-bold">{formatTime(120 - logic.recordingTime)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  onClick={() => {
                    logic.clearConversation();
                    setIsChatSetupOpen(true);
                  }}
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
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                logic.saveAndClearConversation(sessionName || 'Conversación sin nombre');
                setIsFinishDialogOpen(false);
                setIsChatSetupOpen(true);
                setSessionName('');
              }}
              className="text-white/70 hover:text-white"
            >
              Finalizar
            </Button>
            <Button
              type="button"
              onClick={() => setIsFinishDialogOpen(false)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Seguir Hablando
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewChatSetupModal isOpen={isChatSetupOpen} onClose={() => setIsChatSetupOpen(false)} />
    </div>
  );
}
