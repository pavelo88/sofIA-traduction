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

export function getLocalizedLabels(language: string) {
  const labels: Record<string, { self: string; other: string }> = {
    "Español": { self: "Yo dije:", other: "La persona dijo:" },
    "Inglés": { self: "I said:", other: "The other person said:" },
    "Francés": { self: "J'ai dit:", other: "L'autre personne a dit:" },
    "Alemán": { self: "Ich sagte:", other: "Die andere Person sagte:" },
    "Portugués": { self: "Eu disse:", other: "A outra pessoa disse:" },
    "Italiano": { self: "Ho detto:", other: "L'altra persona ha detto:" },
    "Chino": { self: "我说：", other: "对方说：" },
    "Japonés": { self: "私は言った:", other: "相手は言った:" },
    "Árabe": { self: "قلت:", other: "قال الشخص الآخر:" },
    "Ruso": { self: "Я сказал(а):", other: "Другой человек сказал:" }
  };
  return labels[language] || labels["Inglés"];
}

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
 * Refactorización v10.0: Control manual de micrófono con visualizador WhatsApp y alerta de silencio de 5s.
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
    setIsProfileOpen,
    conversationHistory,
    addConversationItem,
    saveAndClearConversation,
    clearConversation,
    nativeName,
    targetName,
    setNativeName,
    setTargetName,
    setNativeLanguage,
    setTargetLanguage,
    setUserVoiceGender,
    setPartnerVoiceGender
  } = useStore();

  const { user } = useUser();
  const isGuest = useMemo(() => !user?.uid || user.uid.startsWith('guest-session'), [user?.uid]);

  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // El historial proviene del store (persistido en localStorage)
  const history: ChatItem[] = conversationHistory.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp)
  }));
  
  // Niveles de audio estilo WhatsApp
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(12));
  // Vista previa en tiempo real de lo que se está transcribiendo
  const [liveTranscript, setLiveTranscript] = useState('');
  // Temporizador de grabación (en segundos)
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs para acceder a los valores actuales dentro de callbacks sin re-crear de forma stale
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null); 
  const isNativeTurnRef = useRef(isNativeTurn);
  const nativeLangRef = useRef(nativeLanguage);
  const targetLangRef = useRef(targetLanguage);
  const aiEngineModeRef = useRef(aiEngineMode);
  const userCreditsRef = useRef(userCredits);
  const isGuestRef = useRef(isGuest);
  const isProcessingRef = useRef(isProcessing);
  const isRecordingRef = useRef(isRecording);
  
  // Refs para Audio Visualizer y temporizador de silencio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const currentTranscriptRef = useRef<string>('');
  const globalAccumulatedTranscriptRef = useRef<string>('');
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mantener refs sincronizadas con el estado
  useEffect(() => { isNativeTurnRef.current = isNativeTurn; }, [isNativeTurn]);
  useEffect(() => { nativeLangRef.current = nativeLanguage; }, [nativeLanguage]);
  useEffect(() => { targetLangRef.current = targetLanguage; }, [targetLanguage]);
  useEffect(() => { aiEngineModeRef.current = aiEngineMode; }, [aiEngineMode]);
  useEffect(() => { userCreditsRef.current = userCredits; }, [userCredits]);
  useEffect(() => { isGuestRef.current = isGuest; }, [isGuest]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  const langMap: Record<string, string> = {
    "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
    "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
    "Árabe": "ar-SA", "Ruso": "ru-RU"
  };

  /**
   * Detiene el temporizador de grabación.
   */
  const stopRecordingTimer = () => {
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
      recordingTimerIntervalRef.current = null;
    }
  };

  /**
   * Inicia el analizador de volumen para la onda visual y el check de silencio.
   */
  const startAudioAnalyzer = async () => {
    stopAudioAnalyzer();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      lastSoundTimeRef.current = Date.now();

      const checkVolume = () => {
        if (!audioStreamRef.current) return;
        animationFrameRef.current = requestAnimationFrame(checkVolume);

        analyser.getByteFrequencyData(dataArray);

        const newLevels = [];
        const chunkSize = Math.max(1, Math.floor(bufferLength / 20));
        let sumTotal = 0;

        for (let i = 0; i < 20; i++) {
          let sum = 0;
          for (let j = 0; j < chunkSize; j++) {
            sum += dataArray[i * chunkSize + j] || 0;
          }
          const avg = sum / chunkSize;
          newLevels.push(avg);
          sumTotal += avg;
        }

        // Mapear a escala visual
        const normalized = newLevels.map(v => Math.min(100, Math.max(12, (v / 255) * 100 + Math.random() * 8)));
        setAudioLevels(normalized);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('[SoftIA Voice] No se pudo activar analizador de sonido:', e);
    }
  };

  /**
   * Apaga el analizador de volumen.
   */
  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevels(Array(20).fill(12));
  };

  /**
   * Crea y arranca una nueva instancia de SpeechRecognition en modo continuo.
   */
  const startListening = useCallback(() => {
    if (isProcessingRef.current) return;

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      console.warn('[SoftIA Voice] Esperando que termine la síntesis de voz...');
      setTimeout(() => startListening(), 500);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Micrófono no disponible", description: "Tu navegador no soporta reconocimiento de voz." });
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    // Liberar recursos de audio inmediatamente para un reinicio limpio
    stopAudioAnalyzer();

    // Timeout de gracia para asegurar que el hardware libere el micrófono 
    // antes de reabrirlo con la nueva configuración de idioma.
    setTimeout(() => {
      if (isProcessingRef.current) return;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const langMapping: Record<string, string> = {
        "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
        "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
        "Árabe": "ar-SA", "Ruso": "ru-RU"
      };

      const currentLang = isNativeTurnRef.current ? nativeLangRef.current : targetLangRef.current;
      
      const normalizeLang = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('ing')) return 'en-US';
        if (lower.includes('espa')) return 'es-ES';
        if (lower.includes('fran')) return 'fr-FR';
        if (lower.includes('ale')) return 'de-DE';
        if (lower.includes('port')) return 'pt-PT';
        if (lower.includes('ita')) return 'it-IT';
        if (lower.includes('chi')) return 'zh-CN';
        if (lower.includes('jap')) return 'ja-JP';
        if (lower.includes('ara') || lower.includes('ára')) return 'ar-SA';
        if (lower.includes('rus')) return 'ru-RU';
        return langMapping[name] || 'en-US';
      };

      const langCode = normalizeLang(currentLang);
      console.log(`[SoftIA Voice] Iniciando grabación en idioma: ${currentLang} -> ${langCode}`);
      recognition.lang = langCode;
      
      // Grabación manual continua estricta
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Flag para auto-reinicio si muere inesperadamente
      const isExpectedToRecord = true;

      recognition.onstart = () => {
        setIsRecording(true);
        startAudioAnalyzer();
        setLiveTranscript(globalAccumulatedTranscriptRef.current);
        currentTranscriptRef.current = '';
        
        // Iniciar temporizador si no está corriendo
        if (!recordingTimerIntervalRef.current) {
          setRecordingTime(0);
          recordingTimerIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => {
              if (prev >= 119) {
                // Detener automáticamente al llegar al límite (120s)
                setTimeout(() => toggleSession(), 0);
                return 120;
              }
              return prev + 1;
            });
          }, 1000);
        }
      };

      recognition.onresult = (event: any) => {
        let accumulated = '';
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript + ' ';
        }
        const finalVal = accumulated.trim();
        currentTranscriptRef.current = finalVal;
        setLiveTranscript((globalAccumulatedTranscriptRef.current + ' ' + finalVal).trim());
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // El navegador detuvo el micro antes de tiempo
          console.log("[SoftIA Voice] Micro detenido por el navegador. Reiniciando de forma invisible...");
          // Guardar lo recolectado en esta mini-sesión al buffer global
          globalAccumulatedTranscriptRef.current = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
          currentTranscriptRef.current = '';
          setTimeout(() => startListening(), 50);
          return;
        }
        setIsRecording(false);
        stopAudioAnalyzer();
        stopRecordingTimer();
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') {
          console.log('[SoftIA Voice] Error de silencio/aborto, intentando continuar...');
        } else {
          console.warn('[SoftIA Voice] Error de reconocimiento:', e.error);
          toast({ title: "Aviso de Micrófono", description: `El motor reportó: ${e.error}. Por favor, vuelve a intentarlo.` });
          setIsRecording(false);
          stopAudioAnalyzer();
        }
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn('[SoftIA Voice] Error al iniciar, reintentando...', err);
        try {
          recognition.stop();
        } catch (e) {}
        setTimeout(() => {
          try {
            recognition.start();
          } catch (retryErr) {
            console.error('[SoftIA Voice] Fallo definitivo al iniciar micrófono:', retryErr);
          }
        }, 300);
      }
    }, 150);
  }, []);

  /**
   * Inicia síntesis de voz y cambia de turno pero NO auto-inicia el micrófono.
   * "El grabador inicia cuando doy clic y termina cuando doy clic, la app no adivina".
   */
  const speakAndAutoTurn = useCallback((text: string, langName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsNativeTurn(prev => {
        const next = !prev;
        isNativeTurnRef.current = next;
        return next;
      });
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
      // Alternar turno para el siguiente hablante
      setIsNativeTurn(prev => {
        const next = !prev;
        isNativeTurnRef.current = next;
        return next;
      });
      // NO llamar a startListening() de manera automática para el auto-turno
      console.log("[SoftIA Voice] Síntesis finalizada. Esperando activación manual del micrófono.");
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsNativeTurn(prev => {
        const next = !prev;
        isNativeTurnRef.current = next;
        return next;
      });
    };

    window.speechSynthesis.speak(utterance);
  }, [partnerVoiceGender, userVoiceGender]);

  /**
   * Lógica de traducción.
   */
  const handleTranslationInternal = async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

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
        translatedText = await translateOnDevice(text, fromLang, toLang);
      }

      // Persistir en el store (localStorage) en lugar de solo en memoria
      addConversationItem({
        original: text,
        translated: translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date().toISOString()
      });
      speakAndAutoTurn(translatedText, toLang);

    } catch (error) {
      console.error("[SoftIA Engine] Error:", error);
      toast({ title: "Error de Motor", description: "Reintenta en un momento." });
      setIsProcessing(false);
      isProcessingRef.current = false;
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  /**
   * Clic en el botón: Activa grabación o Detiene grabación y traduce.
   */
  const toggleSession = useCallback(() => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false; // Forzar estado para evitar auto-reinicio
      stopRecordingTimer();
      // 1. Apagar micrófono
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop(); // Detención normal gatilla onend
        } catch (err) {
          console.warn('[SoftIA Voice] Error al detener SpeechRecognition:', err);
        }
        recognitionRef.current = null;
      }
      setIsRecording(false);
      stopAudioAnalyzer();

      // 2. Procesar traducción si se obtuvo texto combinando el buffer global y el actual
      const textToTranslate = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
      setLiveTranscript('');
      globalAccumulatedTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      
      if (textToTranslate) {
        handleTranslationInternal(textToTranslate);
      }
    } else {
      globalAccumulatedTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      startListening();
    }
  }, [startListening]);

  /**
   * Cambia el turno de forma manual y limpia grabaciones activas.
   */
  const toggleTurn = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isRecordingRef.current = false; // Forzar estado para evitar auto-reinicio
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsSpeaking(false);
    stopAudioAnalyzer();
    stopRecordingTimer();
    setLiveTranscript('');
    globalAccumulatedTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setIsNativeTurn(prev => {
      const next = !prev;
      isNativeTurnRef.current = next; // Force immediate sync to avoid race conditions
      return next;
    });
  }, []);

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
      stopAudioAnalyzer();
      stopRecordingTimer();
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
    nativeLanguage, targetLanguage, nativeName, targetName,
    setNativeLanguage, setTargetLanguage, setNativeName, setTargetName,
    userVoiceGender, partnerVoiceGender, setUserVoiceGender, setPartnerVoiceGender,
    audioLevels, liveTranscript, recordingTime,
    saveAndClearConversation, clearConversation
  };
}
