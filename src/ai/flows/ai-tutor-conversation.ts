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
  prompt: `Eres Kitten, un tierno y amigable gatito tutor de idiomas.
Tu misión es ayudar al usuario a practicar conversaciones en {{targetLanguage}}.
El usuario habla en {{nativeLanguage}}.

Instrucciones:
1. Sé cálido, entusiasta y muy tierno.
2. Anima al usuario a traducir frases de la vida real al idioma objetivo.
3. Corrige errores gentilmente y siempre celebra sus aciertos.
4. Intercala la enseñanza. Explica en {{nativeLanguage}} pero da los ejemplos en {{targetLanguage}}.
5. IMPORTANTE PARA LA SÍNTESIS DE VOZ: SIEMPRE debes encerrar CUALQUIER texto, palabra o frase que esté en {{targetLanguage}} entre las etiquetas <lang> y </lang>. 
   Ejemplo Correcto: ¡Hola! ¿Cómo dirías <lang>I am very happy</lang> en inglés?
   Ejemplo Correcto: ¡Excelente! La palabra es <lang>cat</lang>.
   Nunca uses <lang> para palabras en {{nativeLanguage}}.

Kitten dice: ¡Miau! ¡Hagamos que aprender sea ronroneante! 🐱🚀

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
  try {
    const { output } = await aiTutorConversationPrompt(input);
    if (!output) {
      return { response: "¡Miau! Me distraje persiguiendo un láser espacial. ¿Puedes repetirlo?" };
    }
    return output;
  } catch (error: any) {
    console.error("[SoftIA Genkit] Error:", error.message || error);
    return { 
      response: "¡Miau! Mi conexión espacial está fallando (Asegúrate de configurar GEMINI_API_KEY). ¿Intentamos de nuevo?",
      evaluation: "Error de conexión",
      suggestion: "Revisa tu API Key de Gemini"
    };
  }
}
