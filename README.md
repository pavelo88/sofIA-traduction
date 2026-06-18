# SoftIA Translate - AR Spatial Learning

Este repositorio contiene la base arquitectónica y funcional de **SoftIA Translate**, una aplicación de traducción y aprendizaje de idiomas basada en Realidad Aumentada (AR) y procesamiento espacial de alto rendimiento.

## 🚀 Arquitectura del Sistema (React Native New Architecture)

La aplicación está diseñada bajo el principio de **Separación de Responsabilidades (SoC)**, priorizando el rendimiento en tiempo real y la baja latencia.

### Estructura del Proyecto (Monorepo Mental Model)

```text
src/
├── core/         # Gestión de estado (Zustand), Hooks de hardware y Lógica JSI.
├── services/     # Servicios de red, Supabase SDK e integración con Google AI (Gemini).
├── components/   # UI Reutilizable (Bento Grids, Glassmorphism 2.0, Micro-interacciones).
├── screens/      # Páginas principales (Navegación del MVP: Lens, Chat, Reading, Dashboard).
├── assets/       # Modelos 3D, Shaders de AR e Iconografía Line-Thin.
└── ai/           # Flujos Genkit para procesamiento de visión y tutoría proactiva.
```

### 🧠 Justificación del JSI & C++ (Capa Nativa)

Para alcanzar el objetivo de **<5ms de análisis por frame**, se implementa una interfaz de JavaScript (JSI) directa. 

*   **¿Por qué JSI?**: A diferencia del bridge tradicional de React Native que serializa datos a JSON (creando un cuello de botella), el JSI permite a JavaScript invocar funciones de C++ directamente.
*   **Acceso Directo**: Esto otorga acceso a los buffers de video YUV sin sobrecarga de memoria, permitiendo que algoritmos de OCR y detección de objetos corran a 60 FPS.

### 🌡️ Thermal Runaway Manager

El sistema incluye un monitor térmico preventivo crítico para aplicaciones de IA intensiva:
1. **Detección**: Monitorea la temperatura del SoC en tiempo real.
2. **Mitigación**: Al detectar temperaturas críticas (>45°C), el sistema reduce automáticamente la resolución de captura (1080p -> 720p) y limita los FPS (60 -> 30).
3. **UX Proactiva**: Kitten (el asistente) notifica sutilmente al usuario para evitar cierres inesperados por el SO.

## 🛠️ Instalación y Requisitos

### Requisitos Previos
- **Node.js**: v18+
- **Ruby & Bundler**: Para dependencias de iOS (CocoaPods).
- **Entorno Nativo**: Xcode (iOS 15+) o Android Studio (API 31+).

### Pasos de Instalación
1. Clonar el repositorio.
2. Ejecutar `npm install`.
3. **Activar Nueva Arquitectura**:
   - **iOS**: `bundle exec pod install` dentro de la carpeta `ios` con el flag `RCT_NEW_ARCH_ENABLED=1`.
   - **Android**: Activar `newArchEnabled=true` en `gradle.properties`.
4. Ejecutar `npm start`.

## 🐱 SoftIA Kitten Assistant
Kitten es un agente proactivo que utiliza **Gemini 2.0 Flash** como cerebro de respaldo en la nube cuando la capacidad On-Device es insuficiente, garantizando siempre una respuesta fluida y precisa en la evaluación de lectura y conversación.

---
*Desarrollado para la nueva era de interfaces espaciales y aprendizaje inmersivo.*
