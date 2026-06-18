'use server';
/**
 * @fileOverview This file implements the Genkit flow for the SoftIA Kitten Assistant,
 * enabling interactive language learning through conversation, translation evaluation,
 * and guided reading support.
 *
 * - aiTutorConversation - The main function to interact with the AI tutor.
 * - AITutorConversationInput - The input type for the aiTutorConversation function.
 * - AITutorConversationOutput - The return type for the aiTutorConversation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Define la estructura de un mensaje en el historial de chat.
 * @typedef {object} ChatMessage
 * @property {'user' | 'model'} role - El rol del remitente del mensaje (usuario o modelo).
 * @property {string} content - El contenido textual del mensaje.
 */
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('El rol del remitente del mensaje: "user" o "model".'),
  content: z.string().describe('El contenido textual del mensaje.'),
});

/**
 * Define el esquema de entrada para la conversación con el SoftIA Kitten Assistant.
 * @typedef {object} AITutorConversationInput
 * @property {string} message - El mensaje actual del usuario.
 * @property {ChatMessage[]} [chatHistory] - Un historial opcional de mensajes previos en la conversación.
 */
const AITutorConversationInputSchema = z.object({
  message: z.string().describe('El mensaje actual del usuario al SoftIA Kitten Assistant.'),
  chatHistory: z.array(ChatMessageSchema)
    .optional()
    .describe('Un historial opcional de mensajes previos en la conversación para mantener el contexto.'),
});
export type AITutorConversationInput = z.infer<typeof AITutorConversationInputSchema>;

/**
 * Define el esquema de salida para la conversación con el SoftIA Kitten Assistant.
 * @typedef {object} AITutorConversationOutput
 * @property {string} response - La respuesta principal del asistente.
 * @property {string} [evaluation] - Una evaluación detallada si el usuario solicitó traducción o apoyo de lectura.
 * @property {string} [suggestion] - Una sugerencia o consejo para mejorar, si es aplicable.
 */
const AITutorConversationOutputSchema = z.object({
  response: z.string().describe('La respuesta principal del SoftIA Kitten Assistant al usuario.'),
  evaluation: z.string()
    .optional()
    .describe('Una evaluación detallada proporcionada por el asistente si el usuario solicitó evaluación de traducción o apoyo de lectura.'),
  suggestion: z.string()
    .optional()
    .describe('Una sugerencia o consejo del asistente para mejorar el aprendizaje, si es aplicable.'),
});
export type AITutorConversationOutput = z.infer<typeof AITutorConversationOutputSchema>;

/**
 * Define el prompt para el SoftIA Kitten Assistant. Este prompt establece la persona del asistente
 * y guía al modelo para procesar mensajes de conversación, evaluar traducciones y ofrecer soporte de lectura.
 * Utiliza Handlebars para incluir el historial de chat y el mensaje actual del usuario.
 */
const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: AITutorConversationOutputSchema },
  // El contenido del prompt utiliza Handlebars para construir dinámicamente la conversación.
  // Las instrucciones al modelo le indican que mantenga la persona del asistente y genere JSON estructurado.
  prompt: `Eres el SoftIA Kitten Assistant, un tutor y compañero de aprendizaje de idiomas experto y amigable.
Tu objetivo es ayudar a los usuarios a aprender nuevos idiomas mediante:
1.  Evaluación de sus intentos de traducción.
2.  Proporcionar apoyo de lectura guiada.
3.  Practicar habilidades de conversación.
Sé alentador, claro y comprensivo. Usa un lenguaje sencillo.

{{#if chatHistory}}
    Este es el historial de la conversación:
    {{#each chatHistory}}
        {{#if (eq this.role "user")}} 
            Usuario: {{{this.content}}}
        {{else}}
            Asistente: {{{this.content}}}
        {{/if}}
    {{/each}}
{{/if}}

El mensaje actual del usuario es:
Usuario: {{{message}}}

Basado en la conversación anterior y el último mensaje del usuario, por favor proporciona una respuesta.
Si el usuario está pidiendo una evaluación de traducción o ayuda de lectura, incluye campos 'evaluation' y 'suggestion' en tu respuesta JSON.
De lo contrario, solo proporciona un campo 'response'.

Tu salida DEBE ser un objeto JSON que se ajuste estrictamente al siguiente esquema:
\`\`\`json
{{jsonSchema AITutorConversationOutputSchema}}
\`\`\`
`,
});

/**
 * Define el flujo de Genkit para la conversación con el SoftIA Kitten Assistant.
 * Este flujo toma la entrada del usuario y el historial de chat, invoca el prompt
 * del asistente y devuelve la respuesta estructurada.
 */
const aiTutorConversationFlow = ai.defineFlow(
  {
    name: 'aiTutorConversationFlow',
    inputSchema: AITutorConversationInputSchema,
    outputSchema: AITutorConversationOutputSchema,
  },
  async (input) => {
    // Invoca el prompt definido, pasando la entrada completa del usuario.
    // El prompt se encarga de construir la entrada para el modelo, incluyendo el historial de chat.
    const { output } = await aiTutorConversationPrompt(input);

    // Asegúrate de que la salida no sea nula y devuélvela.
    if (!output) {
      throw new Error('El SoftIA Kitten Assistant no pudo generar una respuesta.');
    }
    return output;
  }
);

/**
 * Función wrapper para interactuar con el SoftIA Kitten Assistant.
 * @param {AITutorConversationInput} input - Los datos de entrada para la conversación.
 * @returns {Promise<AITutorConversationOutput>} - La respuesta estructurada del asistente.
 */
export async function aiTutorConversation(
  input: AITutorConversationInput
): Promise<AITutorConversationOutput> {
  return aiTutorConversationFlow(input);
}
