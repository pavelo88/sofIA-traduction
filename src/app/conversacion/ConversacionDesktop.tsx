'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, History, Sparkles, User, Users,
  Wifi, ArrowUpDown, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversacionDesktop() {
  const logic = useConversacion();
  const videoRef = useRef<HTMLVideoElement>(null);

  // El último mensaje del hablante nativo
  const lastNativeMsg = logic.history.filter(h => h.from === logic.nativeLanguage).at(0);
  // El último mensaje del hablante extranjero (at(0) porque el arreglo está ordenado más-reciente-primero)
  const lastForeignMsg = logic.history.filter(h => h.from === logic.targetLanguage).at(0);

  useEffect(() => {
    if (videoRef.current && logic.streamRef.current && logic.isCameraActive) {
      videoRef.current.srcObject = logic.streamRef.current;
    }
  }, [logic.isCameraActive, logic.streamRef.current]);

  return (
    <div className="h-[calc(100vh-2rem)] w-full text-white p-6 grid grid-cols-12 gap-6 overflow-hidden">
      
      {/* SECCIÓN PRINCIPAL DE INTERMEDIACIÓN (8 COLUMNAS) */}
      <main className="col-span-8 flex flex-col gap-6 h-full">
        
        {/* PANEL DUAL DE DIÁLOGO DINÁMICO */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* PANEL DE USUARIO LOCAL */}
          <motion.div 
            layout
            onClick={() => logic.isNativeTurn || (window.speechSynthesis.cancel(), logic.toggleSession())}
            animate={{
              flex: logic.isNativeTurn ? 2 : 1,
              opacity: logic.isNativeTurn ? 1 : 0.6,
              scale: logic.isNativeTurn ? 1 : 0.98,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "glass-panel rounded-[2.5rem] p-8 flex flex-col justify-between relative cursor-pointer group overflow-hidden border",
              logic.isNativeTurn 
                ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-neon-primary z-10" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] z-0"
            )}
          >
            {/* Cabecera del panel */}
            <motion.div layout className="flex justify-between items-center w-full">
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

            {/* Contenido / Transcripción */}
            <motion.div layout className="my-auto pt-4">
              <p className={cn(
                "font-headline font-bold leading-tight tracking-tight transition-all duration-300",
                logic.isNativeTurn ? "text-4xl text-white" : "text-2xl text-white/40 line-clamp-2"
              )}>
                {lastNativeMsg?.original || "Presiona el micrófono para hablar..."}
              </p>
              {lastNativeMsg?.translated && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-primary/80 mt-3 italic font-medium"
                >
                  {lastNativeMsg.translated}
                </motion.p>
              )}
            </motion.div>
          </motion.div>

          {/* PANEL DE INVITADO EXTRANJERO */}
          <motion.div 
            layout
            onClick={() => !logic.isNativeTurn || (window.speechSynthesis.cancel(), logic.toggleSession())}
            animate={{
              flex: !logic.isNativeTurn ? 2 : 1,
              opacity: !logic.isNativeTurn ? 1 : 0.6,
              scale: !logic.isNativeTurn ? 1 : 0.98,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "glass-panel rounded-[2.5rem] p-8 flex flex-col justify-between relative cursor-pointer group overflow-hidden border",
              !logic.isNativeTurn 
                ? "border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent shadow-neon-secondary z-10" 
                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] z-0"
            )}
          >
            {/* Cabecera del panel */}
            <motion.div layout className="flex justify-between items-center w-full">
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

            {/* Contenido / Transcripción */}
            <motion.div layout className="my-auto pt-4">
              <p className={cn(
                "font-headline font-bold leading-tight tracking-tight transition-all duration-300",
                !logic.isNativeTurn ? "text-4xl text-white" : "text-2xl text-white/40 line-clamp-2"
              )}>
                {lastForeignMsg?.original || "Esperando respuesta..."}
              </p>
              {lastForeignMsg?.translated && (
                <motion.p 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-secondary/80 mt-3 italic font-medium"
                >
                  {lastForeignMsg.translated}
                </motion.p>
              )}
            </motion.div>
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
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={logic.toggleSession}
                disabled={logic.isProcessing || logic.isSpeaking}
                className={cn(
                  "h-16 px-8 rounded-full transition-all duration-500 font-headline uppercase tracking-widest text-xs font-bold gap-3 group relative overflow-hidden",
                  logic.isRecording
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30"
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
                window.speechSynthesis.cancel();
                logic.toggleSession();
              }}
              className="h-12 px-5 rounded-2xl bg-white/5 border-white/10 text-white/70 hover:text-white flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <ArrowUpDown className="w-4 h-4" /> Alternar
            </Button>
          </div>
        </div>

      </main>

      {/* SECCIÓN LATERAL DE TELEMETRÍA (4 COLUMNAS) */}
      <aside className="col-span-4 flex flex-col gap-6 h-full">
        
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
        <div className="flex-1 glass-panel rounded-[2.5rem] border-white/10 p-6 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-headline uppercase tracking-[0.2em] text-white/50 font-bold">Historial de Turnos</h4>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <History className="w-4 h-4 text-white/70" />
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
            <span className="text-[9px] font-headline uppercase text-white/30 bg-white/5 px-2 py-1 rounded-md">Next.js 15 · Turbopack</span>
          </div>
        </div>

      </aside>

    </div>
  );
}
