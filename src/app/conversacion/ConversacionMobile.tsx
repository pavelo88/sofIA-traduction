
'use client';

import { useConversacion } from './use-conversacion';
import { Mic, MicOff, Camera, CameraOff, User, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ConversacionMobile() {
  const logic = useConversacion();

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 pb-32 overflow-hidden">
      <header className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className="font-headline font-bold text-lg">SoftIA Talk</span>
      </header>

      <div className="flex-1 space-y-4 overflow-hidden flex flex-col">
        <div className={cn(
          "p-6 rounded-[2.5rem] transition-all duration-700 border-2",
          logic.isNativeTurn ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5 opacity-40"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase font-headline tracking-widest text-primary">Tú</span>
          </div>
          <p className="text-xl font-headline font-bold text-white">{logic.nativeLanguage}</p>
        </div>

        <div className={cn(
          "p-6 rounded-[2.5rem] transition-all duration-700 border-2",
          !logic.isNativeTurn ? "bg-secondary/10 border-secondary" : "bg-white/5 border-white/5 opacity-40"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-4 h-4 text-secondary" />
            <span className="text-[10px] uppercase font-headline tracking-widest text-secondary">Invitado</span>
          </div>
          <p className="text-xl font-headline font-bold text-white">{logic.targetLanguage}</p>
        </div>

        <ScrollArea className="flex-1 mt-6 border-t border-white/5 pt-4">
          <div className="space-y-4">
            {logic.history.slice(0, 3).map((item, i) => (
              <div key={i} className="text-xs text-white/40 italic leading-relaxed animate-in fade-in">
                "{item.translated}"
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 w-full px-6">
        <div className="flex items-center gap-6">
          <Button
            onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
            variant="ghost"
            className={cn(
              "h-14 w-14 rounded-full border border-white/10",
              logic.isCameraActive ? "bg-primary/20 text-primary" : "text-white/40"
            )}
          >
            {logic.isCameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </Button>

          <Button
            onClick={logic.toggleSession}
            className={cn(
              "h-20 w-20 rounded-full transition-all shadow-xl",
              logic.isNativeTurn ? "bg-primary" : "bg-secondary"
            )}
          >
            {logic.isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
