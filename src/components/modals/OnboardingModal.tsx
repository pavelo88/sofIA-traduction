'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  "Español", "Inglés", "Francés", "Alemán", 
  "Portugués", "Italiano", "Chino", "Japonés", 
  "Árabe", "Ruso"
];

export function OnboardingModal() {
  const { hasCompletedOnboarding, setHasCompletedOnboarding, setDefaultNativeName, setNativeLanguage, nativeLanguage, nativeName } = useStore();
  const [open, setOpen] = useState(false);

  const [tempName, setTempName] = useState(nativeName === 'Usuario' ? '' : nativeName);
  const [tempLang, setTempLang] = useState(nativeLanguage);

  useEffect(() => {
    // Only show if not completed and we are mounted
    if (!hasCompletedOnboarding) {
      // Small delay to ensure hydration before opening modal
      const t = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(t);
    }
  }, [hasCompletedOnboarding]);

  const handleSave = () => {
    if (tempName.trim()) {
      setDefaultNativeName(tempName.trim());
    }
    setNativeLanguage(tempLang);
    setHasCompletedOnboarding(true);
    setOpen(false);
  };

  const handleSkip = () => {
    // Leaves defaults (Usuario, Español)
    setHasCompletedOnboarding(true);
    setOpen(false);
  };

  if (hasCompletedOnboarding) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Don't allow closing by clicking outside, must choose an option
      if (!val) return; 
      setOpen(val);
    }}>
      <DialogContent className="sm:max-w-md bg-black/95 border-primary/20 shadow-2xl shadow-primary/10 rounded-[2rem]">
        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-headline text-center text-white flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            ¡Bienvenido a SoftIA!
          </DialogTitle>
          <DialogDescription className="text-center text-white/60 mt-4 text-sm px-4">
            Para ofrecerte la mejor experiencia de traducción y tutoría, dinos cómo te gustaría que te llamemos y cuál es tu idioma principal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6 px-4">
          <div className="space-y-3">
            <label className="text-xs font-headline uppercase tracking-widest text-primary font-bold ml-2">Tu Nombre</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Ej. Juanita"
                className="pl-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus-visible:ring-primary/50 text-lg"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-headline uppercase tracking-widest text-secondary font-bold ml-2">Idioma Principal</label>
            <div className="relative">
              <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={tempLang}
                onChange={(e) => setTempLang(e.target.value)}
                className="w-full pl-12 h-14 bg-white/5 border border-white/10 text-white rounded-2xl focus:ring-secondary/50 focus:border-secondary/50 outline-none text-lg appearance-none cursor-pointer"
              >
                {languages.map(l => (
                  <option key={l} value={l} className="bg-zinc-900 text-white">{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3 pb-4 px-4">
          <Button 
            onClick={handleSave}
            className="w-full h-14 rounded-xl font-headline uppercase tracking-widest font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
          >
            Comenzar Experiencia
          </Button>
          <Button 
            onClick={handleSkip}
            variant="ghost" 
            className="w-full h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/5 uppercase tracking-widest text-xs font-bold"
          >
            Omitir por ahora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
