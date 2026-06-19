
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
 * Refactorización v8.1: Modo invitado resiliente para evitar bloqueos por Auth.
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

      if (aiEngineMode === 'gemini') {
        if (userCredits <= 0) {
          setIsProcessing(false);
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", description: "Cambia a DeepSeek o Modo Dispositivo.", variant: "destructive" });
          return;
        }
        addCredits(-1);
        const result = await translateConversation({ text, fromLanguage: fromLang, toLanguage: toLang });
        translatedText = result.translatedText;
      } 
      else if (aiEngineMode === 'deepseek') {
        if (userCredits <= 0) {
          setIsProcessing(false);
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", description: "Recarga para usar DeepSeek.", variant: "destructive" });
          return;
        }
        addCredits(-0.5);
        const result = await callDeepSeekBackup(text, fromLang, toLang);
        translatedText = result.translatedText;
      }
      else {
        translatedText = `[Device Mode] ${text}`;
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
      console.error("[SoftIA Engine] Error:", error);
      toast({ title: "Error de Motor", description: "No se pudo procesar la traducción." });
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
  }, [nativeLanguage, targetLanguage, isNativeTurn, aiEngineMode]);

  useEffect(() => {
    if (isAutoRestarting.current && !isRecording && !isProcessing) {
      isAutoRestarting.current = false;
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try {
          recognitionRef.current.start();
        } catch (e) {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
        }
      }
    }
  }, [isNativeTurn, isRecording, isProcessing, nativeLanguage, targetLanguage]);

  const toggleSession = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.warn("[Audio Core] Colisión detectada. Reiniciando sesión.");
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 100);
        }
      } else {
        toast({ title: "Micro no listo", description: "Por favor, espera o recarga la página." });
      }
    }
  };

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

  return {
    isNativeTurn, isRecording, isProcessing, isCameraActive, setIsCameraActive, 
    history, toggleSession, streamRef, nativeLanguage, targetLanguage, 
    userVoiceGender, partnerVoiceGender
  };
}
