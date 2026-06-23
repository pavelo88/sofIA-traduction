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

async function translateOnDevice(text: string, fromLangName: string, toLangName: string): Promise<string> {
  const codeMap: Record<string, string> = {
    "Español": "es", "Inglés": "en", "Francés": "fr", "Alemán": "de",
    "Portugués": "pt", "Italiano": "it", "Chino": "zh", "Japonés": "ja",
    "Árabe": "ar", "Ruso": "ru"
  };
  const fromCode = codeMap[fromLangName] || 'en';
  const toCode = codeMap[toLangName] || 'es';

  if (typeof window !== 'undefined' && 'translation' in window) {
    try {
      const translationAPI = (window as any).translation;
      const capabilities = await translationAPI.canTranslate({ sourceLanguage: fromCode, targetLanguage: toCode });
      if (capabilities !== 'no') {
        const translator = await translationAPI.createTranslator({ sourceLanguage: fromCode, targetLanguage: toCode });
        return await translator.translate(text);
      }
    } catch (e) { console.warn('[SoftIA Device AI] Error window.translation:', e); }
  }

  if (typeof window !== 'undefined' && 'ai' in window && 'languageModel' in (window as any).ai) {
    try {
      const session = await (window as any).ai.languageModel.create({
        systemPrompt: `Eres un traductor veloz y preciso de ${fromLangName} a ${toLangName}. Traduce el siguiente texto de forma directa, sin explicaciones ni introducciones. Texto: "${text}"`
      });
      const result = await session.prompt(text);
      return result.trim();
    } catch (e) { console.warn('[SoftIA Device AI] Error window.ai:', e); }
  }

  try {
    const result = await translateConversation({ text, fromLanguage: fromLangName, toLanguage: toLangName });
    return result.translatedText;
  } catch (err) {
    console.warn('[SoftIA Fallback] Error en fallback de traducción local:', err);
    return `[Local] ${text}`;
  }
}

