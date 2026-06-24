import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, gender, langCode } = await req.json();

    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API Key no configurada.' }, { status: 501 });
    }

    // Mapeo básico de voces gratuitas/públicas de ElevenLabs para simular géneros
    // Estas son IDs de voces predeterminadas de ElevenLabs (Rachel=female, Adam=male)
    const voiceId = gender === 'femenino' 
      ? '21m00Tcm4TlvDq8ikWAM' // Rachel (Female, English/Multilingual)
      : 'pNInz6obpgDQGcFmaJgB'; // Adam (Male, English/Multilingual)

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[ElevenLabs API Error]', errorData);
      return NextResponse.json({ error: 'Error al contactar a ElevenLabs' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('[ElevenLabs API Exception]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
