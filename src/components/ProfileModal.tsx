
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
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
import { User, Settings2, Globe, GraduationCap, Mic2 } from 'lucide-react';

const LANGUAGES = [
  "Español", "Inglés", "Francés", "Alemán", "Portugués", 
  "Italiano", "Chino", "Japonés", "Árabe", "Ruso"
];

export function ProfileModal({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const { 
    nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage,
    userVoiceGender, partnerVoiceGender, setUserVoiceGender, setPartnerVoiceGender
  } = useStore();
  
  const userDocRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    if (userData) {
      if (userData.nativeLanguage) setNativeLanguage(userData.nativeLanguage);
      if (userData.targetLanguage) setTargetLanguage(userData.targetLanguage);
      if (userData.userVoiceGender) setUserVoiceGender(userData.userVoiceGender);
      if (userData.partnerVoiceGender) setPartnerVoiceGender(userData.partnerVoiceGender);
    }
  }, [userData, setNativeLanguage, setTargetLanguage, setUserVoiceGender, setPartnerVoiceGender]);

  const handleUpdate = async (field: string, value: string) => {
    if (userDocRef) {
      setDoc(userDocRef, {
        [field]: value,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 bg-background/95 backdrop-blur-3xl text-white rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Settings2 className="text-primary" /> Perfil Espacial
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configura tus preferencias de idioma y voz para la experiencia SoftIA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-headline font-bold">{user?.email || 'Explorador Espacial'}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Nivel de Usuario: Beta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Mi Idioma Nativo
              </Label>
              <Select value={nativeLanguage} onValueChange={(v) => { setNativeLanguage(v); handleUpdate('nativeLanguage', v); }}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <GraduationCap className="w-3 h-3" /> Idioma Objetivo
              </Label>
              <Select value={targetLanguage} onValueChange={(v) => { setTargetLanguage(v); handleUpdate('targetLanguage', v); }}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  {LANGUAGES.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <Mic2 className="w-3 h-3" /> Mi Voz (Género)
              </Label>
              <Select value={userVoiceGender} onValueChange={(v: any) => { setUserVoiceGender(v); handleUpdate('userVoiceGender', v); }}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <Mic2 className="w-3 h-3" /> Voz Invitado
              </Label>
              <Select value={partnerVoiceGender} onValueChange={(v: any) => { setPartnerVoiceGender(v); handleUpdate('partnerVoiceGender', v); }}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 font-headline font-bold">
            Cerrar Ajustes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
