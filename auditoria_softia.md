# 🏗️ Auditoría Técnica de Software: Proyecto SoftIA (v2.0)

Este documento representa la fuente de verdad absoluta del estado técnico de SoftIA Translate. Ha sido generado tras un barrido profundo de QA y arquitectura.

## 1. Árbol Completo de Directorios (`src/`)

```text
src/
├── ai/
│   ├── flows/
│   │   ├── ai-tutor-conversation.ts  # Flujo principal de Kitten (Tutoría y Chat)
│   │   ├── ar-text-translation.ts     # Procesamiento de visión espacial AR
│   │   ├── conversation-translate.ts  # Traductor estricto para Modo Hablar
│   │   └── pronunciation-eval.ts      # Evaluador fonético de lectura
│   ├── dev.ts                         # Script de desarrollo para Genkit
│   └── genkit.ts                      # Configuración del núcleo Genkit (Google AI)
├── app/
│   ├── chat/                          # Pantalla de chat persistente (V1)
│   ├── conversacion/                  # Modo Espejo Adaptativo (Mobile/Tablet/Desktop)
│   │   ├── ConversacionDesktop.tsx
│   │   ├── ConversacionMobile.tsx
│   │   ├── ConversacionTablet.tsx
│   │   ├── use-conversacion.ts        # Lógica de negocio (STT/TTS/Turnos)
│   │   └── page.tsx                   # Despachador de vista (Viewport-Driven)
│   ├── lens/                          # Visión Espacial AR (Visor de cámara)
│   ├── reading/                       # Tutor de pronunciación (Lectura)
│   ├── globals.css                    # Definiciones de diseño y variables HSL
│   ├── layout.tsx                     # Envoltorio Global, Providers y Hydration Fix
│   └── page.tsx                       # Dashboard y Chat de Voz Directa (Principal)
├── components/
│   ├── layout/
│   │   ├── bottom-nav.tsx             # Navegación Bento (Móvil/Desktop)
│   │   └── sidebar-nav.tsx            # Deprecated (Placeholder)
│   ├── ui/                            # Primitivos de ShadCN (Accordion, Dialog, etc.)
│   ├── FirebaseErrorListener.tsx      # Escucha global de errores de Firestore
│   └── ProfileModal.tsx               # Ajustes de idioma y perfil
├── firebase/
│   ├── auth/                          # useUser.tsx (Hook de sesión)
│   ├── firestore/                     # useDoc.tsx y useCollection.tsx
│   ├── client-provider.tsx            # Inicialización segura en el cliente
│   ├── config.ts                      # Variables de entorno y FirebaseConfig
│   ├── error-emitter.ts               # Bus de eventos para errores de permisos
│   ├── errors.ts                      # Clase FirestorePermissionError
│   ├── index.ts                       # Punto de entrada de inicialización
│   └── provider.tsx                   # React Context para Firebase
├── hooks/
│   ├── use-mobile.tsx                 # Detección de breakpoint móvil
│   ├── use-thermal-manager.ts         # Simulación de telemetría de hardware
│   ├── use-toast.ts                   # Sistema de notificaciones
│   └── use-viewport.ts                # Detección reactiva de viewports (M/T/D)
├── lib/
│   ├── placeholder-images.json        # Datos de imágenes AR de prueba
│   ├── store.ts                       # Estado Global con Zustand
│   └── utils.ts                       # Utilidades de Tailwind
```

## 2. Mapeo de Backend y Configuraciones

### Inicialización de Firebase (`src/firebase/config.ts`)
```ts
'use client';
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

### Hooks de Datos y Autenticación
- **Auth**: `useUser()` en `src/firebase/auth/use-user.tsx` (Suscribe a cambios de estado de Firebase Auth).
- **Firestore**: 
  - `useDoc(docRef)`: Escucha en tiempo real un documento.
  - `useCollection(query)`: Escucha en tiempo real una colección con manejo de errores contextuales.

### Variables de Entorno Requeridas
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GOOGLE_GENAI_API_KEY` o `GEMINI_API_KEY`

## 3. Estado del Core de IA (Genkit)

### Configuración del Núcleo (`src/ai/genkit.ts`)
```ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
```

### Flujos de IA (Genkit Flows)

