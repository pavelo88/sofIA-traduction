import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración central de Genkit.
 * Asegura el uso de la clave de API correcta para los modelos de Google AI.
 */

// Intentamos capturar la clave de múltiples fuentes para máxima compatibilidad
const apiKey = process.env.GEMINI_API_KEY || 
               process.env.GOOGLE_GENAI_API_KEY || 
               process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Utilizamos gemini-1.5-flash para balancear velocidad y precisión
  model: 'googleai/gemini-1.5-flash',
});
