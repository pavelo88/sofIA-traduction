
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
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings2, 
  Globe, 
  Cpu, 
  Cloud, 
  Zap, 
  PlayCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  "Español", "Inglés", "Francés", "Alemán", "Portugués", 
  "Italiano", "Chino", "Japonés", "Árabe", "Ruso"
];

export function ProfileModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const { 
    nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage,
    learningProgress, aiEngineMode, userCredits, setAiEngineMode, addCredits,
    isProfileOpen, setIsProfileOpen
  } = useStore();
  
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const handleUpdate = async (field: string, value: any) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, {
        [field]: value,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
  };

  const simulateWatchAd = () => {
    setIsWatchingAd(true);
    setTimeout(() => {
      addCredits(5);
      setIsWatchingAd(false);
    }, 2000);
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="glass-panel border-white/10 bg-zinc-950/95 backdrop-blur-3xl text-white rounded-[2.5rem] max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Settings2 className="text-primary w-6 h-6" /> Centro de Control Premium
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configura tu experiencia de aprendizaje y motor de IA.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                <User className="text-primary w-7 h-7" />
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-bold text-lg tracking-tight">Explorador Espacial</h4>
                <p className="text-xs text-white/40">{user?.email || 'Modo Invitado Activo'}</p>
              </div>
            </div>
            <div className="space-y-2">
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
                  <SelectTrigger className="bg-white/[0.03] border-white/10 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white">
                    {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest text-white/50">Objetivo</Label>
                <Select value={targetLanguage} onValueChange={(v) => { setTargetLanguage(v); handleUpdate('targetLanguage', v); }}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white">
                    {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Infraestructura de IA
            </h3>
            
            <div className="grid gap-3">
              {/* GEMINI MODE */}
              <button 
                onClick={() => { setAiEngineMode('gemini'); handleUpdate('aiEngineMode', 'gemini'); }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                  aiEngineMode === 'gemini' ? "bg-primary/10 border-primary/40 shadow-lg" : "bg-white/[0.02] border-white/5"
                )}
              >
                <Cloud className={cn("w-5 h-5", aiEngineMode === 'gemini' ? "text-primary" : "text-white/20")} />
                <div className="flex-1">
                  <h4 className="text-xs font-bold">Gemini Cloud Engine</h4>
                  <p className="text-[9px] text-white/40">Fidelidad máxima. 1 crédito/msg.</p>
                </div>
                <span className="text-xs font-mono font-bold">{userCredits}</span>
              </button>

              {/* DEEPSEEK MODE */}
              <button 
                onClick={() => { setAiEngineMode('deepseek'); handleUpdate('aiEngineMode', 'deepseek'); }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                  aiEngineMode === 'deepseek' ? "bg-secondary/10 border-secondary/40 shadow-lg" : "bg-white/[0.02] border-white/5"
                )}
              >
                <Sparkles className={cn("w-5 h-5", aiEngineMode === 'deepseek' ? "text-secondary" : "text-white/20")} />
                <div className="flex-1">
                  <h4 className="text-xs font-bold">DeepSeek Pro</h4>
                  <p className="text-[9px] text-white/40">Económico y veloz. 0.5 créditos/msg.</p>
                </div>
                <Badge variant="outline" className="text-[8px] border-secondary/30 text-secondary">ECO</Badge>
              </button>

              {/* DEVICE MODE */}
              <button 
                onClick={() => { setAiEngineMode('device'); handleUpdate('aiEngineMode', 'device'); }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                  aiEngineMode === 'device' ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg" : "bg-white/[0.02] border-white/5"
                )}
              >
                <Cpu className={cn("w-5 h-5", aiEngineMode === 'device' ? "text-emerald-500" : "text-white/20")} />
                <div className="flex-1">
                  <h4 className="text-xs font-bold">On-Device Intelligence</h4>
                  <p className="text-[9px] text-white/40">Gemini Nano local. Privado y 100% Gratis.</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </button>
            </div>

            <Button 
              onClick={simulateWatchAd}
              disabled={isWatchingAd}
              className="w-full h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 gap-2 text-[10px] font-headline uppercase"
            >
              {isWatchingAd ? <Zap className="w-3 h-3 animate-spin" /> : <><PlayCircle className="w-4 h-4" /> Ganar +5 Créditos Gratis</>}
            </Button>
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-white/5">
          <Button onClick={() => setIsProfileOpen(false)} className="w-full h-12 rounded-xl bg-primary text-white font-bold">
            Confirmar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