#### Tutor de IA (`src/ai/flows/ai-tutor-conversation.ts`)
```ts
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const AITutorConversationInputSchema = z.object({
  message: z.string(),
  chatHistory: z.array(ChatMessageSchema).optional(),
  nativeLanguage: z.string().default('Español'),
  targetLanguage: z.string().default('Inglés'),
});

const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: z.object({ response: z.string(), evaluation: z.string().optional(), suggestion: z.string().optional() }) },
  prompt: `Eres Kitten, el gatito asistente virtual de SoftIA. Eres un profesor de idiomas tierno y experto. El usuario habla {{{nativeLanguage}}} y quiere practicar o traducir al {{{targetLanguage}}}. INSTRUCCIONES: 1. Responde DIRECTAMENTE en {{{targetLanguage}}}. 2. Sé breve y usa emojis (¡Miau!).`,
});

export async function aiTutorConversation(input: z.infer<typeof AITutorConversationInputSchema>) {
  const { output } = await aiTutorConversationPrompt(input);
  return output!;
}
```

#### Traductor de Conversación (`src/ai/flows/conversation-translate.ts`)
```ts
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConversationTranslateInputSchema = z.object({
  text: z.string(),
  fromLanguage: z.string(),
  toLanguage: z.string(),
});

const conversationPrompt = ai.definePrompt({
  name: 'conversationPrompt',
  input: { schema: ConversationTranslateInputSchema },
  output: { schema: z.object({ translatedText: z.string() }) },
  prompt: `Traduce de {{{fromLanguage}}} a {{{toLanguage}}}. ÚNICAMENTE la traducción limpia, sin comentarios ni relleno. Texto: "{{{text}}}"`,
});

export async function translateConversation(input: z.infer<typeof ConversationTranslateInputSchema>) {
  const { output } = await conversationPrompt(input);
  return output!;
}
```

## 4. Análisis de Interfaz y Lógica de Frontend

### Estado Global (`src/lib/store.ts`)
```ts
import { create } from 'zustand';

interface AppState {
  thermalTemperature: number;
  learningProgress: number;
  nativeLanguage: string;
  targetLanguage: string;
  userVoiceGender: 'masculino' | 'femenino';
  partnerVoiceGender: 'masculino' | 'femenino';
  // ...setters
}

export const useStore = create<AppState>((set) => ({
  thermalTemperature: 38,
  learningProgress: 45,
  nativeLanguage: 'Español',
  targetLanguage: 'Inglés',
  userVoiceGender: 'masculino',
  partnerVoiceGender: 'femenino',
  setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),
  // ...resto de setters
}));
```

### Componente de Conversación Adaptativa (`src/app/conversacion/page.tsx`)
Utiliza un sistema de despacho por viewport:
```tsx
'use client';
import { useViewport } from '@/hooks/use-viewport';
import { ConversacionMobile } from './ConversacionMobile';
import { ConversacionTablet } from './ConversacionTablet';
import { ConversacionDesktop } from './ConversacionDesktop';

export default function ConversacionPage() {
  const { isMobile, isTablet, isDesktop, mounted } = useViewport();
  if (!mounted) return <Loading />;
  if (isDesktop) return <ConversacionDesktop />;
  if (isTablet) return <ConversacionTablet />;
  return <ConversacionMobile />;
}
```

### Navegación Bento (`src/components/layout/bottom-nav.tsx`)
Implementa un selector de idiomas y navegación estilizada:
```tsx
export function BottomNav() {
  // ...lógica de mounted para evitar hydration errors
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 ...">
      <div className="glass-panel ...">
        {/* Links a Inicio, Lens, Reading, Conversación */}
        <ProfileModal><button>Perfil</button></ProfileModal>
      </div>
    </nav>
  );
}
```

## 5. Reporte de Errores, TODOs y Mejoras de UX

### Hallazgos de QA:
1.  **Cámara AR (`src/app/lens/page.tsx`)**: Se ha implementado correctamente el `cleanup` del track de video. Sin embargo, en dispositivos iOS antiguos, el `facingMode: "environment"` a veces falla si no se especifican restricciones de resolución.
2.  **Hydration Fix**: Se utiliza el patrón `isMounted` en `layout.tsx` y `bottom-nav.tsx`, lo cual es correcto pero indica que el servidor no conoce el estado de las variables de entorno hasta el renderizado del cliente.
3.  **Accesibilidad**: 
    - **MODAL**: Se ha añadido `DialogDescription className="sr-only"` en el `ProfileModal` para resolver errores de ARIA.
    - **BOTONES**: Algunos botones de iconos (Micrófono) en `ConversacionDesktop` carecen de `aria-label` descriptivo.
4.  **Telemetría**: El `useThermalManager.ts` es puramente simulado (`Math.random()`). En una refactorización real, debería conectarse a APIs nativas de Web para dispositivos móviles si se empaqueta con Capacitor o similar.
5.  **Inconsistencia Visual**: El `BottomNav` aparece tanto en móvil como en escritorio. En la vista Desktop de conversación, se debería ocultar por completo si el diseño asimétrico de 3 columnas ya incluye navegación propia.

---
*Fin del Reporte de Auditoría v2.0*