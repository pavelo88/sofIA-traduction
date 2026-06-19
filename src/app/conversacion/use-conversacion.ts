
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { translateConversation } from '@/ai/flows/conversation-translate';
import { callDeepSeekBackup } from '@/ai/deepseekClient';
import { toast } from '@/hooks/use-toast';

export type ChatItem = {
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: Date;
};

/**
 * @summary Hook de lógica de negocio para Conversación Dual.
 * Implementa enrutamiento inteligente entre Gemini, DeepSeek y Device.
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
  
  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptBuffer = useRef('');
  const isAutoRestarting = useRef(false);

  const langMap: Record<string, string> = {
    "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
    "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
    "Árabe": "ar-SA", "Ruso": "ru-RU"
  };

  const speakText = useCallback((text: string, langName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = langMap[langName] || 'en-US';
    utterance.lang = langCode;

    const voices = window.speechSynthesis.getVoices();
    const targetGender = isNativeTurn ? partnerVoiceGender : userVoiceGender;
    
    const voice = voices.find(v => {
      const isLangMatch = v.lang.startsWith(langCode.split('-')[0]);
      const genderRegex = targetGender === 'femenino' 
        ? /female|woman|zira|samantha|helena|laura|google/i 
        : /male|man|david|mark|pablo|sergio/i;
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) utterance.voice = voice;
    
    utterance.onend = () => {
      setIsNativeTurn(prev => !prev);
      isAutoRestarting.current = true;
    };

    window.speechSynthesis.speak(utterance);
  }, [isNativeTurn, userVoiceGender, partnerVoiceGender]);

  const handleTranslation = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    const fromLang = isNativeTurn ? nativeLanguage : targetLanguage;
    const toLang = isNativeTurn ? targetLanguage : nativeLanguage;

    try {
      let translatedText = "";

      // ENRUTAMIENTO TRI-MODAL DE INTELIGENCIA
      if (aiEngineMode === 'gemini') {
        if (userCredits <= 0) {
          setIsProcessing(false);
          setIsProfileOpen(true);
          toast({
            title: "Créditos Agotados",
            description: "No tienes créditos para Gemini Cloud. Cambia a DeepSeek o Modo Dispositivo.",
            variant: "destructive"
          });
          return;
        }
        addCredits(-1);
        const result = await translateConversation({ text, fromLanguage: fromLang, toLanguage: toLang });
        translatedText = result.translatedText;
      } 
      else if (aiEngineMode === 'deepseek') {
        // DeepSeek es más económico, consume menos créditos o créditos dedicados
        if (userCredits <= 0) {
          setIsProcessing(false);
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", description: "Recarga para continuar usando DeepSeek.", variant: "destructive" });
          return;
        }
        addCredits(-0.5); // DeepSeek cuesta la mitad de un crédito
        const result = await callDeepSeekBackup(text, fromLang, toLang);
        translatedText = result.translatedText;
      }
      else {
        // Modo Dispositivo: window.ai (Gemini Nano)
        try {
          // @ts-ignore
          if (window.ai && window.ai.languageModel) {
            // @ts-ignore
            const session = await window.ai.languageModel.create();
            translatedText = await session.prompt(`Translate from ${fromLang} to ${toLang}: ${text}. Output only translation.`);
          } else {
            translatedText = `[Offline Fallback] ${text}`;
          }
        } catch (e) {
          translatedText = `[Offline Fallback] ${text}`;
        }
      }

      const newItem: ChatItem = {
        original: text,
        translated: translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);
      speakText(translatedText, toLang);
    } catch (error) {
      console.error("[SoftIA Engine] Fallo en ruteo de IA:", error);
      toast({ title: "Falla de Traducción", description: "Error en la matriz de inteligencia multicanal.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => { transcriptBuffer.current = event.results[0][0].transcript; };
      recognition.onend = () => {
        setIsRecording(false);
        if (transcriptBuffer.current) {
          handleTranslation(transcriptBuffer.current);
          transcriptBuffer.current = '';
        }
      };
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [nativeLanguage, targetLanguage, isNativeTurn, aiEngineMode, userCredits]);

  useEffect(() => {
    if (isAutoRestarting.current && !isRecording && !isProcessing) {
      isAutoRestarting.current = false;
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  }, [isNativeTurn, isRecording, isProcessing, nativeLanguage, targetLanguage]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => { activeStream = stream; streamRef.current = stream; })
        .catch(() => setIsCameraActive(false));
    }
    return () => {
      const streamToCleanup = activeStream || streamRef.current;
      if (streamToCleanup) {
        streamToCleanup.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive]);

  const toggleSession = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try { recognitionRef.current.start(); } catch (e) {
          setIsRecording(false);
        }
      }
    }
  };

  return {
    isNativeTurn, isRecording, isProcessing, isCameraActive, setIsCameraActive, 
    history, toggleSession, streamRef, nativeLanguage, targetLanguage, 
    userVoiceGender, partnerVoiceGender
  };
}
