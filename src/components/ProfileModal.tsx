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
import { User, Settings2, Globe, GraduationCap } from 'lucide-react';

export function ProfileModal({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();
  const { nativeLanguage, targetLanguage, setNativeLanguage, setTargetLanguage } = useStore();
  
  // Referencia al documento de usuario (usamos demo-user si no hay auth real para el MVP)
  const userDocRef = user ? doc(db, 'users', user.uid) : doc(db, 'users', 'demo-user');
  const { data: userData } = useDoc(userDocRef);

  // Sincronizar preferencias desde Firestore al cargar
  useEffect(() => {
    if (userData) {
      if (userData.nativeLanguage) setNativeLanguage(userData.nativeLanguage);
      if (userData.targetLanguage) setTargetLanguage(userData.targetLanguage);
    }
  }, [userData, setNativeLanguage, setTargetLanguage]);

  const handleLanguageChange = async (type: 'native' | 'target', value: string) => {
    if (type === 'native') setNativeLanguage(value);
    else setTargetLanguage(value);

    // Guardado automático en Firestore
    setDoc(userDocRef, {
      [type === 'native' ? 'nativeLanguage' : 'targetLanguage']: value,
      updated_at: new Date().toISOString()
    }, { merge: true });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 bg-background/95 backdrop-blur-3xl text-white rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-3">
            <Settings2 className="text-primary" /> Perfil Espacial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-headline font-bold">{user?.email || 'Explorador Espacial'}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Nivel de Usuario: Beta</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Mi Idioma Nativo
              </Label>
              <Select value={nativeLanguage} onValueChange={(v) => handleLanguageChange('native', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue placeholder="Selecciona tu idioma" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  <SelectItem value="Español">Español</SelectItem>
                  <SelectItem value="Inglés">Inglés</SelectItem>
                  <SelectItem value="Portugués">Portugués</SelectItem>
                  <SelectItem value="Francés">Francés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                <GraduationCap className="w-3 h-3" /> Idioma a Aprender
              </Label>
              <Select value={targetLanguage} onValueChange={(v) => handleLanguageChange('target', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                  <SelectValue placeholder="Selecciona el idioma objetivo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-white/10 text-white">
                  <SelectItem value="Inglés">Inglés</SelectItem>
                  <SelectItem value="Español">Español</SelectItem>
                  <SelectItem value="Francés">Francés</SelectItem>
                  <SelectItem value="Alemán">Alemán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 font-headline font-bold">
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
