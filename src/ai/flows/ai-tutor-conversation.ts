'use server';
/**
 * @fileOverview Implementación mejorada del flujo de Genkit para SoftIA Amigo.
 * Soporta selección dinámica de idiomas y respuestas puramente conversacionales sin tono educativo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']).describe('El rol del remitente.'),
  content: z.string().describe('El contenido textual.'),
});

const TranslatorHistoryItemSchema = z.object({
  from: z.string(),
  to: z.string(),
  original: z.string(),
  translated: z.string()
});

const AITutorConversationInputSchema = z.object({
  message: z.string().describe('Mensaje actual del usuario.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('Historial acumulado.'),
  translatorHistory: z.array(TranslatorHistoryItemSchema).optional().describe('Historial de traducción para contexto.'),
  nativeLanguage: z.string().default('Español').describe('Idioma nativo del usuario.'),
  targetLanguage: z.string().default('Inglés').describe('Idioma que el usuario desea aprender.'),
});
export type AITutorConversationInput = z.infer<typeof AITutorConversationInputSchema>;

const AITutorConversationOutputSchema = z.object({
  response: z.string().describe('La respuesta directa y natural de SoftIA.'),
  setVoiceGender: z.enum(['masculino', 'femenino']).optional().describe('Si el usuario pide cambiar el género de la voz, devuelve el nuevo género aquí.'),
});
export type AITutorConversationOutput = z.infer<typeof AITutorConversationOutputSchema>;

const aiTutorConversationPrompt = ai.definePrompt({
  name: 'aiTutorConversationPrompt',
  input: { schema: AITutorConversationInputSchema },
  output: { schema: AITutorConversationOutputSchema },
  prompt: `Eres SoftIA, un asistente inteligente y amigable.
Tu misión es conversar naturalmente con el usuario como un amigo inteligente.
El usuario habla en {{nativeLanguage}} y puede que quiera practicar o hablar en {{targetLanguage}}, pero NO eres un profesor aburrido.

Instrucciones:
1. Sé cálido, interesante y casual. NO uses emojis, destellos (✨) ni caracteres especiales, ya que el sintetizador de voz los lee de forma extraña.
2. Mantén la conversación fluida haciendo preguntas interesantes relacionadas con el tema.
3. IMPORTANTE PARA LA SÍNTESIS DE VOZ BILINGÜE: SIEMPRE debes encerrar CUALQUIER texto, palabra o frase que esté en el idioma {{targetLanguage}} entre las etiquetas <lang> y </lang>, sin importar de qué idioma se trate (Francés, Alemán, Inglés, etc.).
   Ejemplo: ¡Hola! Me encanta esa idea. En {{targetLanguage}} sería <lang>frase en el idioma objetivo</lang>.
   Nunca uses <lang> para palabras en {{nativeLanguage}}.
4. CAMBIO DE VOZ: Si el usuario te pide cambiar la voz a masculino o femenino (ej: "habla como hombre", "cambia tu voz a mujer"), respóndele de forma natural que has cambiado la voz y ASEGÚRATE de devolver la propiedad 'setVoiceGender' con el valor correspondiente.

{{#if translatorHistory}}
CONTEXTO RECIENTE DE TRADUCCIÓN DEL USUARIO CON SU INVITADO:
El usuario acaba de tener esta conversación usando la app de traducción. Las palabras que el invitado le dijo están aquí:
{{#each translatorHistory}}
- [{{{from}}}]: {{{original}}} -> [{{{to}}}]: {{{translated}}}
{{/each}}
Utiliza estas palabras si el usuario pide repasar lo que su invitado le acaba de decir.
{{/if}}

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
      return { response: "Tuve una pequeña interrupción. ¿Puedes repetirlo?" };
    }
    return output;
  } catch (error: any) {
    console.error("[SoftIA Genkit] Error:", error.message || error);
    return { 
      response: "Mi conexión está fallando. ¿Intentamos de nuevo?",
    };
  }
}
