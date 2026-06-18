'use server';
/**
 * @fileOverview Un flujo de Genkit para la lente de visión AR que detecta y traduce texto de una imagen.
 *
 * - arTextTranslation - Una función que maneja el proceso de traducción de texto AR.
 * - ARTextTranslationInput - El tipo de entrada para la función arTextTranslation.
 * - ARTextTranslationOutput - El tipo de retorno para la función arTextTranslation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @summary Esquema de entrada para la función de traducción de texto AR.
 * @property {string} photoDataUri - La imagen del texto a traducir, en formato URI de datos con codificación Base64.
 * @property {string} targetLanguage - El idioma al que se debe traducir el texto detectado.
 */
const ARTextTranslationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Una foto del texto, como un URI de datos que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z
    .string()
    .describe('El idioma al que se debe traducir el texto detectado en la imagen. Ejemplo: "Español".'),
});
export type ARTextTranslationInput = z.infer<typeof ARTextTranslationInputSchema>;

/**
 * @summary Esquema de salida para la función de traducción de texto AR.
 * @property {string} originalText - El texto original detectado en la imagen.
 * @property {string} translatedText - El texto traducido al idioma objetivo.
 */
const ARTextTranslationOutputSchema = z.object({
  originalText: z.string().describe('El texto original detectado en la imagen.'),
  translatedText: z.string().describe('El texto traducido al idioma objetivo.'),
});
export type ARTextTranslationOutput = z.infer<typeof ARTextTranslationOutputSchema>;

/**
 * @summary Función principal para realizar la traducción de texto AR.
 * @param {ARTextTranslationInput} input - Los datos de entrada que incluyen la imagen y el idioma objetivo.
 * @returns {Promise<ARTextTranslationOutput>} - Una promesa que resuelve con el texto original y el traducido.
 */
export async function arTextTranslation(
  input: ARTextTranslationInput
): Promise<ARTextTranslationOutput> {
  return arTextTranslationFlow(input);
}

/**
 * @summary Define el prompt de Genkit para la detección de texto (OCR) y traducción.
 * Este prompt utiliza el modelo Gemini para actuar como un sistema de OCR y traducción de respaldo en la nube.
 * La lógica es detectar texto de una imagen (via photoDataUri) y traducirlo al idioma objetivo (targetLanguage).
 * Esto simula el "fallback a la nube" para cuando la IA en el dispositivo no puede procesar o para casos complejos.
 */
const translateImagePrompt = ai.definePrompt({
  name: 'translateImagePrompt',
  input: {schema: ARTextTranslationInputSchema},
  output: {schema: ARTextTranslationOutputSchema},
  prompt: `Eres un sistema experto en reconocimiento óptico de caracteres (OCR) y traducción, actuando como un potente respaldo en la nube para una aplicación de Visión AR.
Tu tarea es extraer con precisión todo el texto de la imagen proporcionada y luego traducirlo al idioma objetivo especificado.
Debes priorizar la precisión y la exhaustividad, especialmente para textos desafiantes que se encuentran en escenarios del mundo real.

Imagen a procesar: {{media url=photoDataUri}}
Idioma objetivo para la traducción: {{{targetLanguage}}}`,
});

/**
 * @summary Define el flujo de Genkit para la traducción de texto AR.
 * Este flujo invoca el prompt `translateImagePrompt` con la imagen de entrada y el idioma objetivo,
 * y devuelve el texto original detectado junto con su traducción.
 * Este flujo representa la parte de "Gemini como respaldo en la nube" de la historia de usuario.
 */
const arTextTranslationFlow = ai.defineFlow(
  {
    name: 'arTextTranslationFlow',
    inputSchema: ARTextTranslationInputSchema,
    outputSchema: ARTextTranslationOutputSchema,
  },
  async input => {
    // Llama al prompt definido para realizar el OCR y la traducción.
    // La entrada incluye la URI de datos de la foto y el idioma al que se debe traducir.
    const {output} = await translateImagePrompt(input);
    // Asegura que la salida no sea nula antes de devolverla.
    // La salida contiene el texto original detectado y su traducción.
    return output!;
  }
);
