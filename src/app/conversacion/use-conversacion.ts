'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { translateConversation } from '@/ai/flows/conversation-translate';
import { callDeepSeekBackup } from '@/ai/deepseekClient';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export type ChatItem = {
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: Date;
};

/**
 * Traduce localmente usando la API de Traducción integrada de Chrome (window.translation)
 * o el modelo local Gemini Nano (window.ai.languageModel).
 * Si no están disponibles, hace un fallback al traductor del servidor.
 */
async function translateOnDevice(text: string, fromLangName: string, toLangName: string): Promise<string> {
  const codeMap: Record<string, string> = {
    "Español": "es", "Inglés": "en", "Francés": "fr", "Alemán": "de",
    "Portugués": "pt", "Italiano": "it", "Chino": "zh", "Japonés": "ja",
    "Árabe": "ar", "Ruso": "ru"
  };
  const fromCode = codeMap[fromLangName] || 'en';
  const toCode = codeMap[toLangName] || 'es';

  // 1. Intentar API de Traducción integrada de Chrome (window.translation)
  if (typeof window !== 'undefined' && 'translation' in window) {
    try {
      const translationAPI = (window as any).translation;
      const capabilities = await translationAPI.canTranslate({
        sourceLanguage: fromCode,
        targetLanguage: toCode,
      });
      if (capabilities !== 'no') {
        const translator = await translationAPI.createTranslator({
          sourceLanguage: fromCode,
          targetLanguage: toCode,
        });
        const result = await translator.translate(text);
        return result;
      }
    } catch (e) {
      console.warn('[SoftIA Device AI] Error en window.translation:', e);
    }
  }

  // 2. Intentar API de Gemini Nano integrada (window.ai)
  if (typeof window !== 'undefined' && 'ai' in window && 'languageModel' in (window as any).ai) {
    try {
      const session = await (window as any).ai.languageModel.create({
        systemPrompt: `Eres un traductor veloz y preciso de ${fromLangName} a ${toLangName}. Traduce el siguiente texto de forma directa, sin explicaciones ni introducciones. Texto: "${text}"`
      });
      const result = await session.prompt(text);
      return result.trim();
    } catch (e) {
      console.warn('[SoftIA Device AI] Error en window.ai (Gemini Nano):', e);
    }
  }

  // 3. Fallback: Usar Genkit/Gemini pero marcarlo como simulación local para no romper la experiencia
  try {
    const result = await translateConversation({ text, fromLanguage: fromLangName, toLanguage: toLangName });
    return result.translatedText;
  } catch (err) {
    console.warn('[SoftIA Fallback] Error en fallback de traducción local:', err);
    return `[Local] ${text}`;
  }
}

/**
 * @summary Hook de lógica de negocio para Conversación Dual.
 * Refactorización v9.1: Motor de voz ultra robusto con prevención de solapamiento y auto-turno.
 */
