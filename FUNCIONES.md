# SoftIA Traduction — Manual de Funciones Principales

> Documento de referencia v1.0  
> Describe el comportamiento esperado de cada botón y módulo.  
> **No hay referencias a código.** Solo describe lo que el usuario ve y hace.

---

## 🎙️ MÓDULO 1: CONVERSACIÓN DUAL (`/conversacion`)

Permite una conversación cara a cara entre dos personas que hablan idiomas distintos.  
La app actúa de intérprete en tiempo real.

### Lógica de turnos

La pantalla tiene **dos paneles**: **Tú (Local)** e **Invitado**.

- El panel **activo** se amplía, se ilumina y muestra un punto de color parpadeante.
- El panel **inactivo** se oscurece y se reduce.
- Solo un panel puede estar activo a la vez.
- El turno cambia automáticamente después de cada traducción, o manualmente con **Alternar**.

---

### Botón 1 — 🎤 GRABAR VOZ / DETENER

| Estado | Apariencia | Qué hace |
|---|---|---|
| Reposo | Blanco, dice "Grabar Voz" | Nada está grabando |
| Grabando | Rojo, dice "Detener" | El micrófono está activo |
| Procesando | Morado girando | La IA está traduciendo |
| Hablando IA | Morado, dice "Hablando IA" | La voz sintetizada está reproduciéndose |

**Flujo completo de una traducción:**
1. Pulsa **Grabar Voz** → botón rojo → el micrófono del hablante activo se activa → aparecen las barras de audio → el texto aparece en tiempo real ("Transcribiendo…").
2. Pulsa **Detener** → el micrófono se apaga → el texto capturado se envía a la IA.
3. La IA traduce → la voz sintetizada pronuncia la traducción en el idioma del **otro** panel → el turno cambia al otro hablante.

> **Regla clave**: La app NO adivina cuándo paras de hablar. Solo traduce cuando pulsas **Detener**. Esto es intencional.

Si hay **5 segundos de silencio** durante la grabación: la app dice verbalmente "¿Deseas continuar?" (en el idioma del hablante actual) y reanuda la escucha si no detuviste la grabación.

---

### Botón 2 — 🔄 ALTERNAR

Cambia manualmente el turno activo.

- Si "Tú" estaba activo, pasa a "Invitado" y viceversa.
- Cancela cualquier grabación o síntesis en curso.
- Útil cuando el intérprete necesita cambiar de hablante sin haber dicho nada.

---

### Botón 3 — 📷 CÁMARA (ícono de cámara, controles izquierdos)

- Activa/desactiva la cámara del dispositivo.
- Aparece en el panel lateral derecho en pantalla de escritorio.
- Es solo referencia visual — no captura ni procesa el video para traducción.

---

### Visualizador de Audio (barras animadas)

- Aparece solo cuando se está grabando.
- Las barras suben y bajan siguiendo el volumen del micrófono en tiempo real.
- Si las barras están planas: el micrófono no está captando sonido.

---

### Panel: Historial de Turnos (lateral derecho en escritorio)

- Muestra todas las traducciones completadas, de la más reciente a la más antigua.
- Cada tarjeta muestra: idioma de origen → destino, texto original y traducción.
- Se persiste en el almacenamiento local del navegador (sobrevive recargas).

---

## 🔍 MÓDULO 2: LENTE AR (`/lens`)

Usa la cámara para traducir texto del mundo real en tiempo real mediante Realidad Aumentada.

### Botón 1 — TOCAR PARA ESCANEAR

- La pantalla muestra la vista de cámara con etiquetas flotantes sobre el texto detectado.
- Al tocar la pantalla, congela el frame y muestra la **traducción confirmada** en un panel inferior.
- Al tocar de nuevo, vuelve al modo de escaneo continuo.

### Funcionamiento visual

- Las etiquetas translúcidas flotan sobre el texto en la imagen (estilo AR).
- El texto traducido más prominente aparece en grande en el panel inferior.

---

## 📖 MÓDULO 3: LECTURA (`/reading`)

Para practicar lectura y pronunciación en el idioma objetivo.

### Botón 1 — 🎤 Evaluar Pronunciación

- El usuario lee el texto en voz alta.
- La app escucha y compara lo que dijo con el texto original.
- Devuelve una puntuación y sugerencias de mejora.

### Botón 2 — 🔊 Escuchar

- La app pronuncia el texto en voz alta.
- Útil para escuchar la pronunciación correcta antes de intentarlo.

---

## 🐱 MÓDULO 4: TUTOR KITTEN (`/chat`)

Chatbot de IA que actúa como tutor de idiomas personalizado.

### Cómo funciona

- Kitten conoce tu **idioma nativo** y el **idioma que estás aprendiendo** (configurados en tu perfil).
- Responde en **ambos idiomas**: usa tu idioma nativo para explicar y el idioma objetivo para que practiques.
- Si cometes un error gramatical, aparece una tarjeta de **Evaluación** (fondo morado) explicando el error.
- Debajo aparece una tarjeta de **Sugerencia** con la frase corregida en cursiva.

### Botón 1 — 🎤 Micrófono

- Clic para activar el reconocimiento de voz → Kitten te escucha.
- Transcribe lo que dices y lo envía automáticamente.
- Clic de nuevo para detenerlo.
- Funciona en el idioma nativo configurado.

### Botón 2 — ✉️ Enviar

- Envía el mensaje escrito a Kitten.
- También se activa con **Enter** en el teclado.

### Respuesta de voz de Kitten

- Cuando Kitten responde, la respuesta también se **pronuncia en voz alta** automáticamente.
- Usa el idioma principal de la respuesta.

---

## 🏠 MÓDULO 5: INICIO / TRADUCTOR RÁPIDO (`/`)

Página principal con el traductor directo de texto.

### Flujo básico

1. Selecciona el **idioma de origen** (izquierda) y el **idioma de destino** (derecha).
2. Escribe o pega el texto.
3. La traducción aparece en el panel derecho automáticamente.

### Botón — 🔄 Intercambiar idiomas

- Invierte el idioma de origen con el de destino.
- Mueve el texto entre los paneles.

---

## ⚙️ CONFIGURACIÓN DE PERFIL

Accesible desde el ícono de usuario (esquina inferior izquierda).

| Campo | Descripción |
|---|---|
| Idioma nativo | Tu idioma, el que ya hablas |
| Idioma objetivo | El idioma que aprendes / el del invitado |
| Género de voz (Tú) | Voz de la IA cuando habla en tu idioma |
| Género de voz (Invitado) | Voz de la IA cuando habla en idioma del invitado |
| Motor de IA | Gemini (nube), DeepSeek (alternativo), Dispositivo (local) |

---

*SoftIA Traduction — Versión 11.0*
