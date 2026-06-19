'use server';
/**
 * @fileOverview Implementación mejorada del flujo de Genkit para Kitten Assistant.
 * Soporta selección dinámica de idiomas y respuestas puramente conversacionales.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('El rol del remitente.'),
  content: z.string().describe('El contenido textual.'),
});

const AITutorConversationInputSchema = z.object({
  message: z.string().describe('Mensaje actual del usuario.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('Historial acumulado.'),
  nativeLanguage: z.string().default('Español').describe('Idioma nativo del usuario.'),
  targetLanguage: z.string().default('Inglés').describe('Idioma que el usuario desea aprender.'),
});
export type AITutorConversationInput = z.infer<typeof AITutorConversationInputSchema>;

const AITutorConversationOutputSchema = z.object({
  response: z.string().describe('La respuesta directa y natural de Kitten.'),
  evaluation: z.string().optional().describe('Evaluación gramatical si corresponde.'),
  suggestion: z.string().optional().describe('Sugerencia para mejorar.'),
});
export type AITutorConversationOutput = z.infer<typeof AITutorConversationOutputSchema>;

const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: AITutorConversationOutputSchema },
  prompt: `Eres Kitten, el gatito asistente virtual de SoftIA. Eres un tutor de idiomas extremadamente tierno, inteligente y bilingüe.

El usuario habla nativamente {{{nativeLanguage}}} y desea aprender o practicar {{{targetLanguage}}}.

Tus objetivos son:
1. Responder de forma dinámica e inteligente. Debes usar tanto {{{nativeLanguage}}} como {{{targetLanguage}}}.
2. Si el usuario te habla en {{{nativeLanguage}}}, respóndele saludando, explicando las cosas o haciendo preguntas en {{{nativeLanguage}}} (para que te entienda), pero incluye frases u oraciones clave de práctica en {{{targetLanguage}}} para enseñarle.
3. Si el usuario te habla en {{{targetLanguage}}}, felicítalo, responde en {{{targetLanguage}}} para mantener la conversación, y luego explícale brevemente en {{{nativeLanguage}}} lo que significa o cómo puede mejorar.
4. Explica siempre cómo interactuar contigo en el idioma nativo del usuario ({{{nativeLanguage}}}).
5. Sé adorable (¡Miau!), usa emojis y mantén tus respuestas concisas pero altamente educativas.

Si el usuario comete errores en {{{targetLanguage}}}, detecta el error y descríbelo en el campo 'evaluation' en {{{nativeLanguage}}}, y pon la sugerencia corregida en el campo 'suggestion'.

{{#if chatHistory}}
Historial de conversación:
{{#each chatHistory}}
{{{role}}}: {{{content}}}
{{/each}}
{{/if}}

Mensaje actual: {{{message}}}`
});

export async function aiTutorConversation(
  input: AITutorConversationInput
): Promise<AITutorConversationOutput> {
  const { output } = await aiTutorConversationPrompt(input);
  if (!output) {
    throw new Error('Kitten se distrajo persiguiendo un asteroide.');
  }
  return output;
}
