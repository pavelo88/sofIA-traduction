# 🏗️ Auditoría de Software: Proyecto SoftIA

Este documento detalla el estado técnico actual de la plataforma SoftIA Translate para facilitar la planificación de la refactorización.

## 1. Estructura del Proyecto (`src/`)

```text
src/
├── ai/
│   ├── flows/
│   │   ├── ai-tutor-conversation.ts  # Flujo principal de Kitten
│   │   ├── ar-text-translation.ts     # Lente AR
│   │   ├── conversation-translate.ts  # Modo Compañero
│   │   └── pronunciation-eval.ts      # Evaluación de voz
│   └── genkit.ts                      # Configuración del núcleo Genkit
├── app/
│   ├── conversacion/                  # Fase 4: Modo Conversación
│   ├── lens/                          # Visión Espacial AR
│   ├── reading/                       # Práctica de lectura
│   ├── globals.css                    # Estilos y Variables HSL
│   ├── layout.tsx                     # Envoltorio Global y Providers
│   └── page.tsx                       # Dashboard y Chat de Kitten (Principal)
├── components/
│   ├── layout/
│   │   ├── bottom-nav.tsx             # Navegación Bento Glassmorphism
│   │   └── sidebar-nav.tsx            # Deprecated
│   └── ui/                            # Componentes ShadCN
├── firebase/
│   ├── auth/                          # Hooks de Autenticación
│   ├── firestore/                     # Hooks de Datos
│   └── config.ts                      # Inicialización y Env Sync
├── hooks/                             # Custom Hooks (Thermal, Mobile, Toast)
└── lib/
    ├── store.ts                       # Estado Global (Zustand)
    └── utils.ts                       # Tailwind Merge / Clsx
```

## 2. Dependencias Principales (`package.json`)

- **Core**: `next@15.5.9`, `react@19.2.1`
- **IA**: `genkit@1.28.0`, `@genkit-ai/google-genai@1.28.0`
- **Backend**: `firebase@11.9.1`
- **Estado**: `zustand@5.0.3`
- **UI**: `tailwind-merge`, `lucide-react`, `radix-ui` primitives.

## 3. Componente de Interfaz de Chat (Actual: `src/app/page.tsx`)

```tsx
// Lógica simplificada de interacción en el Dashboard
export default function Home() {
  // ... estados de input, voz y respuesta
  const handleKittenChat = async () => {
    // ... integración con aiTutorConversation y Firestore
  };

  return (
    <main>
      {/* Visualización de Respuesta de Kitten */}
      <div className="text-lg italic">"{kittenResponse}"</div>
      
      {/* Controles de Entrada */}
      <div className="flex gap-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} />
        <Button onClick={toggleVoice} className={isRecording ? "bg-rose-500" : "bg-white/10"}>
          {isRecording ? <MicOff /> : <Mic />}
        </Button>
        <Button onClick={handleKittenChat}><Send /></Button>
      </div>
    </main>
  );
}
```

## 4. Flujo de Genkit (`src/ai/flows/ai-tutor-conversation.ts`)

```ts
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: AITutorConversationOutputSchema },
  prompt: `Eres Kitten, el gatito asistente virtual de SoftIA...`,
});

export async function aiTutorConversation(input: AITutorConversationInput) {
  const { output } = await aiTutorConversationPrompt(input);
  return output!;
}
```

## 5. Componente de Navegación (`src/components/layout/bottom-nav.tsx`)

Este componente es el lugar ideal para colocar el botón de **Perfil/Idiomas**, ya que es persistente en toda la aplicación.

```tsx
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg">
      <div className="glass-panel rounded-full p-2 flex justify-around items-center">
        {/* Aquí residen los enlaces a Home, Lens, Reading y Conversacion */}
      </div>
    </nav>
  );
}
```

---
*Fin de la Auditoría Técnica v1.0*