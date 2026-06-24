'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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
  Server,
  History,
  Trash2,
  Play,
  Download,
  Smartphone
} from 'lucide-react';
import { ModelSelectionModal } from './ModelSelectionModal';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { SavedSession } from '@/lib/store';

const LANGUAGES = [
  "Español", "Inglés", "Francés", "Alemán", "Portugués", 
  "Italiano", "Chino", "Japonés", "Árabe", "Ruso"
];

function SessionItem({ session, onClick, onDelete }: { session: SavedSession, onClick: () => void, onDelete: (e: React.MouseEvent) => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] p-3 rounded-xl border border-white/5 transition-colors cursor-pointer"
    >
      <div className="flex flex-col flex-1 min-w-0 pr-2">
        <span className="text-xs font-bold text-white/90 truncate">{session.name}</span>
        <span className="text-[9px] text-white/40">{new Date(session.date).toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onDelete}
          className="w-8 h-8 rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProfileModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const { 
    nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage,
    learningProgress, addCredits, isProfileOpen, setIsProfileOpen,
    aiEngineMode, savedSessions, loadSession, deleteSession
  } = useStore();
  
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<string | null>(null);
  
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|iphone|ipod/.test(ua)) {
      setDeviceInfo('ios');
    } else if (/android/.test(ua)) {
      setDeviceInfo('android');
    } else {
      setDeviceInfo('desktop');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else if (deviceInfo === 'ios') {
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: "Instalar en iOS",
          description: "Toca el botón 'Compartir' en la barra de Safari y selecciona 'Agregar a Inicio'.",
        });
      });
    } else {
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: "App lista",
          description: "Busca la opción 'Instalar Aplicación' o 'Añadir a pantalla de inicio' en tu navegador.",
        });
      });
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    console.log(`[Firebase Bypass] Suppressed profile write for ${field}:`, value);
  };

  const simulateWatchAd = () => {
    setIsWatchingAd(true);
    setTimeout(() => {
      addCredits(5);
      setIsWatchingAd(false);
    }, 2000);
  };

  const handleLoadSession = (session: SavedSession) => {
    loadSession(session.id);
    setIsProfileOpen(false);
    setSelectedSession(null);
    if (session.type === 'chat') window.location.href = '/';
    if (session.type === 'conversacion') window.location.href = '/conversacion';
    if (session.type === 'lectura') window.location.href = '/reading';
    if (session.type === 'lente') window.location.href = '/lens';
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
                {!isStandalone && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleInstallClick} 
                    className="text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:border-primary/30 h-8"
                  >
                    {deviceInfo === 'desktop' ? <Download className="w-3.5 h-3.5 mr-1.5" /> : <Smartphone className="w-3.5 h-3.5 mr-1.5" />}
                    Instalar
                  </Button>
                )}
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

            {/* Historial de Sesiones (Memoria) */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/30 flex items-center gap-2">
                <History className="w-3 h-3" /> Memoria Histórica
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {savedSessions.some(s => s.type === 'chat') && (
                  <Button variant="outline" onClick={() => setSelectedHistoryCategory('chat')} className="h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80">
                    Amigo SoftIA
                  </Button>
                )}
                {savedSessions.some(s => s.type === 'conversacion') && (
                  <Button variant="outline" onClick={() => setSelectedHistoryCategory('conversacion')} className="h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80">
                    Conversación Dual
                  </Button>
                )}
                {savedSessions.some(s => s.type === 'lente') && (
                  <Button variant="outline" onClick={() => setSelectedHistoryCategory('lente')} className="h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80">
                    Lente AR
                  </Button>
                )}
                {savedSessions.some(s => s.type === 'lectura') && (
                  <Button variant="outline" onClick={() => setSelectedHistoryCategory('lectura')} className="h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80">
                    Lectura
                  </Button>
                )}
                {savedSessions.some(s => s.type === 'documentos') && (
                  <Button variant="outline" onClick={() => setSelectedHistoryCategory('documentos')} className="h-12 bg-white/5 border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80">
                    Documentos
                  </Button>
                )}
              </div>
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

      {/* Session Details Popup */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="glass-panel border-white/10 bg-zinc-950/95 backdrop-blur-3xl text-white rounded-[2.5rem] max-w-sm p-6 overflow-hidden z-[60]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-primary">{selectedSession?.name}</DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              {selectedSession && new Date(selectedSession.date).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[40vh] overflow-y-auto custom-scrollbar text-sm text-white/70 space-y-4">
            {selectedSession?.type === 'chat' && (
              <div className="space-y-2">
                {selectedSession.data.slice(-3).map((msg: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-2xl", msg.role === 'model' ? "bg-primary/20 text-white" : "bg-white/10 text-white/80")}>
                    <p className="text-xs">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedSession?.type === 'conversacion' && (
              <div className="space-y-2">
                {selectedSession.data.slice(-3).map((msg: any, i: number) => (
                  <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-white/40 mb-1">{msg.from} &rarr; {msg.to}</p>
                    <p className="text-xs font-bold text-white">{msg.original}</p>
                    <p className="text-xs text-emerald-400">{msg.translated}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedSession?.type === 'lectura' && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                  <span className="text-3xl font-bold text-secondary">{selectedSession.data.evalResult.score}%</span>
                  <p className="text-[10px] uppercase tracking-widest text-secondary/60">Precisión</p>
                </div>
                <p className="text-xs italic bg-white/5 p-3 rounded-xl">"{selectedSession.data.transcription}"</p>
              </div>
            )}
            {selectedSession?.type === 'lente' && (
              <div className="space-y-2 text-center py-4">
                <p className="text-xs text-white/40 uppercase tracking-widest">Traducción Capturada</p>
                <p className="text-lg font-bold text-purple-400">"{selectedSession.data.original}"</p>
                <p className="text-xl font-headline text-white">&rarr; {selectedSession.data.translated}</p>
              </div>
            )}
            {selectedSession?.type === 'documentos' && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-white/40 mb-1">Documento Original</p>
                  <p className="text-xs font-bold text-white whitespace-pre-wrap line-clamp-4">{selectedSession.data.original}</p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] text-primary/60 mb-1">Traducción</p>
                  <p className="text-xs font-bold text-white whitespace-pre-wrap line-clamp-4">{selectedSession.data.translated}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setSelectedSession(null)} variant="outline" className="flex-1 rounded-xl bg-white/5 border-white/10 hover:bg-white/10">
              Cerrar
            </Button>
            <Button onClick={() => selectedSession && handleLoadSession(selectedSession)} className="flex-1 rounded-xl bg-primary hover:bg-primary/90 shadow-neon-primary text-white font-bold">
              Ir a Módulo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category List Popup */}
      <Dialog open={!!selectedHistoryCategory} onOpenChange={(open) => !open && setSelectedHistoryCategory(null)}>
        <DialogContent className="glass-panel border-white/10 bg-zinc-950/95 backdrop-blur-3xl text-white rounded-[2.5rem] max-w-sm p-6 overflow-hidden z-[50]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl text-primary capitalize flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de {
                selectedHistoryCategory === 'chat' ? 'Amigo SoftIA' :
                selectedHistoryCategory === 'conversacion' ? 'Conversación Dual' :
                selectedHistoryCategory === 'lente' ? 'Lente AR' :
                selectedHistoryCategory === 'lectura' ? 'Lectura' : 
                selectedHistoryCategory === 'documentos' ? 'Documentos' : ''
              }
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {savedSessions.filter(s => s.type === selectedHistoryCategory).length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">No hay historial para esta categoría.</p>
            ) : (
              savedSessions.filter(s => s.type === selectedHistoryCategory).map(session => (
                <SessionItem 
                  key={session.id} 
                  session={session} 
                  onClick={() => setSelectedSession(session)} 
                  onDelete={(e) => { 
                    e.stopPropagation(); 
                    deleteSession(session.id); 
                    if (savedSessions.filter(s => s.type === selectedHistoryCategory).length <= 1) {
                      setSelectedHistoryCategory(null);
                    }
                  }} 
                />
              ))
            )}
          </div>
          <div className="pt-4 border-t border-white/5">
            <Button onClick={() => setSelectedHistoryCategory(null)} className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10">
              Volver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
