"use client";

import { useEffect, useState, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useStore } from '@/lib/store';
import { useThermalManager } from '@/hooks/use-thermal-manager';
import { Sparkles, Zap, Flame, Target, Star, Brain, ChevronRight, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Componente de tarjeta con efecto de inclinación 3D para el dashboard bento
function TiltCard({ children, className, intensity = 10 }: { children: React.ReactNode, className?: string, intensity?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    
    cardRef.current.style.setProperty('--rx', `${rotateX}deg`);
    cardRef.current.style.setProperty('--ry', `${rotateY}deg`);
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("tilt-card glass-panel transition-all duration-300 hover:shadow-primary/20 hover:border-primary/30", className)}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { learningProgress, isThermalThrottled, thermalTemperature } = useStore();
  const { isCritical } = useThermalManager();

  return (
    <main className="min-h-screen p-6 md:p-12 md:pl-32 pb-32 max-w-[1600px] mx-auto">
      <SidebarNav />
      
      <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-headline text-primary uppercase tracking-widest">
            Sesión Activa
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Activity className="w-3 h-3 text-green-500" /> Latencia JSI: 4.2ms
          </div>
        </div>
        <h1 className="font-headline text-5xl md:text-7xl mb-4 font-bold tracking-tighter">
          SoftIA <span className="text-primary italic">Studio</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Explora la nueva frontera del aprendizaje espacial. Tu asistente <span className="text-white font-medium">Kitten</span> ha optimizado tu ruta de hoy basada en tu progreso on-device.
        </p>
      </header>

      <div className="bento-grid">
        {/* Tarjeta de Progreso Principal (Grande) */}
        <TiltCard className="col-span-12 md:col-span-8 h-[350px] p-10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-colors" />
          
          <div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-headline font-bold mb-2 flex items-center gap-3">
                  <Brain className="text-primary w-8 h-8" /> Maestría Lingüística
                </h2>
                <p className="text-muted-foreground">Nivel actual: Explorador de Sistemas Espaciales</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Target className="text-secondary w-8 h-8" />
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white/60">Progreso Total</span>
                <span className="text-primary">{learningProgress}%</span>
              </div>
              <Progress value={learningProgress} className="h-4 bg-white/5" />
            </div>
          </div>

          <div className="flex gap-4 items-center text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                  {i}
                </div>
              ))}
            </div>
            <span>+12 conceptos dominados en la última hora</span>
          </div>
        </TiltCard>

        {/* Monitor Térmico (Pequeño) */}
        <TiltCard className={cn(
          "col-span-12 md:col-span-4 p-8 flex flex-col justify-between border-l-4",
          isCritical ? "border-destructive" : "border-primary"
        )}>
          <div>
            <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
              <Flame className={cn("w-6 h-6", isCritical ? "text-destructive" : "text-primary")} /> Estado Térmico
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-sm text-muted-foreground uppercase tracking-widest">Temperatura</span>
                <span className={cn("text-4xl font-headline font-bold", isCritical ? "text-destructive" : "text-primary")}>
                  {thermalTemperature.toFixed(1)}°C
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Modo Hardware</span>
                  <span className="text-white font-medium">{isThermalThrottled ? 'THROTTLED' : 'PERFORMANCE'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Captura</span>
                  <span className="text-white font-medium">{isThermalThrottled ? '720p / 30fps' : '1080p / 60fps'}</span>
                </div>
              </div>
            </div>
          </div>
          {isCritical && (
            <p className="text-[10px] text-destructive uppercase tracking-widest font-bold animate-pulse mt-4">
              CRITICAL: Reduciendo carga JSI...
            </p>
          )}
        </TiltCard>

        {/* Racha Diaria (Pequeño) */}
        <TiltCard className="col-span-12 md:col-span-4 p-8">
          <h3 className="text-xl font-headline font-bold mb-4 flex items-center gap-2">
            <Zap className="text-secondary w-5 h-5" /> Racha Diaria
          </h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-headline font-bold text-white">15</span>
            <span className="text-muted-foreground">Días</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className={cn(
                "h-2 rounded-full",
                i < 13 ? "bg-secondary shadow-[0_0_8px_hsla(var(--secondary),0.5)]" : "bg-white/10"
              )} />
            ))}
          </div>
        </TiltCard>

        {/* Sugerencia de Kitten (Mediano) */}
        <TiltCard className="col-span-12 md:col-span-8 p-8 flex items-center gap-8 bg-primary/5 border-primary/20">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 relative">
            <Star className="text-primary w-12 h-12 fill-primary" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Sparkles className="text-background w-4 h-4" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-headline font-bold text-primary">Kitten Assistant</span>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase">IA Proactiva</span>
            </div>
            <p className="text-white/80 leading-relaxed italic mb-4">
              "He analizado tus últimas sesiones de lectura. He notado que te detienes un poco más en los verbos irregulares. ¿Te gustaría que los prioricemos en el AR Lens hoy?"
            </p>
            <button className="flex items-center gap-2 text-primary text-sm font-bold hover:underline">
              Aceptar sugerencia <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </TiltCard>
      </div>
    </main>
  );
}
