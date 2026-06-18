'use server';
/**
 * @fileOverview Implementación del flujo de Genkit para el SoftIA Kitten Assistant.
 * Configura la personalidad de un gatito profesor de idiomas espacial y tierno.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Esquema para estructurar los mensajes del historial
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('El rol del remitente del mensaje: "user" o "model".'),
  content: z.string().describe('El contenido textual del mensaje.'),
});

// Esquema de entrada para el flujo de la conversación
const AITutorConversationInputSchema = z.object({
  message: z.string().describe('El mensaje actual enviado por el usuario.'),
  chatHistory: z.array(ChatMessageSchema)
    .optional()
    .describe('Historial acumulado para mantener el contexto de la conversación.'),
});
export type AITutorConversationInput = z.infer<typeof AITutorConversationInputSchema>;

// Esquema de salida estructurada garantizada por el modelo
const AITutorConversationOutputSchema = z.object({
  response: z.string().describe('La respuesta adaptada y tierna de Kitten.'),
  evaluation: z.string().optional().describe('Evaluación gramatical si corresponde.'),
  suggestion: z.string().optional().describe('Sugerencia proactiva para mejorar.'),
});
export type AITutorConversationOutput = z.infer<typeof AITutorConversationOutputSchema>;

/**
 * Prompt del sistema que define la personalidad exacta de Kitten:
 * Tierno, breve, paciente, espacial, usa emojis y realiza sonidos gatunos.
 */
const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: AITutorConversationOutputSchema },
  prompt: `Eres Kitten, el gatito asistente virtual de SoftIA. Eres un profesor de idiomas tierno, paciente y espacial. Respondes de forma breve, usas muchos emojis y maúllas (¡Miau!, ¡Prrr!) ocasionalmente para motivar al alumno.

{{#if chatHistory}}
Historial de nuestra conversación espacial:
{{#each chatHistory}}
  {{#if (eq this.role "user")}}Usuario: {{{this.content}}}{{else}}Kitten: {{{this.content}}}{{/if}}
{{/each}}
{{/if}}

Mensaje actual del estudiante: {{{message}}}

Por favor responde de acuerdo con tu personalidad adorable en el campo 'response'. Si te piden evaluar una traducción o escritura, llena los campos opcionales de 'evaluation' y 'suggestion'.`,
});

/**
 * Flujo ejecutable de Genkit que procesa la conversación de tutoría.
 */
export async function aiTutorConversation(
  input: AITutorConversationInput
): Promise<AITutorConversationOutput> {
  const { output } = await aiTutorConversationPrompt(input);
  if (!output) {
    throw new Error('Kitten se distrajo persiguiendo un asteroide. Intenta de nuevo.');
  }
  return output;
}
