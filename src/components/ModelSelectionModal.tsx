'use client';

import { useStore } from '@/lib/store';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cloud, Cpu, Sparkles, Zap, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function ModelSelectionModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { user } = useUser();
  const db = useFirestore();
  const { aiEngineMode, setAiEngineMode, userCredits } = useStore();

  const handleUpdate = async (value: 'gemini' | 'deepseek' | 'device') => {
    setAiEngineMode(value);
    if (user && !user.uid.startsWith('guest-session')) {
      const userDocRef = doc(db, 'users', user.uid);
      const data = {
        aiEngineMode: value,
        updated_at: new Date().toISOString()
      };
      try {
        await setDoc(userDocRef, data, { merge: true });
      } catch (error) {
        console.warn("Firestore error updating AI engine mode:", error);
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: data
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
  };

  const models = [
    {
      id: 'device',
      name: 'On-Device AI (Local)',
      description: 'Gemini Nano / Modelos locales. Total privacidad y velocidad extrema. Gratis.',
      icon: Cpu,
      color: 'emerald',
      badge: '100% Privado',
      credits: 'Gratis'
    },
    {
      id: 'gemini',
      name: 'Gemini Cloud Engine',
      description: 'Máxima precisión y razonamiento contextual para conversaciones complejas.',
      icon: Cloud,
      color: 'primary',
      badge: 'Recomendado',
      credits: '1 crédito / msg'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek Pro',
      description: 'Motor ultrarrápido ideal para respuestas directas y ágiles.',
      icon: Sparkles,
      color: 'secondary',
      badge: 'Económico',
      credits: '0.5 créditos / msg'
    }
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border-white/10 bg-zinc-950/90 backdrop-blur-3xl text-white rounded-[2.5rem] max-w-lg p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-8 pb-4 relative z-10">
          <DialogTitle className="font-headline text-3xl font-bold flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            Motor de IA
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm mt-2">
            Selecciona la red neuronal que impulsará tus traducciones.
          </DialogDescription>
          
          <div className="absolute top-8 right-8 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold font-mono">{userCredits}</span>
          </div>
        </DialogHeader>

        <div className="p-8 pt-0 space-y-4">
          <AnimatePresence>
            {models.map((model, index) => {
              const isActive = aiEngineMode === model.id;
              const Icon = model.icon;
              
              let colorClasses = '';
              let glowClass = '';
              if (model.color === 'primary') { colorClasses = 'text-primary bg-primary/10 border-primary/40'; glowClass = 'shadow-neon-primary'; }
              if (model.color === 'secondary') { colorClasses = 'text-secondary bg-secondary/10 border-secondary/40'; glowClass = 'shadow-neon-secondary'; }
              if (model.color === 'emerald') { colorClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'; glowClass = 'shadow-neon-emerald'; }
              
              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => handleUpdate(model.id)}
                    className={cn(
                      "w-full flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300 text-left relative overflow-hidden group",
                      isActive 
                        ? cn(colorClasses, glowClass) 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeModelIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent z-0 pointer-events-none"
                      />
                    )}
                    
                    <div className="relative z-10 pt-1">
                      <Icon className={cn("w-6 h-6", isActive ? "" : "text-white/30 group-hover:text-white/60")} />
                    </div>
                    
                    <div className="flex-1 relative z-10">
                      <div className="flex justify-between items-start">
                        <h4 className={cn("font-headline font-bold text-lg", isActive ? "" : "text-white/80")}>
                          {model.name}
                        </h4>
                        {model.badge && (
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase tracking-wider",
                            isActive ? "border-current opacity-80" : "border-white/10 text-white/40"
                          )}>
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                      <p className={cn("text-xs mt-1 leading-relaxed", isActive ? "opacity-90" : "text-white/40")}>
                        {model.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        <Zap className={cn("w-3 h-3", isActive ? "opacity-70" : "text-white/20")} />
                        <span className={cn("text-[10px] font-mono", isActive ? "opacity-90" : "text-white/30")}>
                          {model.credits}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="p-8 pt-4 border-t border-white/5 bg-black/20">
          <Button onClick={onClose} className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
