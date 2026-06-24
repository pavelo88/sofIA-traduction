'use client';

import { useConversacion, getLocalizedLabels } from './use-conversacion';
import {
  Mic, MicOff, Camera, CameraOff, User, Users, Sparkles, Globe, Settings2, Sparkle, History, MessageSquare, Trash2, Volume2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
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

export function ConversacionMobile() {
  const logic = useConversacion();
  const { defaultNativeName, defaultTargetName, setDefaultNativeName, setDefaultTargetName } = useStore();
  
  const nativeScrollRef = useRef<HTMLDivElement>(null);
  const targetScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para panel local
  useEffect(() => {
    if (nativeScrollRef.current) {
      nativeScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logic.history, logic.liveTranscript, logic.isProcessing]);

  // Auto-scroll para panel invitado
  useEffect(() => {
    if (targetScrollRef.current) {
      targetScrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logic.history, logic.liveTranscript, logic.isProcessing]);

  const { toast } = useToast();
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [unlockedScroll, setUnlockedScroll] = useState<'local' | 'guest' | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Chino', 'Japonés', 'Árabe', 'Ruso'];

  // Historial cronológico invertido
  const chronologicalHistory = [...logic.history].reverse();
  const [isChatSetupOpen, setIsChatSetupOpen] = useState(logic.history.length === 0);

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

      <div className="flex-1 flex flex-col gap-4 overflow-hidden mb-12 relative z-10 min-h-0">
        {/* PANEL DE USUARIO LOCAL (ESPAÑOL) */}
        <motion.div 
          layout
          onClick={() => logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            flex: logic.isNativeTurn ? "1 1 auto" : "0 0 80px",
            opacity: logic.isNativeTurn ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative rounded-[2.5rem] p-6 border flex flex-col justify-start overflow-hidden cursor-pointer hover:bg-primary/[0.03] transition-all min-h-0", 
            logic.isNativeTurn ? "bg-primary/10 border-primary/40 shadow-neon-primary" : "bg-white/[0.02] border-white/5"
          )}
        >
          <div className="flex flex-col gap-2 mb-2 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <User className={cn("w-4 h-4 flex-shrink-0", logic.isNativeTurn ? "text-primary" : "text-white/30")} />
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
                  className="h-6 w-24 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-primary transition-all"
                />
              </div>
              {logic.isNativeTurn && logic.isRecording && (
                <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Grabando</span>
              )}
            </div>
            <div className="flex gap-2">
              <select 
                value={logic.nativeLanguage} 
                onChange={e => logic.setNativeLanguage(e.target.value)} 
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-[10px] px-1 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
              >
                {languages.map(l => <option key={l} value={l} className="bg-zinc-900 text-white">{l}</option>)}
              </select>
              <select 
                value={logic.userVoiceGender} 
                onChange={e => logic.setUserVoiceGender(e.target.value as any)} 
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-[10px] px-1 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
              >
                <option value="masculino" className="bg-zinc-900 text-white">Masc</option>
                <option value="femenino" className="bg-zinc-900 text-white">Fem</option>
              </select>
            </div>
          </div>
          
          <AnimatePresence>
            {logic.isNativeTurn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative flex-1 min-h-0"
              >
                {unlockedScroll !== 'local' && (
                  <div 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px] cursor-pointer rounded-xl"
                    onClick={(e) => { e.stopPropagation(); setUnlockedScroll('local'); }}
                  >
                    <span className="bg-black/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-lg">Toca para desplazar</span>
                  </div>
                )}
                <div className="absolute inset-0 overflow-y-auto space-y-4 custom-scrollbar text-left pr-1 pb-4">
                  {chronologicalHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/30 italic text-sm text-center px-4">
                      Toca el micrófono para empezar a hablar...
                    </div>
                  ) : (
                    chronologicalHistory.map((item, idx) => {
                      const isSelf = item.from === logic.nativeLanguage;
                      return (
                        <div key={idx} className={cn("flex flex-col w-full max-w-[85%] mb-2", isSelf ? "ml-auto items-end" : "mr-auto items-start")}>
                          <span className={cn("text-[9px] uppercase tracking-wider mb-1 px-1 font-bold", isSelf ? "text-primary/70" : "text-white/40")}>
                            {isSelf ? logic.nativeName : logic.targetName}
                          </span>
                          <div className={cn("p-3 rounded-2xl shadow-lg group relative", isSelf ? "bg-primary/90 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-relaxed pr-2">
                                {item.from === logic.nativeLanguage ? item.original : item.translated}
                              </p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const textToPlay = item.from === logic.nativeLanguage ? item.original : item.translated;
                                  logic.replayAudio(textToPlay, logic.nativeLanguage, logic.userVoiceGender);
                                }}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                              >
                                <Volume2 className="w-3.5 h-3.5 opacity-80" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
                              <p className="text-xs opacity-70 italic pr-2">
                                {item.from === logic.nativeLanguage ? item.translated : item.original}
                              </p>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const textToPlay = item.from === logic.nativeLanguage ? item.translated : item.original;
                                  logic.replayAudio(textToPlay, logic.targetLanguage, logic.partnerVoiceGender);
                                }}
                                className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                              >
                                <Volume2 className="w-3.5 h-3.5 opacity-80" />
                              </button>
                            </div>
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
                      <div className="p-3 rounded-2xl shadow-lg bg-primary/40 text-white rounded-tr-sm border border-primary/50 animate-pulse">
                        {logic.liveTranscript ? (
                          <p className="text-sm font-medium leading-relaxed">{logic.liveTranscript}</p>
                        ) : (
                          <div className="flex items-center gap-1.5 h-5">
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
                      <div className="p-3 rounded-2xl shadow-lg bg-primary/20 text-primary-foreground rounded-tr-sm border border-primary/30 flex items-center gap-2">
                        <div className="flex gap-1.5">
                           <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-pulse" />
                           <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                           <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <p className="text-sm font-medium italic opacity-80">Preparando tu mensaje...</p>
                      </div>
                    </div>
                  )}
                  <div ref={nativeScrollRef} className="h-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* PANEL DE INVITADO (EXTRANJERO) */}
        <motion.div 
          layout
          onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            flex: !logic.isNativeTurn ? "1 1 auto" : "0 0 80px",
            opacity: !logic.isNativeTurn ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "relative rounded-[2.5rem] p-6 border flex flex-col justify-start overflow-hidden cursor-pointer hover:bg-secondary/[0.03] transition-all min-h-0", 
            !logic.isNativeTurn ? "bg-secondary/10 border-secondary/40 shadow-neon-secondary" : "bg-white/[0.02] border-white/5"
          )}
        >
          <div className="flex flex-col gap-2 mb-2 w-full">
            <div className="flex items-center justify-between w-full">
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
                  className="h-6 w-24 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-[10px] font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-secondary transition-all"
                />
                <Users className={cn("w-4 h-4 flex-shrink-0", !logic.isNativeTurn ? "text-secondary" : "text-white/30")} />
              </div>
              {!logic.isNativeTurn && logic.isRecording && (
                <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest animate-pulse">Grabando</span>
              )}
            </div>
            <div className="flex gap-2">
              <select 
                value={logic.targetLanguage} 
                onChange={e => logic.setTargetLanguage(e.target.value)} 
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-[10px] px-1 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
              >
                {languages.map(l => <option key={l} value={l} className="bg-zinc-900 text-white">{l}</option>)}
              </select>
              <select 
                value={logic.partnerVoiceGender} 
                onChange={e => logic.setPartnerVoiceGender(e.target.value as any)} 
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-md text-[10px] px-1 py-1 outline-none text-white/60 focus:text-white transition-colors cursor-pointer"
              >
                <option value="masculino" className="bg-zinc-900 text-white">Masc</option>
                <option value="femenino" className="bg-zinc-900 text-white">Fem</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {!logic.isNativeTurn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative flex-1 min-h-0"
              >
                {unlockedScroll !== 'guest' && (
                  <div 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px] cursor-pointer rounded-xl"
                    onClick={(e) => { e.stopPropagation(); setUnlockedScroll('guest'); }}
                  >
                    <span className="bg-black/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-lg">Toca para desplazar</span>
                  </div>
                )}
                <div className="absolute inset-0 overflow-y-auto space-y-4 custom-scrollbar text-left pr-1 pb-4">
                  {chronologicalHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-white/30 italic text-sm text-center px-4">
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
                          <div className={cn("p-3 rounded-2xl shadow-lg group relative", isSelf ? "bg-secondary/90 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-relaxed pr-2">
                              {item.from === logic.targetLanguage ? item.original : item.translated}
                            </p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const textToPlay = item.from === logic.targetLanguage ? item.original : item.translated;
                                logic.replayAudio(textToPlay, logic.targetLanguage, logic.partnerVoiceGender);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5 opacity-80" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/20">
                            <p className="text-xs opacity-70 italic pr-2">
                              {item.from === logic.targetLanguage ? item.translated : item.original}
                            </p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const textToPlay = item.from === logic.targetLanguage ? item.translated : item.original;
                                logic.replayAudio(textToPlay, logic.nativeLanguage, logic.userVoiceGender);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5 opacity-80" />
                            </button>
                          </div>
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
                      <div className="p-3 rounded-2xl shadow-lg bg-secondary/40 text-white rounded-tr-sm border border-secondary/50 animate-pulse">
                        {logic.liveTranscript ? (
                          <p className="text-sm font-medium leading-relaxed">{logic.liveTranscript}</p>
                        ) : (
                          <div className="flex items-center gap-1.5 h-5">
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
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
                      <div className="p-3 rounded-2xl shadow-lg bg-secondary/20 text-secondary-foreground rounded-tr-sm border border-secondary/30 flex items-center gap-2">
                        <div className="flex gap-1.5">
                           <span className="w-1.5 h-1.5 bg-secondary/70 rounded-full animate-pulse" />
                           <span className="w-1.5 h-1.5 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                           <span className="w-1.5 h-1.5 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        </div>
                        <p className="text-sm font-medium italic opacity-80">Preparando respuesta...</p>
                      </div>
                    </div>
                  )}
                  <div ref={targetScrollRef} className="h-4" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

          <AnimatePresence>
            {logic.isRecording && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-4 bg-zinc-900/90 border border-white/10 rounded-full px-5 py-2 backdrop-blur-2xl shadow-neon-primary my-2"
              >
                <div className="flex flex-col items-center">
                  <span className="text-rose-400 font-mono text-xs font-bold">{formatTime(logic.recordingTime)}</span>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex flex-col items-center">
                  <span className="text-white font-mono text-xs font-bold">{formatTime(120 - logic.recordingTime)}</span>
                </div>
              </motion.div>
            )}
            {logic.isPreparingMic && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-2"
              >
                Preparando...
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-4">
            <AnimatePresence>
              {logic.isRecording && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, x: 20 }} 
                  animate={{ opacity: 1, scale: 1, x: 0 }} 
                  exit={{ opacity: 0, scale: 0.5, x: 20 }} 
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    onClick={logic.cancelRecording}
                    variant="ghost"
                    className="h-14 w-14 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] backdrop-blur-md"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={logic.toggleSession}
                disabled={logic.isProcessing || logic.isSpeaking || logic.isPreparingMic}
                className={cn(
                  "h-20 w-20 rounded-full transition-all duration-300 flex items-center justify-center shadow-2xl relative overflow-hidden",
                  logic.isRecording 
                    ? "bg-emerald-500 hover:bg-emerald-400 scale-95 shadow-neon-emerald" 
                    : logic.isSpeaking
                    ? "bg-primary/30 border border-primary/40"
                    : "bg-white hover:bg-white/90 text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                )}
              >
                {logic.isRecording && (
                  <div className="absolute inset-0 bg-emerald-400/50 animate-ping rounded-full z-0" />
                )}
                {logic.isSpeaking && (
                  <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-full z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center">
                  {logic.isProcessing ? <Sparkle className="w-8 h-8 animate-spin" /> 
                    : logic.isSpeaking ? <Sparkle className="w-8 h-8 text-primary animate-pulse" />
                    : logic.isRecording ? <span className="text-[10px] font-black tracking-widest text-white mt-1">OK</span>
                    : <Mic className="w-8 h-8" />}
                </div>
              </Button>
            </motion.div>
          </div>
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
              <div className="glass-panel p-4 rounded-2xl flex justify-between items-center bg-white/[0.02]">
                <Label className="text-xs uppercase text-white/60 tracking-widest font-bold">Conectividad</Label>
                <Button 
                  onClick={() => {
                    import('./use-multiplayer-sync').then(m => m.useMultiplayerSync().createRoom());
                  }} 
                  className="h-10 px-6 rounded-xl transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                >
                  Conectar (Próximamente)
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
              <div className="flex items-center justify-between">
                <SheetTitle className="text-white text-left font-headline flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Historial
                </SheetTitle>
                {logic.history.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8 text-[10px] uppercase tracking-wider font-bold ml-2 rounded-full px-4"
                    onClick={() => setIsFinishDialogOpen(true)}
                  >
                    Finalizar
                  </Button>
                )}
              </div>
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

      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white w-[90vw] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Finalizar Conversación</DialogTitle>
            <DialogDescription className="text-white/50">
              Ingresa un nombre para guardar esta conversación.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              placeholder="Ej: Con Juan en el café..."
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => {
                logic.saveAndClearConversation(sessionName || 'Conversación sin nombre');
                setIsFinishDialogOpen(false);
                setIsChatSetupOpen(true);
                setSessionName('');
              }}
            >
              Finalizar
            </Button>
            <Button
              type="button"
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                logic.saveAndClearConversation(sessionName || 'Conversación sin nombre');
                setIsFinishDialogOpen(false);
                setSessionName('');
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewChatSetupModal isOpen={isChatSetupOpen} onClose={() => setIsChatSetupOpen(false)} />
    </div>
  );
}
