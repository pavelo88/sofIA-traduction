
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
  GraduationCap, 
  Cpu, 
  Cloud, 
  Zap, 
  PlayCircle,
  ShieldCheck,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  "Español", "Inglés", "Francés", "Alemán", "Portugués", 
  "Italiano", "Chino", "Japonés"
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
            Configura tu experiencia de aprendizaje, motor de IA y preferencias de idioma.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                <User className="text-primary w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-bold text-lg tracking-tight">Explorador Espacial</h4>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase tracking-widest">
                    Nivel {Math.floor(learningProgress / 10)}
                  </Badge>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest text-white/50 ml-1">Idioma Nativo</Label>
                <Select value={nativeLanguage} onValueChange={(v) => { setNativeLanguage(v); handleUpdate('nativeLanguage', v); }}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-2xl focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                    {LANGUAGES.map(lang => <SelectItem key={lang} value={lang} className="focus:bg-primary/20">{lang}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest text-white/50 ml-1">Idioma Objetivo</Label>
                <Select value={targetLanguage} onValueChange={(v) => { setTargetLanguage(v); handleUpdate('targetLanguage', v); }}>
                  <SelectTrigger className="bg-white/[0.03] border-white/10 h-12 rounded-2xl focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                    {LANGUAGES.map(lang => <SelectItem key={lang} value={lang} className="focus:bg-primary/20">{lang}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Infraestructura de IA
            </h3>
            
            <div className="grid gap-4">
              <button 
                onClick={() => { setAiEngineMode('cloud'); handleUpdate('aiEngineMode', 'cloud'); }}
                className={cn(
                  "flex flex-col gap-4 p-5 rounded-[2rem] border transition-all duration-300 text-left relative overflow-hidden",
                  aiEngineMode === 'cloud' 
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_30px_rgba(161,98,247,0.1)]" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", aiEngineMode === 'cloud' ? "bg-primary text-white" : "bg-white/10 text-white/40")}>
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm">Gemini Cloud Engine</h4>
                      <p className="text-[10px] text-white/40">Alta fidelidad y razonamiento avanzado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono">{userCredits}</span>
                    <p className="text-[8px] uppercase tracking-tighter text-white/30">Créditos</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Progress value={(userCredits / 100) * 100} className="h-1 bg-white/5" />
                  <p className="text-[9px] text-white/50 italic">Consumo: 1 crédito por mensaje.</p>
                </div>

                <Button 
                  size="sm"
                  variant="ghost" 
                  disabled={isWatchingAd}
                  onClick={(e) => { e.stopPropagation(); simulateWatchAd(); }}
                  className="w-full mt-2 h-10 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 gap-2 text-[10px] font-headline uppercase"
                >
                  {isWatchingAd ? <Zap className="w-3 h-3 animate-spin" /> : <><PlayCircle className="w-4 h-4" /> Ganar +5 Créditos</>}
                </Button>
              </button>

              <button 
                onClick={() => { setAiEngineMode('device'); handleUpdate('aiEngineMode', 'device'); }}
                className={cn(
                  "flex flex-col gap-3 p-5 rounded-[2rem] border transition-all duration-300 text-left relative",
                  aiEngineMode === 'device' 
                    ? "bg-secondary/10 border-secondary/40 shadow-[0_0_30px_rgba(155,168,245,0.1)]" 
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", aiEngineMode === 'device' ? "bg-secondary text-white" : "bg-white/10 text-white/40")}>
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm">Procesamiento On-Device</h4>
                      <p className="text-[10px] text-white/40">Privacidad total y latencia mínima</p>
                    </div>
                  </div>
                  <Badge className="bg-secondary text-secondary-foreground text-[8px] font-black uppercase">¡Gratis!</Badge>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-white/50">
                  <ShieldCheck className="w-3 h-3 text-secondary" />
                  Ejecuta IA en tu hardware. Sin internet, sin límites.
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4 border-t border-white/5 bg-white/[0.02]">
          <Button onClick={() => setIsProfileOpen(false)} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/80 font-headline font-bold text-white shadow-lg shadow-primary/20">
            Confirmar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
