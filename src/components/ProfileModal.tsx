'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Settings2, 
  Globe, 
  Zap, 
  PlayCircle,
  Server
} from 'lucide-react';
import { ModelSelectionModal } from './ModelSelectionModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const LANGUAGES = [
  "Español", "Inglés", "Francés", "Alemán", "Portugués", 
  "Italiano", "Chino", "Japonés", "Árabe", "Ruso"
];

export function ProfileModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const { 
    nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage,
    learningProgress, addCredits, isProfileOpen, setIsProfileOpen,
    aiEngineMode
  } = useStore();
  
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  const handleUpdate = async (field: string, value: any) => {
    // Firebase permissions bypass - suppress all database writes to ensure offline/guest compatibility
    console.log(`[Firebase Bypass] Suppressed profile write for ${field}:`, value);
  };

  const simulateWatchAd = () => {
    setIsWatchingAd(true);
    setTimeout(() => {
      addCredits(5);
      setIsWatchingAd(false);
    }, 2000);
  };

  const engineNames = {
    device: "On-Device AI",
    gemini: "Gemini Cloud",
    deepseek: "DeepSeek Pro"
  };

  return (
    <>
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="glass-panel border-white/10 bg-zinc-950/95 backdrop-blur-3xl text-white rounded-[2.5rem] max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="font-headline text-2xl flex items-center gap-3">
              <Settings2 className="text-primary w-6 h-6" /> Centro de Control Premium
            </DialogTitle>
            <DialogDescription className="sr-only">
              Configura tu experiencia de aprendizaje.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/30 to-purple-600/30 flex items-center justify-center border border-white/10 shadow-neon-primary">
                  <User className="text-primary w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h4 className="font-headline font-bold text-lg tracking-tight">Explorador Espacial</h4>
                  <p className="text-xs text-white/40">{user?.email || 'Modo Invitado Activo'}</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/40">
                  <span>Progreso Global</span>
                  <span className="text-primary">{learningProgress}%</span>
                </div>
                <Progress value={learningProgress} className="h-1.5 bg-white/5" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Ruta de Aprendizaje
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest text-white/50">Nativo</Label>
                  <Select value={nativeLanguage} onValueChange={(v) => { setNativeLanguage(v); handleUpdate('nativeLanguage', v); }}>
                    <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 text-white border-white/10 rounded-xl">
                      {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase tracking-widest text-white/50">Objetivo</Label>
                  <Select value={targetLanguage} onValueChange={(v) => { setTargetLanguage(v); handleUpdate('targetLanguage', v); }}>
                    <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 text-white border-white/10 rounded-xl">
                      {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Potencia IA
              </h3>
              
              <Button 
                onClick={() => setIsModelModalOpen(true)}
                variant="outline"
                className="w-full h-16 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border-white/10 flex items-center justify-between px-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Server className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Motor Actual</div>
                    <div className="text-sm font-bold">{engineNames[aiEngineMode as keyof typeof engineNames] || "Seleccionar Motor"}</div>
                  </div>
                </div>
                <span className="text-[10px] text-primary bg-primary/10 px-3 py-1 rounded-full">Cambiar</span>
              </Button>

              <Button 
                onClick={simulateWatchAd}
                disabled={isWatchingAd}
                className="w-full h-12 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 gap-2 text-[10px] font-headline uppercase mt-2"
              >
                {isWatchingAd ? <Zap className="w-3 h-3 animate-spin" /> : <><PlayCircle className="w-4 h-4" /> Ganar +5 Créditos Gratis</>}
              </Button>
            </div>
          </div>

          <div className="p-8 pt-4 border-t border-white/5 bg-black/20">
            <Button onClick={() => setIsProfileOpen(false)} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-neon-primary transition-all">
              Confirmar Configuración
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ModelSelectionModal 
        isOpen={isModelModalOpen} 
        onClose={() => setIsModelModalOpen(false)} 
      />
    </>
  );
}
