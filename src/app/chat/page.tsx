"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { aiTutorConversation, type AITutorConversationOutput } from '@/ai/flows/ai-tutor-conversation';
import { Send, Sparkles, User, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiTutorConversation({
        message: input,
        chatHistory: history
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
    <main className="min-h-screen p-6 md:pl-32 pb-32 flex flex-col max-w-5xl mx-auto">
      <SidebarNav />

      <header className="mb-8">
        <h1 className="font-headline text-3xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="text-primary w-5 h-5 fill-primary" />
          </div>
          SoftIA Kitten Tutor
        </h1>
      </header>

      <div className="flex-1 glass-panel rounded-3xl border-white/5 flex flex-col overflow-hidden mb-6">
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                <Avatar className={msg.role === 'user' ? 'bg-secondary/20' : 'bg-primary/20'}>
                  {msg.role === 'user' ? <User className="text-secondary" /> : <Star className="text-primary fill-primary" />}
                </Avatar>
                
                <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-secondary text-secondary-foreground rounded-tr-none' 
                      : 'bg-white/5 text-white border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.evaluation && (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl text-xs space-y-2">
                      <p className="font-headline text-primary uppercase tracking-tighter">Evaluación</p>
                      <p className="text-white/80">{msg.evaluation}</p>
                    </div>
                  )}

                  {msg.suggestion && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-2 italic text-muted-foreground">
                      <p className="font-headline text-white/60">Sugerencia de Kitten</p>
                      <p>{msg.suggestion}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-pulse">
                <Avatar className="bg-primary/20" />
                <div className="bg-white/5 h-12 w-32 rounded-2xl" />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
          <Input 
            placeholder="Pregúntale algo a Kitten o escribe una frase para evaluar..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="bg-background/50 border-white/10 h-14 rounded-2xl focus-visible:ring-primary"
          />
          <Button onClick={handleSend} className="h-14 w-14 rounded-2xl squish-effect bg-primary hover:bg-primary/80">
            <Send className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </main>
  );
}
