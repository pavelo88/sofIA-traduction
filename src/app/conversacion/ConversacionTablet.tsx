'use client';

import { useState } from 'react';
import { useConversacion, getLocalizedLabels } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, User, Users, RotateCw, Sparkles, Settings2, Sparkle, Trash2, Volume2
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
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { NewChatSetupModal } from '@/components/modals/NewChatSetupModal';

export function ConversacionTablet() {
  const logic = useConversacion();
  const { defaultNativeName, defaultTargetName, setDefaultNativeName, setDefaultTargetName } = useStore();
  const { toast } = useToast();
  const [isTableModeActive, setIsTableModeActive] = useState(false);
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Chino', 'Japonés', 'Árabe', 'Ruso'];
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isChatSetupOpen, setIsChatSetupOpen] = useState(logic.history.length === 0);

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
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              className="h-12 px-6 rounded-2xl transition-all duration-500 font-headline uppercase text-[10px] tracking-widest font-bold"
              onClick={() => setIsFinishDialogOpen(true)}
            >
              Finalizar Conversación
            </Button>
            {logic.history.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  logic.clearConversation();
                  setIsChatSetupOpen(true);
                }}
                className="w-12 h-12 rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="w-6 h-6" />
              </Button>
            )}
          </div>
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
            flex: logic.isNativeTurn ? "1 1 auto" : "0 0 100px",
            opacity: logic.isNativeTurn ? 1 : 0.6,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-start border transition-colors cursor-pointer hover:bg-primary/[0.03] min-h-0", logic.isNativeTurn ? "border-primary/40 bg-gradient-to-br from-primary/10 to-transparent shadow-neon-primary" : "border-white/5 bg-white/[0.02]")}
        >
          <div className="flex items-center gap-4 mb-6">
            <User className={cn("w-8 h-8 flex-shrink-0", logic.isNativeTurn ? "text-primary" : "text-white/40")} />
            <div className="flex flex-col gap-1 w-full">
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
                className="h-8 w-40 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-xs font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-primary transition-all"
              />
              <div className="flex gap-2 mt-1">
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
                  <option value="masculino" className="bg-zinc-900 text-white">Masc</option>
                  <option value="femenino" className="bg-zinc-900 text-white">Fem</option>
                </select>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {logic.isNativeTurn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex-1 overflow-y-auto space-y-4 custom-scrollbar text-left w-full pr-2 pb-4"
              >
                {chronologicalHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-3xl font-headline font-bold text-white/30 italic">
                    Toca el micrófono para empezar a hablar...
                  </div>
                ) : (
                  chronologicalHistory.map((item, idx) => {
                    const isSelf = item.from === logic.nativeLanguage;
                    return (
                      <div key={idx} className={cn("flex flex-col w-full max-w-[85%] mb-4", isSelf ? "ml-auto items-end" : "mr-auto items-start")}>
                        <span className={cn("text-xs uppercase tracking-wider mb-1 px-1 font-bold", isSelf ? "text-primary/70" : "text-white/40")}>
                          {isSelf ? logic.nativeName : logic.targetName}
                        </span>
                        <div className={cn("p-4 rounded-3xl shadow-lg relative group", isSelf ? "bg-primary/90 text-white rounded-tr-sm" : "bg-white/10 text-white rounded-tl-sm")}>
                          <p className="text-base font-medium leading-relaxed pr-8">
                            {item.from === logic.nativeLanguage ? item.original : item.translated}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                            <p className="text-sm opacity-70 italic">
                              {item.from === logic.nativeLanguage ? item.translated : item.original}
                            </p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const textToPlay = isSelf ? item.translated : item.original;
                                const langName = isSelf ? logic.targetLanguage : logic.nativeLanguage;
                                const genderToUse = isSelf ? logic.partnerVoiceGender : logic.userVoiceGender;
                                logic.replayAudio(textToPlay, langName, genderToUse);
                              }}
                              className="p-1.5 rounded-full hover:bg-white/20 transition-colors ml-2"
                            >
                              <Volume2 className="w-4 h-4 opacity-80" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {logic.isRecording && logic.isNativeTurn && (
                  <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-4">
                    <span className="text-xs uppercase tracking-wider mb-1 px-1 font-bold text-primary/70 animate-pulse">
                      {logic.liveTranscript ? "Transcribiendo..." : "Escuchando..."}
                    </span>
                    <div className="p-5 rounded-3xl shadow-lg bg-primary/40 text-white rounded-tr-md border border-primary/50 animate-pulse">
                      {logic.liveTranscript ? (
                        <p className="text-xl font-medium leading-relaxed">{logic.liveTranscript}</p>
                      ) : (
                        <div className="flex items-center gap-2 h-7">
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {logic.isProcessing && logic.isNativeTurn && (
                  <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-4">
                    <span className="text-xs uppercase tracking-wider mb-1 px-1 font-bold text-primary/70 animate-pulse">
                      Traduciendo...
                    </span>
                    <div className="p-5 rounded-3xl shadow-lg bg-primary/20 text-primary-foreground rounded-tr-md border border-primary/30 flex items-center gap-3">
                      <div className="flex gap-2">
                         <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" />
                         <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                         <span className="w-2 h-2 bg-primary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <p className="text-xl font-medium italic opacity-80">Preparando tu mensaje...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* PANEL DE INVITADO */}
        <motion.div 
          layout
          onClick={() => !logic.isNativeTurn || logic.toggleTurn()}
          animate={{
            flex: !logic.isNativeTurn ? "1 1 auto" : "0 0 100px",
            opacity: !logic.isNativeTurn ? 1 : 0.5
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn("glass-panel rounded-[3rem] p-12 flex flex-col justify-start border transition-colors items-end text-right cursor-pointer hover:bg-secondary/[0.03] min-h-0", !logic.isNativeTurn ? "border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent shadow-neon-secondary" : "border-white/5 bg-white/[0.02]", isTableModeActive && "rotate-180")}
        >
          <div className="flex items-center gap-4 mb-6 justify-end">
            <div className="flex flex-col gap-1 w-full items-end text-right">
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
                className="h-8 w-40 bg-transparent border-b border-white/20 hover:border-white/50 rounded-none px-0 text-xs font-headline uppercase tracking-widest text-white/80 font-bold focus-visible:ring-0 focus-visible:border-secondary text-right transition-all"
              />
              <div className="flex gap-2 mt-1 justify-end">
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
                  <option value="masculino" className="bg-zinc-900 text-white">Masc</option>
                  <option value="femenino" className="bg-zinc-900 text-white">Fem</option>
                </select>
              </div>
            </div>
            <Users className={cn("w-8 h-8 flex-shrink-0", !logic.isNativeTurn ? "text-secondary" : "text-white/40")} />
          </div>
          
          <AnimatePresence>
            {!logic.isNativeTurn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn("flex-1 overflow-y-auto space-y-4 custom-scrollbar text-left w-full pr-2 pb-4", isTableModeActive && "rotate-180")}
              >
                {chronologicalHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-3xl font-headline font-bold text-white/30 italic">
                    Esperando respuesta...
                  </div>
                ) : (
                  chronologicalHistory.map((item, idx) => {
                    const isSelf = item.from === logic.targetLanguage;
                    return (
                      <div key={idx} className={cn("flex flex-col w-full max-w-[85%] mb-4", isSelf ? "ml-auto items-end" : "mr-auto items-start")}>
                        <span className={cn("text-xs uppercase tracking-wider mb-1 px-1 font-bold", isSelf ? "text-secondary/70" : "text-white/40")}>
                          {isSelf ? logic.targetName : logic.nativeName}
                        </span>
                        <div className={cn("p-5 rounded-3xl shadow-lg", isSelf ? "bg-secondary/90 text-white rounded-tr-md" : "bg-white/10 text-white rounded-tl-md")}>
                          <p className="text-xl font-medium leading-relaxed">
                            {item.from === logic.targetLanguage ? item.original : item.translated}
                          </p>
                          <p className="text-sm opacity-70 mt-2 italic border-t border-white/20 pt-2">
                            {item.from === logic.targetLanguage ? item.translated : item.original}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {logic.isRecording && !logic.isNativeTurn && (
                  <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-4">
                    <span className="text-xs uppercase tracking-wider mb-1 px-1 font-bold text-secondary/70 animate-pulse">
                      {logic.liveTranscript ? "Transcribiendo..." : "Escuchando..."}
                    </span>
                    <div className="p-5 rounded-3xl shadow-lg bg-secondary/40 text-white rounded-tr-md border border-secondary/50 animate-pulse">
                      {logic.liveTranscript ? (
                        <p className="text-xl font-medium leading-relaxed">{logic.liveTranscript}</p>
                      ) : (
                        <div className="flex items-center gap-2 h-7">
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {logic.isProcessing && !logic.isNativeTurn && (
                  <div className="flex flex-col w-full max-w-[85%] ml-auto items-end mb-4">
                    <span className="text-xs uppercase tracking-wider mb-1 px-1 font-bold text-secondary/70 animate-pulse">
                      Traduciendo...
                    </span>
                    <div className="p-5 rounded-3xl shadow-lg bg-secondary/20 text-secondary-foreground rounded-tr-md border border-secondary/30 flex items-center gap-3">
                      <div className="flex gap-2">
                         <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" />
                         <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                         <span className="w-2 h-2 bg-secondary/70 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <p className="text-xl font-medium italic opacity-80">Preparando respuesta...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* VISOR DE AUDIO Y TEMPORIZADOR */}
        {logic.isRecording && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-4 bg-zinc-900/90 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-2xl shadow-neon-primary mb-2"
          >
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Transcurrido</span>
              <span className="text-rose-400 font-mono text-sm font-bold">{formatTime(logic.recordingTime)}</span>
            </div>
            
            <div className="w-px h-6 bg-white/20"></div>
            
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-white/50 uppercase tracking-widest font-bold">Restante</span>
              <span className="text-white font-mono text-sm font-bold">{formatTime(120 - logic.recordingTime)}</span>
            </div>
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
          <DialogFooter className="flex gap-3 sm:justify-start">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-white/70 hover:text-white hover:bg-white/10 h-14 rounded-xl"
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
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl"
              onClick={() => setIsFinishDialogOpen(false)}
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
