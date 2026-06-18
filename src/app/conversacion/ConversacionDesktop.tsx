'use client';

import { useConversacion } from './use-conversacion';
import { 
  Mic, MicOff, Camera, CameraOff, History, Activity, 
  Sparkles, User, Users, Star, Cpu, Wifi, Database,
  ArrowLeft, LayoutGrid, Settings, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * @summary Rediseño Vanguardista Desktop para Conversación.
 * Estética Bento Asimétrica de 3 Columnas (2-7-3).
 */
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
      
      {/* COLUMNA 1: SIDEBAR BENTO (2/12) */}
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

      {/* COLUMNA 2: LIENZO DE TRADUCCIÓN (7/12) */}
      <main className="col-span-7 flex flex-col gap-6">
        <div className="flex-1 relative flex flex-col gap-6">
          {/* BOTONES DE CONTROL SUPERIOR */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-4">
            <Button
              aria-label={logic.isCameraActive ? "Apagar Cámara" : "Encender Cámara"}
              onClick={() => logic.setIsCameraActive(!logic.isCameraActive)}
              className={cn(
                "h-12 px-6 rounded-2xl border transition-all duration-500 squish-effect",
                logic.isCameraActive ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/[0.02] border-white/[0.05] text-white/40"
              )}
            >
              {logic.isCameraActive ? <Camera className="w-4 h-4 mr-2" /> : <CameraOff className="w-4 h-4 mr-2" />}
              <span className="text-[10px] uppercase font-headline tracking-widest">Hardware</span>
            </Button>
          </div>

          <div className="flex-1 grid grid-rows-2 gap-6">
            {/* PANEL USUARIO (YO) */}
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
                  <h3 className="text-[10px] font-headline uppercase tracking-widest text-primary font-bold">Módulo Local</h3>
                  <p className="text-xs text-white/40">{logic.nativeLanguage}</p>
                </div>
              </div>
              
              <div className="mt-8">
                {logic.isNativeTurn && logic.isRecording ? (
                  <div className="flex gap-1 mb-4 h-8 items-end">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%` }} />
                    ))}
                  </div>
                ) : null}
                <p className={cn(
                  "text-4xl font-headline font-bold leading-tight",
                  logic.isNativeTurn ? "text-white" : "text-white/20"
                )}>
                  {logic.history[0]?.from === logic.nativeLanguage ? logic.history[0]?.original : "Esperando voz..."}
                </p>
              </div>
            </div>

            {/* PANEL INVITADO (OTRO) */}
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
                  <h3 className="text-[10px] font-headline uppercase tracking-widest text-secondary font-bold">Módulo Remoto</h3>
                  <p className="text-xs text-white/40">{logic.targetLanguage}</p>
                </div>
              </div>

              <div className="mt-8">
                {!logic.isNativeTurn && logic.isRecording ? (
                  <div className="flex gap-1 mb-4 h-8 items-end justify-end">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="w-1 bg-secondary rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%` }} />
                    ))}
                  </div>
                ) : null}
                <p className={cn(
                  "text-4xl font-headline font-bold leading-tight",
                  !logic.isNativeTurn ? "text-white" : "text-white/20"
                )}>
                   {logic.history[0]?.from === logic.targetLanguage ? logic.history[0]?.original : "Escuchando respuesta..."}
                </p>
              </div>
            </div>
          </div>

          {/* BOTÓN CENTRAL DE ACCIÓN */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <Button
              aria-label={logic.isRecording ? "Detener Grabación" : "Iniciar Conversación"}
              onClick={logic.toggleSession}
              disabled={logic.isProcessing}
              className={cn(
                "h-32 w-32 rounded-full shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-700 squish-effect relative group",
                logic.isRecording 
                  ? (logic.isNativeTurn ? "bg-primary scale-110" : "bg-secondary scale-110") 
                  : "bg-[#18181b] border-2 border-white/[0.05] text-white hover:border-primary/40"
              )}
            >
              {logic.isProcessing ? (
                <Sparkles className="w-10 h-10 animate-spin text-white" />
              ) : (
                <>
                  {logic.isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                  <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping opacity-20" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* COLUMNA 3: ANÁLISIS & WIDGETS (3/12) */}
      <aside className="col-span-3 flex flex-col gap-6">
        {/* WIDGET CÁMARA */}
        <div className="glass-panel aspect-video rounded-[2rem] overflow-hidden border-white/[0.06] bg-black relative shadow-2xl">
          {logic.isCameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/5">
              <CameraOff className="w-12 h-12 mb-2" />
              <span className="text-[8px] font-headline uppercase tracking-widest">Feed Desactivado</span>
            </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-2 border border-white/10">
              <div className={cn("w-1.5 h-1.5 rounded-full", logic.isCameraActive ? "bg-green-500 animate-pulse" : "bg-white/20")} />
              <span className="text-[7px] font-headline uppercase tracking-widest">Visual_Stream</span>
            </div>
          </div>
        </div>

        {/* ANALÍTICAS BENTO */}
        <div className="flex-1 glass-panel rounded-[2rem] border-white/[0.06] p-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-headline uppercase tracking-widest text-white/40">Créditos de Sistema</h4>
              <Database className="w-3 h-3 text-primary" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Cuota Gemini</span>
                <span className="font-bold">84%</span>
              </div>
              <Progress value={84} className="h-1 bg-white/[0.05]" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-headline uppercase tracking-widest text-white/40">Ajustes de Voz</h4>
              <Settings className="w-3 h-3 text-white/20" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {/* VOZ YO */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest">Género Yo</span>
                  <div className="flex gap-1">
                    <Button 
                      aria-label="Voz Masculina Yo"
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-lg", logic.userVoiceGender === 'masculino' ? "bg-primary text-white" : "text-white/20")}
                    >
                      <User className="w-3 h-3" />
                    </Button>
                    <Button 
                      aria-label="Voz Femenina Yo"
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-lg", logic.userVoiceGender === 'femenino' ? "bg-primary text-white" : "text-white/20")}
                    >
                      <Users className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* VOZ INVITADO */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest">Género Invitado</span>
                  <div className="flex gap-1">
                    <Button 
                      aria-label="Voz Masculina Invitado"
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-lg", logic.partnerVoiceGender === 'masculino' ? "bg-secondary text-white" : "text-white/20")}
                    >
                      <User className="w-3 h-3" />
                    </Button>
                    <Button 
                      aria-label="Voz Femenina Invitado"
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-7 w-7 rounded-lg", logic.partnerVoiceGender === 'femenino' ? "bg-secondary text-white" : "text-white/20")}
                    >
                      <Users className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                <Wifi className="w-3 h-3 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] font-headline font-bold uppercase tracking-widest">Enlace Estable</p>
                <p className="text-[8px] text-white/20 uppercase tracking-widest">Latencia: 14ms</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
