'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Users } from 'lucide-react';

const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Chino', 'Japonés', 'Árabe', 'Ruso'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatSetupModal({ isOpen, onClose }: Props) {
  const logic = useStore();
  const [nativeName, setNativeName] = useState(logic.nativeName);
  const [nativeLang, setNativeLang] = useState(logic.nativeLanguage);
  const [targetName, setTargetName] = useState(logic.targetName);
  const [targetLang, setTargetLang] = useState(logic.targetLanguage);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNativeName(logic.nativeName);
      setNativeLang(logic.nativeLanguage);
      setTargetName(logic.targetName);
      setTargetLang(logic.targetLanguage);
    }
  }, [isOpen, logic.nativeName, logic.nativeLanguage, logic.targetName, logic.targetLanguage]);

  const handleStart = () => {
    logic.setNativeName(nativeName || 'Usuario');
    logic.setNativeLanguage(nativeLang);
    logic.setTargetName(targetName || 'Invitado');
    logic.setTargetLanguage(targetLang);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleStart(); }}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="font-headline tracking-widest uppercase text-center text-primary text-xl">
            Nueva Conversación
          </DialogTitle>
          <DialogDescription className="text-center text-white/50">
            Configura los participantes antes de empezar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Usuario Principal */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-2">
              <User className="w-4 h-4" /> Tú (Usuario)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-white/40">Nombre</Label>
                <Input 
                  value={nativeName} 
                  onChange={e => setNativeName(e.target.value)} 
                  className="bg-black/50 border-white/10 text-xs focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-white/40">Idioma</Label>
                <select 
                  value={nativeLang} 
                  onChange={e => setNativeLang(e.target.value)}
                  className="w-full h-9 rounded-md bg-black/50 border border-white/10 text-xs px-3 outline-none focus:border-primary"
                >
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Invitado */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h3 className="text-xs uppercase tracking-widest text-secondary font-bold flex items-center gap-2">
              <Users className="w-4 h-4" /> Invitado
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] text-white/40">Nombre</Label>
                <Input 
                  value={targetName} 
                  onChange={e => setTargetName(e.target.value)} 
                  className="bg-black/50 border-white/10 text-xs focus-visible:ring-secondary"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-white/40">Idioma</Label>
                <select 
                  value={targetLang} 
                  onChange={e => setTargetLang(e.target.value)}
                  className="w-full h-9 rounded-md bg-black/50 border border-white/10 text-xs px-3 outline-none focus:border-secondary"
                >
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleStart}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest text-xs"
        >
          Iniciar Chat
        </Button>
      </DialogContent>
    </Dialog>
  );
}
