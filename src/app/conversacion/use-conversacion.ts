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
 * Traduce localmente usando la API de Traducción integrada de Chrome (window.translation),
 * Gemini Nano (window.ai), o Transformers.js en Web Worker.
 * Si no están disponibles, hace un fallback al traductor del servidor.
 */
async function translateOnDevice(text: string, fromLangName: string, toLangName: string, worker: Worker | null): Promise<string> {
  const codeMap: Record<string, string> = {
    "Español": "es", "Inglés": "en", "Francés": "fr", "Alemán": "de",
    "Portugués": "pt", "Italiano": "it", "Chino": "zh", "Japonés": "ja",
    "Árabe": "ar", "Ruso": "ru"
  };
  
  const nllbMap: Record<string, string> = {
    "Español": "spa_Latn", "Inglés": "eng_Latn", "Francés": "fra_Latn", "Alemán": "deu_Latn",
    "Portugués": "por_Latn", "Italiano": "ita_Latn", "Chino": "zho_Hans", "Japonés": "jpn_Jpan",
    "Árabe": "arb_Arab", "Ruso": "rus_Cyrl"
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

  // 3. Fallback: Edge AI Local con Transformers.js
  if (worker) {
    try {
      console.log('[SoftIA Edge AI] Ejecutando traducción con Transformers.js...');
      const srcLang = nllbMap[fromLangName] || 'eng_Latn';
      const tgtLang = nllbMap[toLangName] || 'spa_Latn';
      
      const result = await new Promise<string>((resolve, reject) => {
        const onMessage = (event: MessageEvent) => {
          const { status, output, error } = event.data;
          if (status === 'complete') {
            worker.removeEventListener('message', onMessage);
            resolve(output[0].translation_text);
          } else if (status === 'error') {
            worker.removeEventListener('message', onMessage);
            reject(new Error(error));
          } else if (status === 'progress') {
            console.log(`[SoftIA Edge AI] Descargando modelo: ${Math.round(event.data.progress || 0)}%`);
          }
        };
        worker.addEventListener('message', onMessage);
        worker.postMessage({ text, src_lang: srcLang, tgt_lang: tgtLang });
      });
      return result;
    } catch (e) {
      console.warn('[SoftIA Edge AI] Error en Transformers.js:', e);
    }
  }

  // 4. Fallback final: Usar Genkit/Gemini en el servidor
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
  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // El historial proviene del store (persistido en localStorage)
  const history: ChatItem[] = conversationHistory.map(item => ({
    ...item,
    timestamp: new Date(item.timestamp)
  }));

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

  const currentTranscriptRef = useRef<string>('');
  const sessionFinalTranscriptRef = useRef<string>('');
  const globalAccumulatedTranscriptRef = useRef<string>('');
  const isSpeakingRef = useRef<boolean>(false);
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      workerRef.current = new Worker(new URL('@/ai/workers/translator.worker.ts', import.meta.url), {
        type: 'module'
      });
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

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
   * Apaga el analizador de volumen (Removido).
   */
  const stopAudioAnalyzer = () => {};

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
      } catch (e) { }
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
        setIsPreparingMic(true);
        setTimeout(() => {
          setIsPreparingMic(false);
          setIsRecording(true);
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
        }, 500);
      };

      recognition.onresult = (event: any) => {
        let finalFromSession = '';
        let interimFromSession = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalFromSession += event.results[i][0].transcript + ' ';
          } else {
            interimFromSession += event.results[i][0].transcript + ' ';
          }
        }
        sessionFinalTranscriptRef.current = finalFromSession.trim();
        currentTranscriptRef.current = interimFromSession.trim();
        
        const fullText = (globalAccumulatedTranscriptRef.current + ' ' + sessionFinalTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
        setLiveTranscript(fullText);
      };

      recognition.onend = () => {
        const sessionFull = (sessionFinalTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
        if (sessionFull) {
          globalAccumulatedTranscriptRef.current = (globalAccumulatedTranscriptRef.current + ' ' + sessionFull).trim();
        }
        sessionFinalTranscriptRef.current = '';
        currentTranscriptRef.current = '';

        if (isRecordingRef.current) {
          // El navegador detuvo el micro antes de tiempo
          console.log("[SoftIA Voice] Micro detenido por el navegador. Reiniciando de forma invisible...");
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
        } catch (e) { }
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
  const speakAndAutoTurn = useCallback(async (text: string, langName: string) => {
    if (typeof window === 'undefined') return;
    
    // Preparar el cambio de turno
    const finishSpeaking = () => {
      if (!isSpeakingRef.current) return;
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      
      setIsNativeTurn(prev => {
        const next = !prev;
        isNativeTurnRef.current = next;
        return next;
      });
      console.log("[SoftIA Voice] Síntesis finalizada. Esperando activación manual del micrófono.");
    };

    setIsSpeaking(true);
    isSpeakingRef.current = true;
    const targetGender = isNativeTurnRef.current ? partnerVoiceGender : userVoiceGender;

    // Detener cualquier audio previo
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const langCode = langMap[langName] || 'en-US';

    // 1. Intentar ElevenLabs API Route primero (Prioridad Cloud)
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender: targetGender, langCode })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          finishSpeaking();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          finishSpeaking();
        };
        
        await audio.play();
        return; // Éxito con ElevenLabs, salir temprano
      }
    } catch (err) {
      console.warn('[SoftIA Voice] Fallo ElevenLabs, usando voz del navegador:', err);
    }

    // 2. FALLBACK: Voz Nativa
    if (!window.speechSynthesis) {
      finishSpeaking();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const genderRegex = targetGender === 'femenino'
      ? /female|woman|zira|samantha|helena|laura|google/i
      : /male|man|david|mark|pablo|sergio/i;

    let voice = voices.find(v => {
      const isLangMatch = v.lang.startsWith(langCode.split('-')[0]);
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) {
      utterance.voice = voice;
    }

    let fallbackTimeout: NodeJS.Timeout;
    const fallbackFinishSpeaking = () => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      finishSpeaking();
    };

    utterance.onend = fallbackFinishSpeaking;
    utterance.onerror = fallbackFinishSpeaking;

    window.speechSynthesis.speak(utterance);
    
    fallbackTimeout = setTimeout(() => {
       fallbackFinishSpeaking();
    }, 30000);

    const pollInterval = setInterval(() => {
      if (!window.speechSynthesis.speaking && isSpeakingRef.current) {
         clearInterval(pollInterval);
         fallbackFinishSpeaking();
      } else if (!isSpeakingRef.current) {
         clearInterval(pollInterval);
      }
    }, 1000);
  }, [partnerVoiceGender, userVoiceGender]);

  /**
   * Reproduce el audio de un mensaje sin cambiar el turno.
   */
  const replayAudio = useCallback(async (text: string, langName: string, gender: 'masculino' | 'femenino') => {
    if (typeof window === 'undefined') return;

    // Detener cualquier audio previo
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const langCode = langMap[langName] || 'en-US';

    // 1. Intentar ElevenLabs API Route primero
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender, langCode })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        
        audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; };
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; };
        
        await audio.play();
        return; // Éxito con ElevenLabs
      }
    } catch (err) {
      console.warn('[SoftIA Voice] Fallo replay ElevenLabs, usando fallback:', err);
    }

    if (!window.speechSynthesis) return;

    // 2. Fallback: Voz Nativa
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const genderRegex = gender === 'femenino'
      ? /female|woman|zira|samantha|helena|laura|google/i
      : /male|man|david|mark|pablo|sergio/i;

    const voice = voices.find(v => {
      const isLangMatch = v.lang.startsWith(langCode.split('-')[0]);
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

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

      // Prioridad: 1. Gemini (Cloud) -> 2. Local On-Device (Fallback)
      try {
        if (!isGuestRef.current && userCreditsRef.current <= 0) {
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", variant: "destructive" });
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
        console.log("[SoftIA Translation] Usando Gemini...");
        const result = await translateConversation({ text, fromLanguage: fromLang, toLanguage: toLang });
        if (!result || !result.translatedText) throw new Error("Gemini falló");
        
        translatedText = result.translatedText;
        if (!isGuestRef.current) addCredits(-1);
      } catch (geminiError) {
        console.warn("[SoftIA Translation] Fallo Gemini, usando Motor Local de respaldo:", geminiError);
        
        translatedText = await translateOnDevice(text, fromLang, toLang, workerRef.current);
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
      stopDelayTimerRef.current = setTimeout(() => {
        const textToTranslate = (globalAccumulatedTranscriptRef.current + ' ' + sessionFinalTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
        setLiveTranscript('');
        globalAccumulatedTranscriptRef.current = '';
        sessionFinalTranscriptRef.current = '';
        currentTranscriptRef.current = '';

        if (textToTranslate) {
          handleTranslationInternal(textToTranslate);
        }
      }, 400);
    } else {
      globalAccumulatedTranscriptRef.current = '';
      sessionFinalTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      startListening();
    }
  }, [startListening]);

  /**
   * Cancela la grabación actual SIN traducirla.
   */
  const cancelRecording = useCallback(() => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      stopRecordingTimer();
      
      if (recognitionRef.current) {
        try {
          // Usar abort() en lugar de stop() cancela sin lanzar onresult (si es posible)
          recognitionRef.current.abort(); 
        } catch (err) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      stopAudioAnalyzer();

      // Vaciar todos los buffers para que no haya nada que traducir
      setLiveTranscript('');
      globalAccumulatedTranscriptRef.current = '';
      sessionFinalTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      
      if (stopDelayTimerRef.current) {
        clearTimeout(stopDelayTimerRef.current);
      }
    }
  }, []);

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
      } catch (e) { }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    stopAudioAnalyzer();
    stopRecordingTimer();
    setLiveTranscript('');
    globalAccumulatedTranscriptRef.current = '';
    sessionFinalTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setIsNativeTurn(prev => {
      const next = !prev;
      isNativeTurnRef.current = next; // Force immediate sync to avoid race conditions
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (stopDelayTimerRef.current) clearTimeout(stopDelayTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) { }
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
    isNativeTurn, isRecording, isPreparingMic, isProcessing, isSpeaking,
    isCameraActive, setIsCameraActive,
    history, toggleSession, toggleTurn, startListening, streamRef,
    nativeLanguage, targetLanguage, nativeName, targetName,
    setNativeLanguage, setTargetLanguage, setNativeName, setTargetName,
    userVoiceGender, partnerVoiceGender, setUserVoiceGender, setPartnerVoiceGender,
    liveTranscript, recordingTime,
    saveAndClearConversation, clearConversation, replayAudio, cancelRecording
  };
}