export function useConversacion() {
  const {
    nativeLanguage,
    targetLanguage,
    userVoiceGender,
    partnerVoiceGender,
    aiEngineMode,
    userCredits,
    addCredits,
    setIsProfileOpen
  } = useStore();

  const { user } = useUser();
  const isGuest = useMemo(() => !user?.uid || user.uid.startsWith('guest-session'), [user?.uid]);

  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);

  // Refs para acceder a los valores actuales dentro de callbacks sin re-crear recognition
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null); // Sostiene la instancia de reconocimiento activa
  const isNativeTurnRef = useRef(isNativeTurn);
  const nativeLangRef = useRef(nativeLanguage);
  const targetLangRef = useRef(targetLanguage);
  const aiEngineModeRef = useRef(aiEngineMode);
  const userCreditsRef = useRef(userCredits);
  const isGuestRef = useRef(isGuest);
  const isProcessingRef = useRef(isProcessing);

  // Mantener refs sincronizadas con el estado
  useEffect(() => { isNativeTurnRef.current = isNativeTurn; }, [isNativeTurn]);
  useEffect(() => { nativeLangRef.current = nativeLanguage; }, [nativeLanguage]);
  useEffect(() => { targetLangRef.current = targetLanguage; }, [targetLanguage]);
  useEffect(() => { aiEngineModeRef.current = aiEngineMode; }, [aiEngineMode]);
  useEffect(() => { userCreditsRef.current = userCredits; }, [userCredits]);
  useEffect(() => { isGuestRef.current = isGuest; }, [isGuest]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  const langMap: Record<string, string> = {
    "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
    "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
    "Árabe": "ar-SA", "Ruso": "ru-RU"
  };

  /**
   * Crea y arranca una nueva instancia de SpeechRecognition.
   * Evita solapamientos abortando de forma limpia cualquier instancia previa.
   */
  const startListening = useCallback(() => {
    if (isProcessingRef.current) return;

    // Si la síntesis de voz está hablando, posponer el inicio del micrófono
    // para evitar capturar el propio audio de salida (feedback loop).
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      console.warn('[SoftIA Voice] Retrasando inicio de micrófono por síntesis de voz activa...');
      setTimeout(() => startListening(), 500);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Micrófono no disponible", description: "Tu navegador no soporta reconocimiento de voz." });
      return;
    }

    // Abortar limpia de cualquier instancia previa activa antes de iniciar
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('[SoftIA Voice] Error al abortar reconocimiento previo:', e);
      }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const currentLang = isNativeTurnRef.current ? nativeLangRef.current : targetLangRef.current;
    recognition.lang = langMap[currentLang] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && !isProcessingRef.current) {
        await handleTranslationInternal(transcript);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognition.onerror = (e: any) => {
      setIsRecording(false);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        console.warn('[SoftIA Voice] Error de reconocimiento:', e.error);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.warn('[SoftIA Voice] Error al iniciar recognition, reintentando...', err);
      try {
        recognition.stop();
      } catch (e) {}
      setTimeout(() => {
        try {
          recognition.start();
        } catch (retryErr) {
          console.error('[SoftIA Voice] Fallo crítico al iniciar micrófono:', retryErr);
        }
      }, 300);
    }
  }, []);

  /**
   * Inicia síntesis de voz y activa el micrófono del siguiente hablante al terminar.
   * Implementa M2: auto-turno real.
   */
  const speakAndAutoTurn = useCallback((text: string, langName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // Sin TTS: cambiar turno directamente
      setIsNativeTurn(prev => !prev);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = langMap[langName] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const targetGender = isNativeTurnRef.current ? partnerVoiceGender : userVoiceGender;

    const voice = voices.find(v => {
      const isLangMatch = v.lang.startsWith(langCode.split('-')[0]);
      const genderRegex = targetGender === 'femenino'
        ? /female|woman|zira|samantha|helena|laura|google/i
        : /male|man|david|mark|pablo|sergio/i;
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      setIsSpeaking(false);
      // Cambiar el turno al siguiente hablante
      setIsNativeTurn(prev => !prev);
      // Auto-iniciar el micrófono del siguiente hablante después de una pausa breve
      setTimeout(() => {
        startListening();
      }, 600);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsNativeTurn(prev => !prev);
    };

    window.speechSynthesis.speak(utterance);
  }, [partnerVoiceGender, userVoiceGender, startListening]);

  /**
   * Lógica de traducción separada en función interna para ser llamable desde startListening.
   */
  const handleTranslationInternal = async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setIsRecording(false);

    const fromLang = isNativeTurnRef.current ? nativeLangRef.current : targetLangRef.current;
    const toLang = isNativeTurnRef.current ? targetLangRef.current : nativeLangRef.current;

    try {
      let translatedText = "";

      if (aiEngineModeRef.current === 'gemini') {
        if (!isGuestRef.current && userCreditsRef.current <= 0) {
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", variant: "destructive" });
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
        if (!isGuestRef.current) addCredits(-1);
        const result = await translateConversation({ text, fromLanguage: fromLang, toLanguage: toLang });
        translatedText = result.translatedText;
      } else if (aiEngineModeRef.current === 'deepseek') {
        const result = await callDeepSeekBackup(text, fromLang, toLang);
        translatedText = result.translatedText;
      } else {
        // En modo 'device' (Local AI), usamos el traductor on-device con fallbacks reales
        translatedText = await translateOnDevice(text, fromLang, toLang);
      }

      const newItem: ChatItem = {
        original: text,
        translated: translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);

      // Hablar la traducción y auto-cambiar turno
      speakAndAutoTurn(translatedText, toLang);

    } catch (error) {
      console.error("[SoftIA Engine] Error:", error);
      toast({ title: "Error de Motor", description: "Reintenta en un momento." });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  /**
   * Toggle principal del micrófono.
   */
  const toggleSession = useCallback(() => {
    if (isRecording) {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.warn('[SoftIA Voice] Error aborting recognition in toggleSession:', err);
        }
        recognitionRef.current = null;
      }
      setIsRecording(false);
      setIsSpeaking(false);
    } else {
      startListening();
    }
  }, [isRecording, startListening]);

  /**
   * Cambia el turno de forma manual restableciendo cualquier grabación o reproducción activa.
   */
  const toggleTurn = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsSpeaking(false);
    setIsNativeTurn(prev => !prev);
  }, []);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Gestión de cámara AR
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => { activeStream = stream; streamRef.current = stream; })
        .catch(() => setIsCameraActive(false));
    }
    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [isCameraActive]);

  return {
    isNativeTurn, isRecording, isProcessing, isSpeaking,
    isCameraActive, setIsCameraActive,
    history, toggleSession, toggleTurn, startListening, streamRef,
    nativeLanguage, targetLanguage,
    userVoiceGender, partnerVoiceGender
  };
}
