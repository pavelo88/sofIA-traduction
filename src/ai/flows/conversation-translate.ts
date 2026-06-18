'use server';
/**
 * @fileOverview Flujo de Genkit para la traducción de conversaciones en tiempo real.
 * Detecta el idioma y traduce bidireccionalmente entre Inglés y Español.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConversationTranslateInputSchema = z.object({
  text: z.string().describe('El texto capturado por voz.'),
  targetLanguage: z.string().describe('El idioma al que se desea traducir (ej. "Spanish" o "English").'),
});

const ConversationTranslateOutputSchema = z.object({
  translatedText: z.string().describe('La traducción resultante.'),
  detectedLanguage: z.string().describe('El idioma detectado originalmente.'),
});

export type ConversationTranslateOutput = z.infer<typeof ConversationTranslateOutputSchema>;

const conversationPrompt = ai.definePrompt({
  name: 'conversationPrompt',
  input: { schema: ConversationTranslateInputSchema },
  output: { schema: ConversationTranslateOutputSchema },
  prompt: `Eres un traductor de élite integrado en el asistente espacial Kitten.
Tu misión es traducir el siguiente texto al idioma: {{{targetLanguage}}}.

Texto: "{{{text}}}"

Instrucciones:
1. Mantén el tono natural y fluido de una conversación.
2. Detecta el idioma original con precisión.
3. Si el texto ya está en el idioma objetivo, devuélvelo igual pero asegúrate de que sea gramaticalmente perfecto.

Kitten dice: ¡Traducción lista para el despegue! 🚀`,
});

export async function translateConversation(input: { text: string; targetLanguage: string }): Promise<ConversationTranslateOutput> {
  const { output } = await conversationPrompt(input);
  if (!output) throw new Error('Error en la matriz de traducción espacial.');
  return output;
}
