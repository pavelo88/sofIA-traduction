"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { BookOpen, Mic, RefreshCw, Star, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export default function ReadingTutor() {
  const [text, setText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<{ evaluation?: string; suggestion?: string } | null>(null);

  const handleEvaluate = async () => {
    if (!text.trim()) return;
    setIsEvaluating(true);
    setFeedback(null);

    try {
      const response = await aiTutorConversation({
        message: `Por favor, evalúa mi lectura o escritura del siguiente texto: "${text}"`,
        chatHistory: []
      });

      setFeedback({
        evaluation: response.evaluation,
        suggestion: response.suggestion
      });
      
      toast({
        title: "Evaluación Completa",
        description: "Kitten ha terminado de analizar tu texto.",
      });
    } catch (error) {
      toast({
        title: "Error de IA",
        description: "No se pudo conectar con Kitten. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:pl-32 pb-32 max-w-6xl mx-auto flex flex-col">
      <SidebarNav />

      <header className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
            <BookOpen className="text-secondary w-6 h-6" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight">Reading <span className="text-secondary">Tutor</span></h1>
        </div>
        <p className="text-muted-foreground">Pega un texto o escribe lo que has practicado para recibir feedback instantáneo de SoftIA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Panel de Entrada */}
        <section className="space-y-6 flex flex-col">
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 flex-1 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-headline uppercase tracking-widest text-white/60">Tu Práctica</label>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-white">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-white" onClick={() => setText('')}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Textarea 
              placeholder="Escribe aquí el texto que quieres que Kitten evalúe..."
              className="flex-1 bg-transparent border-none focus-visible:ring-0 text-xl font-medium resize-none placeholder:text-white/10"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <Button 
              onClick={handleEvaluate} 
              disabled={isEvaluating || !text.trim()}
              className="h-16 rounded-2xl bg-primary hover:bg-primary/80 squish-effect font-headline text-lg"
            >
              {isEvaluating ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Analizando...
                </div>
              ) : (
                "Enviar a Kitten"
              )}
            </Button>
          </div>
        </section>

        {/* Panel de Feedback */}
        <section className="space-y-6 flex flex-col">
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-white/[0.02] flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Star className="text-primary w-5 h-5 fill-primary" />
              </div>
              <h3 className="font-headline text-xl">Feedback de IA</h3>
            </div>

            {feedback ? (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-headline uppercase tracking-widest font-bold">Evaluación Detallada</span>
                    </div>
                    <p className="text-white/80 leading-relaxed text-lg bg-primary/5 p-6 rounded-2xl border border-primary/10">
                      {feedback.evaluation}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-secondary">
                      <Info className="w-5 h-5" />
                      <span className="text-xs font-headline uppercase tracking-widest font-bold">Sugerencia Proactiva</span>
                    </div>
                    <p className="text-muted-foreground italic leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5">
                      {feedback.suggestion}
                    </p>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <BookOpen className="w-16 h-16 mb-4" />
                <p className="max-w-[200px]">Envía un texto para comenzar tu evaluación guiada.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
