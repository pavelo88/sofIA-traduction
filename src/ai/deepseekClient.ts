
/**
 * @fileOverview Cliente de IA DeepSeek para traducciones de bajo costo.
 */

export async function callDeepSeekBackup(text: string, fromLang: string, toLang: string) {
  const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY no configurada.');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `Traduce de forma limpia y conversacional de ${fromLang} a ${toLang} el siguiente texto. No agregues introducciones, comentarios ni texto de relleno. Solo devuelve la traducción directa y pura.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error en DeepSeek API: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const translatedText = data.choices[0]?.message?.content?.trim() || '';

  // Emulamos la estructura de salida de Genkit para interoperabilidad
  return {
    translatedText: translatedText
  };
}
