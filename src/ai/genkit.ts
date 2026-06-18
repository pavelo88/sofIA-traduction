import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración central de Genkit (Servidor).
 * Forzamos la lectura de la clave de API desde el entorno en cada inicialización.
 */

const apiKey = process.env.GOOGLE_GENAI_API_KEY || 
               process.env.GEMINI_API_KEY || 
               process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error("❌ ERROR CRÍTICO: No se encontró GOOGLE_GENAI_API_KEY en el entorno.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
