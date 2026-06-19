# 🏗️ Auditoría Técnica de Software: Proyecto SoftIA (v2.2 - Stable Guest-Ready)

Este documento representa la fuente de verdad absoluta del estado técnico de SoftIA Translate. Actualizado tras la implementación de la arquitectura de resiliencia total y bypass de Firestore.

## 1. Árbol Completo de Directorios (`src/`)

```text
src/
├── ai/
│   ├── flows/
│   │   ├── ai-tutor-conversation.ts  # Tutoría proactiva de Kitten (Voz/Texto)
│   │   ├── ar-text-translation.ts     # Procesamiento de visión AR táctil
│   │   ├── conversation-translate.ts  # Traductor estricto para Modo Hablar
│   │   └── pronunciation-eval.ts      # Evaluador fonético de lectura
│   ├── deepseekClient.ts              # Cliente de IA redundante (Backup)
│   ├── dev.ts                         # Script de desarrollo Genkit
│   └── genkit.ts                      # Configuración del núcleo Genkit (Google AI)
├── app/
│   ├── chat/                          # Chat persistente (Histórico V1)
│   ├── conversacion/                  # Módulo de Conversación Adaptativa
│   │   ├── ConversacionDesktop.tsx    # Vista 3 columnas (Glow/Bento)
│   │   ├── ConversacionMobile.tsx     # Vista FAB (Micrófono Flotante)
│   │   ├── ConversacionTablet.tsx     # Vista Modo Mesa (Rotación 180°)
│   │   ├── use-conversacion.ts        # Lógica de audio y bypass de Firestore
│   │   └── page.tsx                   # Despachador de viewports
│   ├── lens/                          # Visión Espacial AR (Full Screen)
│   ├── reading/                       # Tutor de pronunciación (Sin Cámara)
│   ├── globals.css                    # Estilos ShadCN y Glassmorphism 2.0
│   ├── layout.tsx                     # Root Layout con Providers
│   └── page.tsx                       # Dashboard y Voz Directa (Resiliente)
├── components/
│   ├── layout/
│   │   └── bottom-nav.tsx             # Navegación Minimalista (Bento)
│   ├── ui/                            # Primitivos de ShadCN
│   ├── FirebaseErrorListener.tsx      # Escucha de errores de permisos
│   └── ProfileModal.tsx               # Ajustes Premium (SaaS)
├── firebase/
│   ├── auth/                          # useUser.tsx (Fallback Offline)
│   ├── firestore/                     # Hooks useDoc y useCollection
│   ├── client-provider.tsx            # Inicialización segura
│   ├── config.ts                      # Firebase Config y Env Validation
│   ├── index.ts                       # Barrel de inicialización
│   └── provider.tsx                   # Firebase React Context
├── hooks/
│   ├── use-mobile.tsx                 # Detección de breakpoint
│   ├── use-thermal-manager.ts         # Telemetría de hardware
│   ├── use-toast.ts                   # Notificaciones
│   └── use-viewport.ts                # Detección reactiva M/T/D
├── lib/
│   ├── placeholder-images.json        # Datos AR de prueba
│   ├── store.ts                       # Estado Global Zustand (Persistente)
│   └── utils.ts                       # Utilidades Tailwind
```

## 2. Reporte de Estabilidad v2.2

### Soluciones Críticas Aplicadas:
1.  **Audio Inmortal**: El motor de `SpeechRecognition` en `use-conversacion.ts` ahora es auto-curativo. Si el hardware de audio colisiona, el sistema reinicia la sesión automáticamente, eliminando bloqueos.
2.  **Bypass de Permisos**: Se ha implementado una lógica de detección de invitado. Si el usuario no está autenticado (o hay errores de dominio), la app omite los intentos de Firestore y usa **Zustand** para la persistencia, salvando la funcionalidad del micrófono.
3.  **Cinemática AR**: El Lente AR ahora ocupa el 100% de la pantalla (Full Screen) con un HUD de traducción flotante (Glassmorphism 3.0).
4.  **Auth Resilience**: El hook `useUser` ahora provee un **UID estable de invitado** si Firebase devuelve errores 400 por configuración de dominio, permitiendo que la app hidrate siempre.

---
*Fin del Reporte de Auditoría Técnica v2.2 - El sistema se encuentra en estado OPERATIVO.*