export function useConversacion() {
  const {
    nativeLanguage, targetLanguage, userVoiceGender, partnerVoiceGender,
    aiEngineMode, userCredits, addCredits, setIsProfileOpen,
    conversationHistory, addConversationItem, saveAndClearConversation,
    clearConversation, nativeName, targetName, setNativeName, setTargetName,
    setNativeLanguage, setTargetLanguage, setUserVoiceGender, setPartnerVoiceGender
  } = useStore();

  const { user } = useUser();
  const isGuest = useMemo(() => !user?.uid || user.uid.startsWith('guest-session'), [user?.uid]);

  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const history: ChatItem[] = conversationHistory.map(item => ({ ...item, timestamp: new Date(item.timestamp) }));
  
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(12));
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

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
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const globalAccumulatedTranscriptRef = useRef<string>('');
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stopDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const stopRecordingTimer = () => {
    if (recordingTimerIntervalRef.current) {
      clearInterval(recordingTimerIntervalRef.current);
      recordingTimerIntervalRef.current = null;
    }
  };

  const stopAudioAnalyzer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    setAudioLevels(Array(20).fill(12));
  };

  const startListening = useCallback(() => {
    if (isProcessingRef.current) return;

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Micrófono no disponible", description: "Tu navegador no soporta reconocimiento de voz." });
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    setTimeout(() => {
      if (isProcessingRef.current) return;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const currentLang = isNativeTurnRef.current ? nativeLangRef.current : targetLangRef.current;
      const normalizeLang = (name: string) => langMap[name] || 'en-US';
      const langCode = normalizeLang(currentLang);
      
      recognition.lang = langCode;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setLiveTranscript(globalAccumulatedTranscriptRef.current);
        currentTranscriptRef.current = '';
        
        if (!recordingTimerIntervalRef.current) {
          setRecordingTime(0);
          recordingTimerIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => {
              if (prev >= 119) {
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
        for (let i = event.resultIndex; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript;
        }
        currentTranscriptRef.current = accumulated.trim();
        setLiveTranscript((globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim());
      };

      recognition.onend = () => {
        // Corrección Crítica: Si el navegador corta el micrófono de forma prematura (por ej. pausa en iOS), 
        // en lugar de forzar un reinicio asíncrono que rompe la UI, auto-procesamos lo dicho.
        if (isRecordingRef.current) {
          console.log("[SoftIA Voice] El navegador cortó el micrófono. Auto-enviando texto...");
          isRecordingRef.current = false;
          
          stopDelayTimerRef.current = setTimeout(() => {
            const textToTranslate = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
            setLiveTranscript('');
            globalAccumulatedTranscriptRef.current = '';
            currentTranscriptRef.current = '';
            if (textToTranslate) handleTranslationInternal(textToTranslate);
          }, 400);
        }
        
        setIsRecording(false);
        stopAudioAnalyzer();
        stopRecordingTimer();
      };

      recognition.onerror = (e: any) => {
        console.warn('[SoftIA Voice] Error:', e.error);
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          toast({ title: "Aviso de Micrófono", description: `El motor reportó: ${e.error}.` });
        }
        setIsRecording(false);
        stopAudioAnalyzer();
      };

      try {
        recognition.start();
      } catch (err) {
        console.warn('[SoftIA Voice] Error al iniciar:', err);
      }
    }, 50);
  }, []);

  const speakAndAutoTurn = useCallback((text: string, langName: string) => {
    if (typeof window !== 'undefined' || !window.speechSynthesis) {
      setIsNativeTurn(prev => { isNativeTurnRef.current = !prev; return !prev; });
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
      const genderRegex = targetGender === 'femenino' ? /female|woman|zira|samantha/i : /male|man|david/i;
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsNativeTurn(prev => { isNativeTurnRef.current = !prev; return !prev; });
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsNativeTurn(prev => { isNativeTurnRef.current = !prev; return !prev; });
    };

    window.speechSynthesis.speak(utterance);
  }, [partnerVoiceGender, userVoiceGender]);

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

      addConversationItem({
        original: text, translated: translatedText, from: fromLang, to: toLang, timestamp: new Date().toISOString()
      });
      speakAndAutoTurn(translatedText, toLang);

    } catch (error) {
      toast({ title: "Error de Motor", description: "Reintenta en un momento." });
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  const toggleSession = useCallback(async () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      stopRecordingTimer();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
      }
      setIsRecording(false);
      stopAudioAnalyzer();

      stopDelayTimerRef.current = setTimeout(() => {
        const textToTranslate = (globalAccumulatedTranscriptRef.current + ' ' + currentTranscriptRef.current).trim();
        setLiveTranscript('');
        globalAccumulatedTranscriptRef.current = '';
        currentTranscriptRef.current = '';
        if (textToTranslate) handleTranslationInternal(textToTranslate);
      }, 400);
    } else {
      globalAccumulatedTranscriptRef.current = '';
      currentTranscriptRef.current = '';
      
      // Corrección Crítica: Despertar AudioContext de manera síncrona con el clic del usuario.
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 64; 
        analyserRef.current = analyser;
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!audioStreamRef.current) return;
          animationFrameRef.current = requestAnimationFrame(checkVolume);
          analyser.getByteFrequencyData(dataArray);
          
          const newLevels = [];
          const chunkSize = Math.max(1, Math.floor(analyser.frequencyBinCount / 20));
          for (let i = 0; i < 20; i++) {
            let sum = 0;
            for (let j = 0; j < chunkSize; j++) sum += dataArray[i * chunkSize + j] || 0;
            newLevels.push(Math.min(100, Math.max(12, ((sum / chunkSize) / 255) * 100 + Math.random() * 8)));
          }
          setAudioLevels(newLevels);
        };
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      } catch (e) {
        console.warn('[SoftIA] Error iniciando analizador de audio:', e);
      }

      startListening();
    }
  }, [startListening]);

  const toggleTurn = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    isRecordingRef.current = false;
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
    setIsRecording(false);
    setIsSpeaking(false);
    stopAudioAnalyzer();
    stopRecordingTimer();
    setLiveTranscript('');
    globalAccumulatedTranscriptRef.current = '';
    currentTranscriptRef.current = '';
    setIsNativeTurn(prev => { isNativeTurnRef.current = !prev; return !prev; });
  }, []);

  useEffect(() => {
    return () => {
      if (stopDelayTimerRef.current) clearTimeout(stopDelayTimerRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (e) {} }
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      stopAudioAnalyzer();
      stopRecordingTimer();
    };
  }, []);

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
