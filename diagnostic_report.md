# Reporte de Diagnóstico Clínico - SoftIA Traduction

Este documento sirve como puente técnico para explicar de forma detallada y rigurosa los problemas persistentes que experimenta la aplicación relacionados con la captura de voz (micrófono) y la dependencia de Inteligencia Artificial para la traducción. Puede ser ingerido por cualquier otro asistente de IA para comprender el contexto arquitectónico de los fallos.

## 1. El Problema del Micrófono ("Se activa distinto, tiene dos funciones, no sirve")

### 1.1 Naturaleza del Problema
El usuario reporta que el micrófono tiene comportamientos erráticos, parece tener múltiples formas de activarse y finalmente deja de ser útil. La raíz del problema **no está en la lógica de React**, sino en una limitación severa e indocumentada de la API nativa de los navegadores: **La Web Speech API (`webkitSpeechRecognition`)**.

### 1.2 Análisis Técnico de la Falla (`use-conversacion.ts`)
Nuestra arquitectura utiliza `recognition.continuous = true` y `recognition.interimResults = true`. 
El flujo diseñado es:
1. El usuario presiona "Grabar" (`toggleSession` llama a `startListening()`).
2. El micrófono escucha y transcribe indefinidamente.
3. Si el navegador (especialmente iOS/Safari) corta el micrófono automáticamente por una pequeña pausa del usuario, el evento `onend` lo detecta y hace un reinicio invisible (`setTimeout(() => startListening(), 50)`).
4. El usuario presiona "Detener" para traducir el texto acumulado.

**Por qué esto fracasa miserablemente en el mundo real (Especialmente en móviles/iOS):**
- **Regla de Interacción Estricta de Apple:** Safari/iOS **PROHÍBE** que el micrófono se active programáticamente (ej. a través de un `setTimeout`). Solo permite `recognition.start()` si ocurre *exactamente* en el mismo hilo de ejecución de un evento de toque/clic del usuario.
- Cuando nuestro código intenta el "reinicio invisible" en el evento `onend`, Safari lo bloquea silenciosamente o lanza un error `not-allowed`. Esto causa que el micrófono "parezca" que está grabando (la UI parpadea), pero no escucha nada.
- Además, Safari ignora la directiva `continuous = true`. Corta la escucha tras unos segundos de silencio absoluto, obligando a nuestro código a intentar el reinicio prohibido.

### 1.3 Consecuencias Observadas por el Usuario
1. **"Se activa distinto"**: A veces arranca limpio con un clic. Otras veces intenta auto-arrancar por el fallo del navegador y se queda en un estado "zombie" (UI dice grabando, pero no entra audio).
2. **"Se apaga y prende solo"**: Es el bucle de nuestro `onend` intentando revivir el micrófono que el navegador mató.
3. **"No sirve para nada"**: El estado zombie hace que el `liveTranscript` se congele, perdiendo fragmentos de la conversación.

### 1.4 Posibles Soluciones (Para discutir con otra IA)
- **Opción A (La dolorosa pero segura):** Eliminar el intento de "grabación continua / reinicio invisible". Forzar a que la app funcione estilo "Push to Talk" estricto (Walkie-Talkie). Si el navegador corta la grabación, se traduce lo que haya y el usuario DEBE volver a tocar la pantalla.
- **Opción B (La profesional):** Abandonar `Web Speech API`. Implementar captura de audio crudo (`MediaRecorder`), enviarlo por WebSockets a un backend (o servidor intermedio) y usar Whisper de OpenAI/GCP para la transcripción en tiempo real (STT).

---

## 2. ¿Necesitamos Inteligencia Artificial para Traducir?

### 2.1 El mito de la "Traducción sin IA"
**SÍ, necesitamos Inteligencia Artificial obligatoriamente.** 
Hay una confusión común sobre lo que hace el navegador. La API del micrófono (`SpeechRecognition`) **NO traduce**. Solo hace **Transcripción (STT - Speech to Text)**. 
Si el invitado habla en inglés, el micrófono entrega texto en inglés. 

Para pasar ese texto a español, requerimos un motor de traducción. Las opciones clásicas (como Google Translate API o DeepL) son básicamente IAs entrenadas. Nosotros utilizamos Gemini/Claude/DeepSeek a través de un backend para tener "Traducción Contextual", es decir, que la traducción suene natural, identifique modismos y no sea robótica.

### 2.2 Las APIs de Traducción del Navegador (`window.translation`)
En `use-conversacion.ts` implementamos un intento de usar `window.translation` o `window.ai`. Estas son APIs *experimentales* (actualmente solo en Chrome Canary con flags activadas). Como no existen en el 99% de los dispositivos, el código siempre cae en el `Fallback`: enviar el texto a la IA en la nube (Vercel AI SDK).

Por ende, **sin conexión a una IA o API externa, la app no puede traducir** textos.

## 3. Guía de Intervención para la próxima IA

Si deseas usar este documento con otra IA para arreglar la app, entrégale este archivo junto con `use-conversacion.ts` y pídele lo siguiente:

> *"La API nativa webkitSpeechRecognition está colapsando por las restricciones de iOS/Safari sobre grabaciones continuas y reinicios programáticos, creando un estado de UI zombie y cortes en la transcripción. ¿Cómo reestructuramos `use-conversacion.ts` para que opere en un modo de 'Pulsar para Hablar' estricto sin reinicios automáticos, manejando la finalización temprana del navegador como un trigger forzado de traducción en lugar de intentar revivir el micrófono?"*
