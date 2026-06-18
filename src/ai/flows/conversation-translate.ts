'use server';
/**
 * @fileOverview Flujo de Genkit optimizado para traducción de conversaciones en tiempo real.
 * Proporciona traducciones puras sin texto de relleno para síntesis de voz.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConversationTranslateInputSchema = z.object({
  text: z.string().describe('El texto capturado por voz.'),
  fromLanguage: z.string().describe('Idioma de origen.'),
  toLanguage: z.string().describe('Idioma de destino.'),
});

const ConversationTranslateOutputSchema = z.object({
  translatedText: z.string().describe('La traducción limpia resultante.'),
});

export type ConversationTranslateOutput = z.infer<typeof ConversationTranslateOutputSchema>;

const conversationPrompt = ai.definePrompt({
  name: 'conversationPrompt',
  input: { schema: ConversationTranslateInputSchema },
  output: { schema: ConversationTranslateOutputSchema },
  prompt: `Eres un traductor de élite de SoftIA. 
Tu misión es traducir el siguiente texto de {{{fromLanguage}}} a {{{toLanguage}}}.

INSTRUCCIONES CRÍTICAS:
1. Entrega ÚNICAMENTE la traducción limpia.
2. NO incluyas comentarios, introducciones, explicaciones o texto de relleno.
3. El resultado será leído por un software de texto a voz, así que mantén la puntuación correcta para una entonación natural.

Texto a traducir: "{{{text}}}"`,
});

export async function translateConversation(input: { 
  text: string; 
  fromLanguage: string; 
  toLanguage: string; 
}): Promise<ConversationTranslateOutput> {
  const { output } = await conversationPrompt(input);
  if (!output) throw new Error('Error en la matriz de traducción espacial.');
  return output;
}
