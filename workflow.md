# Documentación de Procesos Internos (Workflow Técnico)

Este documento mapea cómo interactúan las distintas capas de la aplicación por debajo para lograr la traducción en tiempo real. 

## 1. El Controlador Central (`use-conversacion.ts`)
Este "Hook" es el cerebro absoluto de la aplicación. Mantiene todo el "estado" de la conversación:
- Quién está hablando (`isNativeTurn`).
- El estado físico del hardware (`isRecording`, `isSpeaking`).
- El estado de la IA (`isProcessing`).
- El historial temporal de los textos cruzados.

## 2. Flujo del Micrófono (Captura de Voz)
Cuando se presiona el botón principal del micrófono, se invoca `toggleSession()`:
1. **Inicio:** Si no está grabando, llama a `startListening()`. Esto instancia el `Web Speech API` del navegador.
2. **Normalización:** Se aplica una función `normalizeLang` para garantizar que sin importar lo que diga el perfil del usuario (ej. "Inglés"), el código que se envíe al micrófono sea correcto (ej. `"en-US"`).

> **Aviso de Arquitectura Crítica:**
> Actualmente, la implementación de `Web Speech API` presenta inestabilidad en dispositivos iOS/Safari debido a las restricciones contra grabaciones continuas y reinicios programáticos en el evento `onend`. Esto causa un comportamiento errático en la captura.
> *Para consultar las causas exactas, por qué falla y posibles soluciones, revisa el archivo adjunto: [diagnostic_report.md](diagnostic_report.md).*
3. **Escucha y Transcripción:** Mientras el usuario habla, la API envía resultados parciales a través del evento `onresult`. Estos resultados se inyectan en `liveTranscript` para ser mostrados en la pantalla y se guardan en variables ocultas (`currentTranscriptRef`).
4. **Detención:** Si el usuario presiona el botón de nuevo, se fuerza la detención del micrófono. En este punto, todos los textos parciales acumulados se concatenan en un texto final que se pasa al motor de IA.

## 3. Flujo de Inteligencia Artificial (Traducción)
El texto obtenido del micrófono se envía a la función `handleTranslationInternal(text)`:
1. El estado cambia a `isProcessing = true` (para que la UI muestre el cargador de "Traduciendo...").
2. Se evalúa el motor seleccionado en el perfil (Gemini, DeepSeek, o Local).
3. Se descuentan créditos si el usuario no es "Guest".
4. La promesa se resuelve y retorna el `translatedText`.
5. Se inyecta un nuevo objeto al historial global (que se almacena en el `localStorage` para persistencia).
6. Se desencadena el motor de síntesis de voz pasándole el texto traducido.

## 4. Flujo de Síntesis de Voz y Visualización (Audio Out/In)
La función `speakAndAutoTurn()` recibe el texto traducido y el idioma meta:
1. Se inicializa el `window.speechSynthesis`.
2. Busca en las voces del dispositivo (`getVoices()`) una que coincida con el idioma y el género configurado en el perfil.
3. El estado cambia a `isSpeaking = true` (la UI muestra que la app está hablando).
4. **Cambio de turno:** En el evento `onend`, la función alterna automáticamente la variable `isNativeTurn`. *Nota: El micrófono se debe encender manualmente tras este paso para evitar loops de retroalimentación infinita.*

**Visualización de Audio (`AudioContext`):** Al activar el micrófono, la app lanza un `AudioContext` para medir decibelios y animar la interfaz en tiempo real. Debido a restricciones modernas de seguridad (iOS Safari / Chrome), el `AudioContext` puede quedar suspendido si no se maneja bien; la app ahora intercepta el estado `suspended` e invoca `resume()` asíncronamente en el click exacto del usuario.

## 5. Arquitectura de Memoria (Auto-Save)
La aplicación cuenta con un módulo de memoria pasiva anclado a `Zustand` (`store.ts`).
- La función interna `saveGenericSession` vigila los cambios de estado en módulos clave (Kitten Chat, Lectura, Lente AR y Conversación Dual).
- **Sobreescritura inteligente:** Cada módulo crea un `id` y busca de forma pasiva si ya existe una sesión guardada de ese tipo durante "el día de hoy". Si existe, sobreescribe sus datos (ej. agregando nuevos mensajes al historial). Si no, crea una nueva entrada.
- Toda esta data persiste automáticamente en `LocalStorage` (`softia-storage`) sin interrumpir la experiencia.

## 6. La Interfaz de Usuario (UI) y su Sincronización
Los componentes (`ConversacionMobile.tsx`, `ConversacionDesktop.tsx`, `ProfileModal.tsx`) NO manejan lógica fuerte de procesamiento.
- Son "espejos" reactivos del Hook global.
- Reaccionan a variables booleanas (`isRecording`, `isSpeaking`, `isProcessing`).
- El `ProfileModal.tsx` funciona como visor de la memoria inyectando un `Dialog` sobre el contenido cuando el usuario hace clic en una sesión pasada.
