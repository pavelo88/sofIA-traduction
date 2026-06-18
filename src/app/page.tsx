
"use client";

import { useState, useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useStore } from '@/lib/store';
import { aiTutorConversation } from '@/ai/flows/ai-tutor-conversation';
import { 
  Camera, 
  BookOpen, 
  Mic, 
  BarChart3, 
  Send, 
  Sparkles,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useFirestore, useDoc } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';

/**
 * Pantalla Principal: SoftIA AR Lens Dashboard
 * Este componente orquestra la visión AR simulada, la interacción con Kitten (IA)
 * y la persistencia de datos en tiempo real con Firestore.
 */
export default function Home() {
  const { learningProgress } = useStore();
  const db = useFirestore();

  // --- PERSISTENCIA: HUD DINÁMICO ---
  // Obtenemos el progreso del usuario desde Firestore en tiempo real.
  const { data: progressData } = useDoc(doc(db, 'user_progress', 'demo-user'));
  const currentLevel = progressData?.accuracy_percentage ?? learningProgress;

  // --- REFERENCIAS Y ESTADOS DE HARDWARE (CÁMARA AR) ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- ESTADOS DE REACCIÓN INTERACTIVA ---
  const [input, setInput] = useState('');
  const [kittenResponse, setKittenResponse] = useState('¡Hola! Soy Kitten. ¿Listo para nuestra sesión espacial de hoy? 🐱✨ ¡Prrr!');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * INICIALIZACIÓN DE LA CÁMARA (Lógica AR Lens)
   * Gestiona el acceso al hardware y el ciclo de vida del stream.
   */
  useEffect(() => {
    setIsMounted(true);

    async function startCamera() {
      try {
        const constraints = {
          video: { 
            facingMode: "environment", 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false 
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err: any) {
        // Fallback si la cámara no está disponible o el permiso es denegado
        console.error("Error al acceder a la cámara:", err);
        setCameraError("No se pudo activar la visión AR. Usando modo de respaldo.");
      }
    }

    startCamera();

    // Limpieza al desmontar para liberar recursos del sistema
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  /**
   * Manejador de eventos que envía la solicitud a Gemini y guarda en Firestore.
   * Conecta el input del usuario con el "cerebro" de Kitten y persiste la memoria del chat.
   */
  const handleKittenChat = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input;
    setInput('');

    try {
      // 1. Persistencia: Guardar mensaje del usuario en Firestore
      addDoc(collection(db, 'chat_history'), {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

      // 2. Inteligencia Artificial: Llamada a Genkit (Gemini)
      const result = await aiTutorConversation({
        message: userMessage,
        chatHistory: [] // En el MVP enviamos historial vacío, escalable a memoria contextual
      });
      
      setKittenResponse(result.response);

      // 3. Persistencia: Guardar respuesta de Kitten en Firestore
      addDoc(collection(db, 'chat_history'), {
        role: 'model',
        content: result.response,
        timestamp: new Date().toISOString(),
        user_email: 'demo@softia.com'
      });

    } catch (error) {
      console.error("Error en chat:", error);
      setKittenResponse("¡Miau!... algo interfirió con mi señal espacial en la nube. ¡Inténtalo de nuevo! 🚀");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center">
      
      {/* --- CAPA DE FONDO: LIVE CAMERA STREAM (VISIÓN AR) --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black to-black" />
        
        {!cameraError && (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover z-[-1] opacity-70"
          />
        )}

        {/* Efectos visuales de HUD: Escaneo y ruido de película para inmersión */}
        <div className="ar-scanner absolute inset-0 opacity-20 pointer-events-none" />
      </div>

      <SidebarNav />

      {/* --- PANEL SUPERIOR: KITTEN ASSISTANT (CONECTADO A GEMINI + FIRESTORE) --- */}
      <header className="relative z-20 w-full max-w-4xl pt-8 px-6 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="glass-panel p-6 rounded-[2.5rem] w-full flex items-center gap-6 border-white/10 shadow-primary/20 shadow-2xl">
          
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow">
              <span className="text-4xl" role="img" aria-label="Kitten">🐱</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background flex items-center justify-center" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="text-sm font-medium text-white/90 leading-relaxed italic min-h-[2.5rem] flex items-center">
              {isLoading ? (
                <span className="flex items-center gap-2 text-primary text-xs font-headline uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" /> Kitten está pensando...
                </span>
              ) : (
                `"${kittenResponse}"`
              )}
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKittenChat()}
                placeholder="Pregunta algo a Kitten..."
                disabled={isLoading}
                className="bg-white/5 border-white/10 h-10 rounded-xl text-xs focus-visible:ring-primary text-white placeholder:text-white/30"
              />
              <Button 
                onClick={handleKittenChat}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 squish-effect"
              >
                {isLoading ? <Zap className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Indicadores de Sistema AR Dinámicos */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Activity className="w-3 h-3 text-green-500" /> {cameraError ? "VIDEO_OFF" : "JSI_STREAM: 60FPS"}
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60">
            <Sparkles className="w-3 h-3 text-primary" /> NIVEL: {currentLevel}%
          </div>
          {cameraError && (
            <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-[10px] uppercase tracking-widest text-destructive">
              <AlertCircle className="w-3 h-3" /> MODO_DE_RESPALDO
            </div>
          )}
        </div>
      </header>

      {/* --- PANEL INFERIOR: BENTO GRID NAVIGATION (GLASSMORPHISM 2.0) --- */}
      <footer className="fixed bottom-10 z-20 w-full max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 glass-panel bg-black/40 backdrop-blur-3xl rounded-[3rem] border-white/5 shadow-2xl">
          
          <Link href="/lens" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-primary/20 border border-white/5 group-hover:border-primary/30 squish-effect">
              <Camera className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Lente AR</span>
            </div>
          </Link>

          <Link href="/reading" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-secondary/20 border border-white/5 group-hover:border-secondary/30 squish-effect">
              <BookOpen className="w-8 h-8 text-secondary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Lectura</span>
            </div>
          </Link>

          <Link href="/chat" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-primary/20 border border-white/5 group-hover:border-primary/30 squish-effect">
              <Mic className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Conversar</span>
            </div>
          </Link>

          <Link href="/" className="group">
            <div className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 transition-all group-hover:bg-secondary/20 border border-white/5 group-hover:border-secondary/30 squish-effect">
              <BarChart3 className="w-8 h-8 text-secondary" />
              <span className="text-[10px] font-headline uppercase tracking-widest text-white/60 group-hover:text-white">Progreso</span>
            </div>
          </Link>

        </div>
      </footer>

      {/* Decoraciones HUD: Esquineras de mira telescópica */}
      <div className="fixed top-6 left-6 w-12 h-12 border-t border-l border-white/20 rounded-tl-xl pointer-events-none" />
      <div className="fixed top-6 right-6 w-12 h-12 border-t border-r border-white/20 rounded-tr-xl pointer-events-none" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-b border-l border-white/20 rounded-bl-xl pointer-events-none" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-b border-r border-white/20 rounded-br-xl pointer-events-none" />
    </main>
  );
}
