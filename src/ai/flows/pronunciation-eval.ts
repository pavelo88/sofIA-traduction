'use server';
/**
 * @fileOverview Flujo de Genkit para la evaluación de pronunciación.
 * Compara una frase objetivo con la transcripción del usuario y devuelve feedback detallado.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WordFeedbackSchema = z.object({
  word: z.string().describe('La palabra de la frase original.'),
  correct: z.boolean().describe('Si la palabra fue pronunciada correctamente según la transcripción.'),
});

const PronunciationEvalInputSchema = z.object({
  targetSentence: z.string().describe('La frase que el usuario debía leer.'),
  transcription: z.string().describe('Lo que el sistema de reconocimiento de voz capturó.'),
});

const PronunciationEvalOutputSchema = z.object({
  grade: z.string().describe('Calificación de la sesión (A+, B, C, etc.).'),
  accuracy: z.number().describe('Porcentaje de precisión (0-100).'),
  words: z.array(WordFeedbackSchema).describe('Lista de palabras con su estado de corrección.'),
});

export type PronunciationEvalOutput = z.infer<typeof PronunciationEvalOutputSchema>;

const pronunciationPrompt = ai.definePrompt({
  name: 'pronunciationPrompt',
  input: { schema: PronunciationEvalInputSchema },
  output: { schema: PronunciationEvalOutputSchema },
  prompt: `Eres un experto evaluador de fonética inglesa y profesor de idiomas.
Tu tarea es comparar la "Frase Objetivo" con la "Transcripción del Usuario".

Frase Objetivo: "{{{targetSentence}}}"
Transcripción del Usuario: "{{{transcription}}}"

Instrucciones:
1. Analiza qué palabras de la frase objetivo fueron pronunciadas correctamente, cuáles se omitieron o se dijeron mal.
2. Sé justo pero motivador.
3. Genera una calificación académica (A+, A, B, C, D, F).
4. Calcula un porcentaje de precisión exacto.
5. Devuelve el JSON con el desglose palabra por palabra.

Kitten dice: ¡Hazlo con amor espacial! 🐱🚀`,
});

export async function evaluatePronunciation(input: { targetSentence: string; transcription: string }): Promise<PronunciationEvalOutput> {
  try {
    const { output } = await pronunciationPrompt(input);
    if (!output) {
      return { grade: 'N/A', accuracy: 0, words: [] };
    }
    return output;
  } catch (error: any) {
    console.error("[SoftIA Genkit] Error:", error.message || error);
    return {
      grade: 'ERR',
      accuracy: 0,
      words: [{ word: "Error de API Gemini", correct: false }]
    };
  }
}
