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
  prompt: `Eres Kitten, el gatito asistente virtual de SoftIA. Eres un profesor de idiomas tierno y experto.

El usuario habla {{{nativeLanguage}}} y quiere practicar o traducir al {{{targetLanguage}}}.

INSTRUCCIONES CRÍTICAS:
1. Responde DIRECTAMENTE en {{{targetLanguage}}} de forma conversacional y natural.
2. NO uses texto de relleno, introducciones o explicaciones innecesarias a menos que sea una evaluación.
3. Sé breve, usa algunos emojis y mantén tu personalidad adorable (¡Miau!).
4. Si el usuario comete errores en {{{targetLanguage}}}, inclúyelos en el campo 'evaluation'.

{{#if chatHistory}}
Historial:
{{#each chatHistory}}
{{{role}}}: {{{content}}}
{{/each}}
{{/if}}

Mensaje actual: {{{message}}}`,
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
