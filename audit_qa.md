# Auditoría Total y Reporte QA - SoftIA Traduction

Este documento presenta una auditoría completa de Experiencia de Usuario (UX) y Quality Assurance (QA) sobre el estado inicial de la aplicación, analizando específicamente los problemas de usabilidad, inconsistencias entre dispositivos y bugs críticos del flujo de la conversación.

## 1. Análisis de Experiencia de Usuario (UX)

### 1.1 Inconsistencias entre Escritorio y Móvil
Se observó una disparidad masiva entre la versión de Escritorio y la versión Móvil/Tablet. 
* **Escritorio:** Disfrutaba de un diseño de pantalla dividida (side-by-side) que permitía ver a ambos interlocutores al mismo tiempo. Al interactuar, el flujo era natural.
* **Móvil:** La interfaz móvil estaba fragmentada. Debido a la falta de espacio, se implementó una vista donde solo el "Hablante Activo" era visible a pantalla completa. Esto obligaba al usuario a "dar un tap" en la parte superior o inferior para cambiar forzosamente la vista, lo cual arruinaba la lectura de mensajes pasados e interrumpía la lógica del turno nativo.

### 1.2 El Problema del Perfil Sobrecargado
El modal de perfil (`ProfileModal.tsx`) fue diseñado inicialmente como un menú de configuración (cambio de Motor IA, voces, idioma). Sin embargo, se sobrecargó al inyectarle todo el **Historial de Conversaciones** sin ningún sistema de paginación. 
* **Impacto UX:** El usuario se enfrentaba a un modal kilométrico sin posibilidad de filtrar.
* **Impacto Técnico:** Al no existir agrupadores, la carga masiva de datos en el DOM del Modal corría el riesgo de colapsar la app cuando el usuario acumulara cientos de mensajes.

## 2. Reporte de Quality Assurance (QA) y Bugs Críticos

### 2.1 Colisiones del Micrófono (Activación "Fantasma")
* **Descripción del Bug:** El micrófono se encendía y apagaba solo de manera errática.
* **Causa Raíz:** Existían colisiones de temporizadores (race conditions) en React. Cuando el usuario daba clic en "Detener Micrófono", el evento `onend` de la API de reconocimiento de voz de Chrome disparaba un intento de reinicio automático asíncrono. Simultáneamente, el motor de `speechSynthesis` finalizaba su turno y disparaba otro cambio de estado, creando un bucle infinito que "secuestraba" el control del micrófono.

### 2.2 Bloqueo de Estado "Aria-Hidden" (Errores de Consola)
* **Descripción del Bug:** La consola se inundaba de errores amarillos de Radix UI (`aria-hidden`).
* **Causa Raíz:** Se presentaba al superponer componentes `Dialog` y `Select` dentro de la barra de navegación. Al abrir el Perfil y luego intentar cambiar un Motor de IA en el Select anidado, Radix UI inyectaba atributos de accesibilidad bloqueantes en el `body`, dejando elementos inactivos si la limpieza del DOM fallaba.

### 2.3 Ausencia de Persistencia Inter-Módulos
* **Descripción del Bug:** No había un sistema universal de memoria. Si salías de `Lectura` o de `Lente AR`, la sesión y las traducciones se perdían. Solo existía un guardado manual limitado a la "Conversación Dual", el cual fallaba al cruzar estados vacíos.

## 3. Plan de Mitigación y Resoluciones Aplicadas

A partir de esta auditoría, se ejecutaron las siguientes soluciones:
1. **Unificación Móvil/Desktop:** Se eliminaron las vistas particionadas en móvil y se reemplazó por un Chat tipo WhatsApp, que se desliza de abajo hacia arriba de forma ininterrumpida.
2. **Historial Inteligente:** Se purgó el Perfil. Se crearon Agrupadores (Kitten Chat, Lectura, Conversación, Lente AR) con popups individuales y la posibilidad de retomar módulos.
3. **Control Asíncrono de Hardware:** Se aisló el `AudioContext` (para evitar estado *suspended* en iOS) y se impidió que el micrófono se auto-encendiera, dándole al usuario el 100% del control manual.
4. **Auto-Save Universal:** Implementación de persistencia automática en `LocalStorage` usando Zustand.
