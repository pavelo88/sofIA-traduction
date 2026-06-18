import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración central de Genkit.
 * Se asegura de utilizar el plugin de Google AI y un modelo estable.
 */

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Utilizamos gemini-1.5-flash por ser el estándar más estable y rápido para traducciones.
  model: 'googleai/gemini-1.5-flash',
});
