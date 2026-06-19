# 🏗️ Auditoría Técnica de Software: Proyecto SoftIA (v2.1 - Master)

Este documento representa la fuente de verdad absoluta del estado técnico de SoftIA Translate. Actualizado tras la implementación de la arquitectura de redundancia híbrida y gestión de hardware crítica.

## 1. Árbol Completo de Directorios (`src/`)

```text
src/
├── ai/
│   ├── flows/
│   │   ├── ai-tutor-conversation.ts  # Tutoría proactiva de Kitten (Voz/Texto)
│   │   ├── ar-text-translation.ts     # Procesamiento de visión AR táctil
│   │   ├── conversation-translate.ts  # Traductor estricto para Modo Hablar
│   │   └── pronunciation-eval.ts      # Evaluador fonético de lectura
│   ├── dev.ts                         # Script de desarrollo Genkit
│   └── genkit.ts                      # Configuración del núcleo Genkit (Google AI)
├── app/
│   ├── chat/                          # Chat persistente (Histórico V1)
│   ├── conversacion/                  # Módulo de Conversación Adaptativa (Espejo)
│   │   ├── ConversacionDesktop.tsx    # Vista 3 columnas (Glow/Bento)
│   │   ├── ConversacionMobile.tsx     # Vista táctil (Bottom Sheet)
│   │   ├── ConversacionTablet.tsx     # Vista Mesa Redonda (Rotación 180°)
│   │   ├── use-conversacion.ts        # Lógica de audio/hardware (Refactorizado)
│   │   └── page.tsx                   # Despachador de viewports
│   ├── lens/                          # Visión Espacial AR (Visor de cámara)
│   ├── reading/                       # Tutor de pronunciación (Lectura)
│   ├── globals.css                    # Estilos ShadCN y Glassmorphism 2.0
│   ├── layout.tsx                     # Root Layout con Providers y Safe Hydration
│   └── page.tsx                       # Dashboard y Voz Directa (Home)
├── components/
│   ├── layout/
│   │   ├── bottom-nav.tsx             # Navegación Bento responsiva
│   │   └── sidebar-nav.tsx            # Deprecated (Refactorizado en Desktop)
│   ├── ui/                            # Primitivos de ShadCN (Boton, Dialog, etc.)
│   ├── FirebaseErrorListener.tsx      # Escucha de errores de permisos
│   └── ProfileModal.tsx               # Ajustes de idiomas y sincronización
├── firebase/
│   ├── auth/                          # useUser.tsx (Estado de sesión)
│   ├── firestore/                     # Hooks useDoc y useCollection
│   ├── client-provider.tsx            # Inicialización segura cliente
│   ├── config.ts                      # Firebase Config y Env Validation
│   ├── index.ts                       # Barrel de inicialización
│   └── provider.tsx                   # Firebase React Context
├── hooks/
│   ├── use-mobile.tsx                 # Detección de breakpoint móvil
│   ├── use-thermal-manager.ts         # Telemetría de hardware simulada
│   ├── use-toast.ts                   # Notificaciones de sistema
│   └── use-viewport.ts                # Detección reactiva M/T/D (Nuevo)
├── lib/
│   ├── placeholder-images.json        # Datos AR de prueba
│   ├── store.ts                       # Estado Global Zustand (Persistente)
│   ├── supabaseClient.ts              # Cliente de redundancia inversa
│   ├── syncManager.ts                 # Orquestador de redundancia Firebase/Supabase
│   └── utils.ts                       # Utilidades Tailwind
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

### Redundancia Inversa (`src/lib/syncManager.ts`)
```ts
export async function syncUserData(uid: string | null, payload: any) {
  // Lógica: Firebase (Primario) -> Failover -> Supabase (Respaldo)
  // Informa vía Toast al detectar saturación (Error 429).
}
```

### Variables de Entorno Activas
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `GOOGLE_GENAI_API_KEY` (Genkit Core)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Estado del Core de IA (Genkit Flows)

### Traducción de Conversación (`src/ai/flows/conversation-translate.ts`)
```ts
export const conversationPrompt = ai.definePrompt({
  name: 'conversationPrompt',
  prompt: `Traduce de {{{fromLanguage}}} a {{{toLanguage}}}. ÚNICAMENTE la traducción limpia, sin comentarios ni relleno para TTS.`
});
```

### Tutoría de Kitten (`src/ai/flows/ai-tutor-conversation.ts`)
```ts
export const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  prompt: `Eres Kitten, el gatito asistente virtual... El usuario habla {{{nativeLanguage}}} y quiere aprender {{{targetLanguage}}}.`
});
```

## 4. Análisis de Interfaz (Zustand & Viewports)

### Estado Global (`src/lib/store.ts`)
```ts
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      nativeLanguage: 'Español',
      targetLanguage: 'Inglés',
      userVoiceGender: 'masculino',
      partnerVoiceGender: 'femenino',
      conversationHistory: [],
      // ...setters con persistencia en localStorage
    }),
    { name: 'softia-core-storage' }
  )
);
```

### Despachador de Vista (`src/app/conversacion/page.tsx`)
```tsx
export default function ConversacionPage() {
  const { isMobile, isTablet, isDesktop, mounted } = useViewport();
  if (!mounted) return <Loading />;
  if (isDesktop) return <ConversacionDesktop />;
  if (isTablet) return <ConversacionTablet />;
  return <ConversacionMobile />;
}
```

## 5. Reporte de QA y Estabilidad de Sistemas

### Hallazgos Críticos:
1.  **Hardware**: Se ha implementado el ciclo de apagado estricto (`track.stop()`) en `use-conversacion.ts` y `lens/page.tsx`, resolviendo el sobrecalentamiento en dispositivos móviles.
2.  **Voz Directa**: El flujo de voz a voz en `app/page.tsx` ya no utiliza la caja de texto como buffer intermedio, reduciendo la latencia percibida.
3.  **Accesibilidad**: Todos los modales incluyen `DialogDescription` y los botones de iconos tienen `aria-label`, eliminando las advertencias de consola.
4.  **Redundancia**: El `syncManager` ha sido probado exitosamente bajo simulación de cuota excedida, enrutando correctamente a Supabase.
5.  **Viewport Fix**: La barra de navegación `BottomNav` ahora es condicional (`lg:hidden`), evitando conflictos visuales con la barra lateral bento de la versión de escritorio.

---
*Fin del Reporte de Auditoría Técnica v2.1*