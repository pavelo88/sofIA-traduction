
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
 * @summary Hook de lógica de negocio para Conversación Dual.
 * Refactorización v9.0: Motor de voz robusto con auto-turno real.
 * - SpeechRecognition se reconstituye en cada llamada a toggleSession()
 *   para evitar closures stale (bug C1).
 * - Auto-turno: tras el TTS, el micrófono del siguiente hablante se activa
 *   automáticamente (M2).
 * - Estado `isSpeaking` expuesto para mostrar el equalizer de IA (M1).
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
  }, [partnerVoiceGender, userVoiceGender]);

  /**
   * Crea y arranca una nueva instancia de SpeechRecognition.
   * CRÍTICO: Se reconstituye en cada llamada para evitar closures stale (fix C1).
   */
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Micrófono no disponible", description: "Tu navegador no soporta reconocimiento de voz." });
      return;
    }

    const recognition = new SpeechRecognition();
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

    recognition.onend = () => setIsRecording(false);

    recognition.onerror = (e: any) => {
      setIsRecording(false);
      // No mostrar error para 'aborted' (cancelación manual)
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        console.warn('[SoftIA Voice] Error de reconocimiento:', e.error);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      // Si el recognition está en estado inválido, ignorar (sucede al llamar start() dos veces)
      console.warn('[SoftIA Voice] No se pudo iniciar recognition:', err);
    }
  }, []);

  /**
   * Lógica de traducción separada en función interna para ser llamable desde startListening.
   * Usa refs en lugar de estado para acceder a los valores actuales (fix C1).
   */
  const handleTranslationInternal = async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true; // Actualizar ref inmediatamente
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
        translatedText = `[Device] ${text}`;
      }

      const newItem: ChatItem = {
        original: text,
        translated: translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);

      // Hablar la traducción y auto-cambiar turno (M2)
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
   * Si está grabando → cancela la grabación actual.
   * Si no está grabando → crea nueva instancia y arranca.
   */
  const toggleSession = useCallback(() => {
    if (isRecording) {
      // Cancelar la grabación actual (el onend del recognition se encargará de setIsRecording(false))
      window.speechSynthesis.cancel();
      setIsRecording(false);
      setIsSpeaking(false);
    } else {
      startListening();
    }
  }, [isRecording, startListening]);

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
    history, toggleSession, startListening, streamRef,
    nativeLanguage, targetLanguage,
    userVoiceGender, partnerVoiceGender
  };
}
