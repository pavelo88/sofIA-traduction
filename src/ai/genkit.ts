import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración central de Genkit.
 * Se asegura de capturar la clave de API desde el entorno del servidor.
 */

const apiKey = process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_GENAI_API_KEY || 
               process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Advertencia: No se detectó ninguna clave de API para Genkit. Revisa tu archivo .env");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Utilizamos gemini-1.5-flash para máxima velocidad en el MVP
  model: 'googleai/gemini-1.5-flash',
});
