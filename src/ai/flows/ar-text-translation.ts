'use server';
/**
 * @fileOverview Flujo de Genkit para la lente de visión AR con detección espacial.
 * Detecta múltiples bloques de texto, los traduce y asigna coordenadas (x, y).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectionSchema = z.object({
  originalText: z.string().describe('El texto original detectado.'),
  translatedText: z.string().describe('La traducción al español.'),
  x: z.number().describe('Coordenada X sugerida (0-100) para el HUD.'),
  y: z.number().describe('Coordenada Y sugerida (0-100) para el HUD.'),
});

const ARTextTranslationInputSchema = z.object({
  photoDataUri: z.string().describe("Imagen en base64: 'data:<mimetype>;base64,<data>'"),
  targetLanguage: z.string().default('Español'),
});

const ARTextTranslationOutputSchema = z.object({
  detections: z.array(DetectionSchema).describe('Lista de textos detectados con su posición espacial.'),
});

export type ARTextTranslationOutput = z.infer<typeof ARTextTranslationOutputSchema>;

const spatialTranslatePrompt = ai.definePrompt({
  name: 'spatialTranslatePrompt',
  input: { schema: ARTextTranslationInputSchema },
  output: { schema: ARTextTranslationOutputSchema },
  prompt: `Eres un sistema de Visión AR de última generación. 
Analiza la imagen adjunta e identifica bloques de texto en idiomas extranjeros.
Tradúcelos al {{{targetLanguage}}}.
Para cada bloque, estima su posición espacial en la imagen como porcentajes (X e Y del 0 al 100).

Imagen: {{media url=photoDataUri}}

Devuelve una lista limpia de detecciones.`,
});

export async function arTextTranslation(input: { photoDataUri: string; targetLanguage: string }): Promise<ARTextTranslationOutput> {
  const { output } = await spatialTranslatePrompt(input);
  if (!output) throw new Error('No se detectó texto en el cuadrante espacial.');
  return output;
}
