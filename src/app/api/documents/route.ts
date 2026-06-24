import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
// @ts-ignore
const pdfParse = require('pdf-parse');

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetLanguage = formData.get('targetLanguage') as string || 'Inglés';

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.type === 'application/pdf') {
      // Usar pdf-parse para PDF
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (file.type.startsWith('image/')) {
      // Usar Gemini para extracción de texto (OCR) desde fotos
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64Data}`;
      
      const response = await ai.generate({
        prompt: [
          { media: { url: dataUrl } },
          { text: "Extract all the text from this image. Output only the exact text as written, without any formatting or markdown, keeping the original paragraphs and structure." }
        ]
      });
      
      extractedText = response.text || '';
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Usa PDF o imágenes (JPG/PNG).' }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No se pudo extraer texto del archivo.' }, { status: 400 });
    }

    // Traducir el texto usando Gemini
    const translationResponse = await ai.generate({
      prompt: `Traduce el siguiente texto al ${targetLanguage}. Mantén el formato y la estructura original lo más fiel posible.\n\nTexto original:\n${extractedText.trim()}`
    });

    return NextResponse.json({ 
      original: extractedText.trim(),
      translated: translationResponse.text || ''
    });
  } catch (error: any) {
    console.error('Error procesando el documento:', error);
    return NextResponse.json({ error: 'Ocurrió un error al procesar el archivo.' }, { status: 500 });
  }
}
