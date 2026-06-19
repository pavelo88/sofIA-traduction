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
  isHidden?: boolean;
};

export default function KittenChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy Kitten, tu tutor de idiomas. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const { nativeLanguage, targetLanguage, conversationHistory } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const globalAccumulatedTranscriptRef = useRef<string>('');
  const currentTranscriptRef = useRef<string>('');
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVoiceActiveRef = useRef(isVoiceActive);

  useEffect(() => {
    isVoiceActiveRef.current = isVoiceActive;
  }, [isVoiceActive]);

  const stopRecordingTimer = () => {
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
      recordingTimerIntervalRef.current = null;
    }
  };

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
    
    if (isVoiceActiveRef.current) {
      isVoiceActiveRef.current = false;
      stopRecordingTimer();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      setIsVoiceActive(false);
      
      const textToSend = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
      globalAccumulatedTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      setInput('');
      if (textToSend) handleSend(textToSend);
      return;
    }

    startListeningKitten();
  };

  const startListeningKitten = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const langMapping: Record<string, string> = {
      "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
      "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
      "Árabe": "ar-SA", "Ruso": "ru-RU"
    };

    const recognition = new SpeechRecognition();
    recognition.lang = langMapping[targetLanguage] || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsVoiceActive(true);
      currentTranscriptRef.current = '';
      if (!recordingTimerIntervalRef.current) {
        setRecordingTime(0);
        recordingTimerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= 119) {
              setTimeout(() => toggleVoice(), 0);
              return 120;
            }
            return prev + 1;
          });
        }, 1000);
      }
    };
    
    recognition.onresult = (e: any) => {
      let accumulated = '';
      for (let i = 0; i < e.results.length; i++) {
        accumulated += e.results[i][0].transcript + ' ';
      }
      currentTranscriptRef.current = accumulated.trim();
      setInput((globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim());
    };
    
    recognition.onend = () => {
      if (isVoiceActiveRef.current) {
        globalAccumulatedTranscriptRef.current = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
        currentTranscriptRef.current = '';
        setTimeout(() => startListeningKitten(), 50);
        return;
      }
      setIsVoiceActive(false);
      stopRecordingTimer();
    };
    
    recognition.onerror = () => {
      // Ignorar errores silenciosos, onend reiniciará
    };
    
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {
      setTimeout(() => { try { recognition.start(); } catch (e) {} }, 300);
    }
  };

  const handleSend = async (textOverride?: string, isHidden: boolean = false) => {
    const finalText = textOverride || input;
    if (!finalText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: finalText, isHidden };
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

      // TTS para la respuesta del tutor (Mixed Language)
      import('@/lib/voice/mixed-speaker').then(({ speakMixedText }) => {
        speakMixedText(
          response.response,
          nativeLanguage,
          targetLanguage,
          'femenino', // Native voice gender (Kitten is female/sweet)
          'femenino'  // Target voice gender (Kitten is female/sweet)
        );
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummary = () => {
    const historyText = conversationHistory.map(m => `[${m.from}] ${m.original} -> [${m.to}] ${m.translated}`).join('\n');
    const prompt = historyText.length > 0 
      ? `Por favor analiza las siguientes conversaciones reales que tuve hoy como traductor y genera un resumen pedagógico destacando palabras clave, vocabulario útil y posibles áreas de mejora. Usa un tono animado y amigable, como un lindo gatito tutor.\n\nConversaciones:\n${historyText}`
      : `Por favor genera un resumen pedagógico de nuestra charla de hoy en este chat, destacando las palabras clave aprendidas y los errores comunes que debo mejorar. Usa un tono animado y amigable.`;
      
    handleSend(prompt, true);
  };

  return (
    <main className="min-h-screen p-6 pb-[100px] lg:pb-16 flex flex-col max-w-5xl mx-auto w-full">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="font-headline text-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="text-primary w-5 h-5 fill-primary" />
          </div>
          SoftIA Kitten Tutor
        </h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            className="rounded-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10 px-6 font-bold tracking-wider uppercase text-xs"
          >
            Limpiar Chat
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSummary}
            disabled={isLoading || (messages.length < 3 && conversationHistory.length === 0)}
            className="rounded-full border-primary/30 text-primary hover:bg-primary/10 px-6 font-bold tracking-wider uppercase text-xs"
          >
            <Star className="w-4 h-4 mr-2" />
            Resumen del Día
          </Button>
        </div>
      </header>

      <div className="flex-1 glass-panel rounded-3xl border-white/5 flex flex-col overflow-hidden mb-6">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.filter(m => !m.isHidden).map((msg, i) => (
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
                    {msg.content.replace(/<\/?lang>/g, '')}
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
          <div className="relative flex-1">
            {isVoiceActive && (
              <div className="absolute -top-10 right-0 flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-neon-rose">
                <span>Grabando:</span>
                <span className="font-mono">{Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            <Input 
              placeholder={isVoiceActive ? "Kitten te escucha..." : "Escribe o habla con Kitten..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-background/50 border-white/10 h-14 rounded-2xl focus-visible:ring-primary text-white w-full"
            />
          </div>
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
