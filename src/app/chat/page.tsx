"use client";

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { Send, Star, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'model';
  content: string;
  evaluation?: string;
  suggestion?: string;
};

export default function KittenChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy Kitten, tu tutor de idiomas. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { nativeLanguage, targetLanguage } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voz no disponible", description: "Tu navegador no soporta reconocimiento de voz." });
      return;
    }
    if (isVoiceActive && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsVoiceActive(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = nativeLanguage === 'Español' ? 'es-ES' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsVoiceActive(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) handleSend(transcript);
    };
    recognition.onend = () => setIsVoiceActive(false);
    recognition.onerror = () => setIsVoiceActive(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (textOverride?: string) => {
    const finalText = textOverride || input;
    if (!finalText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: finalText };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiTutorConversation({
        message: finalText,
        chatHistory: history,
        nativeLanguage,
        targetLanguage
      });

      const assistantMsg: Message = {
        role: 'model',
        content: response.response,
        evaluation: response.evaluation,
        suggestion: response.suggestion
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 pb-[100px] lg:pb-16 flex flex-col max-w-5xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="font-headline text-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="text-primary w-5 h-5 fill-primary" />
          </div>
          SoftIA Kitten Tutor
        </h1>
      </header>

      <div className="flex-1 glass-panel rounded-3xl border-white/5 flex flex-col overflow-hidden mb-6">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                <Avatar className={cn("shrink-0 flex items-center justify-center", msg.role === 'user' ? 'bg-secondary/20' : 'bg-primary/20')}>
                  {msg.role === 'user' ? <span className="text-lg">👤</span> : <Star className="text-primary fill-primary w-4 h-4" />}
                </Avatar>
                
                <div className={`max-w-[80%] space-y-2 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-secondary-foreground rounded-tr-none' 
                      : 'bg-white/5 text-white border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.evaluation && (
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl text-xs space-y-1">
                      <p className="font-headline text-primary uppercase tracking-tighter text-[10px]">Evaluación</p>
                      <p className="text-white/80">{msg.evaluation}</p>
                    </div>
                  )}

                  {msg.suggestion && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1 italic text-muted-foreground">
                      <p className="font-headline text-white/60 text-[10px]">Sugerencia de Kitten</p>
                      <p>{msg.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <Avatar className="bg-primary/20 shrink-0 flex items-center justify-center"><Star className="text-primary w-4 h-4" /></Avatar>
                <div className="bg-white/5 h-12 w-32 rounded-2xl" />
              </div>
            )}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
          <Input 
            placeholder={isVoiceActive ? "Kitten te escucha..." : "Escribe o habla con Kitten..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="bg-background/50 border-white/10 h-14 rounded-2xl focus-visible:ring-primary text-white"
          />
          <Button
            onClick={toggleVoice}
            disabled={isLoading}
            className={cn(
              "h-14 w-14 rounded-2xl squish-effect shrink-0 transition-all duration-300",
              isVoiceActive ? "bg-rose-500 hover:bg-rose-600" : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="h-14 w-14 rounded-2xl squish-effect bg-primary hover:bg-primary/80 shrink-0">
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </main>
  );
}
