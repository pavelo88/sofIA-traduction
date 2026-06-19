'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, History, Sparkles, User, Users, Star, Database,
  ArrowLeft, LayoutGrid, Settings, Wifi, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export function ConversacionDesktop() {
  const logic = useConversacion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && logic.streamRef.current && logic.isCameraActive) {
      videoRef.current.srcObject = logic.streamRef.current;
    }
  }, [logic.isCameraActive, logic.streamRef.current]);

  return (
    <div className="h-screen w-full bg-[#09090b] text-white p-6 grid grid-cols-12 gap-6 overflow-hidden">
      
      {/* COLUMNA 1: SIDEBAR (2/12) */}
      <aside className="col-span-2 flex flex-col gap-6">
        <div className="glass-panel backdrop-blur-3xl bg-white/[0.01] border-white/[0.06] rounded-[2rem] p-6 flex flex-col h-full shadow-2xl">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-headline font-bold text-xl tracking-tight">SoftIA</h1>
            </div>
            <p className="text-[9px] font-headline text-white/30 uppercase tracking-[0.3em]">Nexus Terminal v2.0</p>
          </header>

          <nav className="flex-1 space-y-2">
            {[
              { icon: LayoutGrid, label: 'Inicio', href: '/' },
              { icon: Camera, label: 'Lente AR', href: '/lens' },
              { icon: Star, label: 'Lectura', href: '/reading' },
              { icon: History, label: 'Actividad', href: '#' }
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all group">
                  <item.icon className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-headline uppercase tracking-widest text-white/60 group-hover:text-white">{item.label}</span>
                </button>
              </Link>
            ))}
          </nav>

          <footer className="mt-auto pt-6 border-t border-white/[0.05] space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[8px] font-headline text-white/20 uppercase tracking-widest">
                <span>Núcleo IA</span>
                <span className="text-green-500">Operativo</span>
              </div>
              <div className="flex items-center justify-between text-[8px] font-headline text-white/20 uppercase tracking-widest">
                <span>Red</span>
                <span className="text-primary">Híbrida</span>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[10px] h-10 uppercase tracking-widest">
                <ArrowLeft className="w-3 h-3 mr-2" /> Salir
              </Button>
            </Link>
          </footer>
        </div>
      </aside>

      {/* COLUMNA 2: LIENZO PRINCIPAL (7/12) */}
      <main className="col-span-7 flex flex-col gap-6">
        <div className="flex-1 relative flex flex-col gap-6">
          
          <div className="flex-1 grid grid-rows-2 gap-6">
            {/* PANEL USUARIO */}
            <div className={cn(
              "glass-panel rounded-[3rem] p-10 flex flex-col justify-center relative transition-all duration-1000 border-2 overflow-hidden",
              logic.isNativeTurn 
                ? "border-primary/40 bg-primary/[0.03] shadow-[0_0_80px_-20px_rgba(161,98,247,0.15)]" 
                : "border-white/[0.03] bg-white/[0.01] opacity-40 grayscale-[0.5]"
            )}>
              <div className="absolute top-8 left-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[10px] font-headline uppercase tracking-widest text-primary font-bold">Local</h3>
                  <p className="text-xs text-white/40">{logic.nativeLanguage}</p>
                </div>
              </div>
              <p className={cn("text-4xl font-headline font-bold leading-tight", logic.isNativeTurn ? "text-white" : "text-white/20")}>
                {logic.history[0]?.from === logic.nativeLanguage ? logic.history[0]?.original : "Esperando voz..."}
              </p>
            </div>

            {/* PANEL INVITADO */}
            <div className={cn(
              "glass-panel rounded-[3rem] p-10 flex flex-col justify-center items-end text-right relative transition-all duration-1000 border-2 overflow-hidden",
              !logic.isNativeTurn 
                ? "border-secondary/40 bg-secondary/[0.03] shadow-[0_0_80px_-20px_rgba(155,168,245,0.15)]" 
                : "border-white/[0.03] bg-white/[0.01] opacity-40 grayscale-[0.5]"
            )}>
               <div className="absolute top-8 right-10 flex flex-row-reverse items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[10px] font-headline uppercase tracking-widest text-secondary font-bold">Invitado</h3>
                  <p className="text-xs text-white/40">{logic.targetLanguage}</p>
                </div>
              </div>
              <p className={cn("text-4xl font-headline font-bold leading-tight", !logic.isNativeTurn ? "text-white" : "text-white/20")}>
                 {logic.history[0]?.from === logic.targetLanguage ? logic.history[0]?.original : "Escuchando..."}
              </p>
            </div>
          </div>

          {/* PANEL DE CONTROL CENTRAL REFACTORIZADO */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
            
            {/* MICRO-INDICADOR DE TELEMETRÍA */}
            <div className="text-[10px] font-headline tracking-[0.3em] uppercase text-white/40 bg-white/[0.03] px-5 py-2 rounded-full border border-white/5 backdrop-blur-md">
              {logic.nativeLanguage.substring(0,2)} ➔ {logic.targetLanguage.substring(0,2)} | {logic.isNativeTurn ? logic.userVoiceGender : logic.partnerVoiceGender}
            </div>

            <div className="flex items-center gap-6">
              <Button
                aria-label="Cámara"
                variant="ghost"
                onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
                className={cn("h-12 w-12 rounded-xl bg-zinc-900 border border-white/5 transition-colors", logic.isCameraActive ? "text-primary border-primary/20" : "text-zinc-600")}
              >
                {logic.isCameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              </Button>

              <Button
                aria-label={logic.isRecording ? "Detener" : "Hablar"}
                onClick={logic.toggleSession}
                disabled={logic.isProcessing}
                className={cn(
                  "h-24 w-24 rounded-full transition-all duration-300 squish-effect flex items-center justify-center",
                  logic.isRecording 
                    ? "bg-rose-500 scale-95 shadow-[0_0_40px_rgba(244,63,94,0.4)] animate-pulse" 
                    : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                )}
              >
                {logic.isProcessing ? (
                  <Sparkles className="w-8 h-8 animate-spin" />
                ) : (
                  logic.isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />
                )}
              </Button>

              <Button
                aria-label="Enviar Manual"
                variant="ghost"
                className="bg-zinc-900 border border-white/5 text-zinc-500 h-12 w-12 rounded-xl hover:text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* COLUMNA 3: ANÁLISIS & AJUSTES (3/12) */}
      <aside className="col-span-3 flex flex-col gap-6">
        <div className="glass-panel aspect-video rounded-[2rem] overflow-hidden border-white/[0.06] bg-black relative shadow-2xl">
          {logic.isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/5">
              <span className="text-[8px] font-headline uppercase tracking-widest">Feed Desactivado</span>
            </div>
          )}
        </div>

        <div className="flex-1 glass-panel rounded-[2rem] border-white/[0.06] p-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-headline uppercase tracking-widest text-white/40">Cuota Gemini</h4>
              <Database className="w-3 h-3 text-primary" />
            </div>
            <Progress value={84} className="h-1 bg-white/[0.05]" />
          </div>

          <div className="flex-1">
            <h4 className="text-[10px] font-headline uppercase tracking-widest text-white/40 mb-4">Géneros de Voz</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
                <span className="text-[9px] text-white/30 uppercase tracking-widest">Tú ({logic.userVoiceGender})</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className={cn("h-7 w-7", logic.userVoiceGender === 'masculino' ? "bg-primary" : "opacity-20")}><User className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className={cn("h-7 w-7", logic.userVoiceGender === 'femenino' ? "bg-primary" : "opacity-20")}><Users className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
                <span className="text-[9px] text-white/30 uppercase tracking-widest">Invitado ({logic.partnerVoiceGender})</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className={cn("h-7 w-7", logic.partnerVoiceGender === 'masculino' ? "bg-secondary" : "opacity-20")}><User className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className={cn("h-7 w-7", logic.partnerVoiceGender === 'femenino' ? "bg-secondary" : "opacity-20")}><Users className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <Wifi className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-headline font-bold uppercase tracking-widest">Enlace Estable (14ms)</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
