
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
 * Refactorización v8.2: Gestión de hardware y bypass de Firestore para invitados.
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptBuffer = useRef('');

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
    };

    window.speechSynthesis.speak(utterance);
  }, [isNativeTurn, userVoiceGender, partnerVoiceGender]);

  const handleTranslation = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    const fromLang = isNativeTurn ? nativeLanguage : targetLanguage;
    const toLang = isNativeTurn ? targetLanguage : nativeLanguage;

    try {
      let translatedText = "";

      // Priorizar motor de IA
      if (aiEngineMode === 'gemini') {
        if (!isGuest && userCredits <= 0) {
          setIsProfileOpen(true);
          toast({ title: "Créditos Agotados", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        if (!isGuest) addCredits(-1);
        const result = await translateConversation({ text, fromLanguage: fromLang, toLanguage: toLang });
        translatedText = result.translatedText;
      } 
      else if (aiEngineMode === 'deepseek') {
        const result = await callDeepSeekBackup(text, fromLang, toLang);
        translatedText = result.translatedText;
      }
      else {
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
      speakText(translatedText, toLang);
    } catch (error) {
      console.error("[SoftIA Engine] Error:", error);
      toast({ title: "Error de Motor", description: "Reintenta en un momento." });
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
      recognition.onresult = (event: any) => { 
        const transcript = event.results[0][0].transcript;
        if (transcript) handleTranslation(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [nativeLanguage, targetLanguage, isNativeTurn, aiEngineMode]);

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
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
        }
      } else {
        toast({ title: "Micro no listo" });
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
      if (activeStream) activeStream.getTracks().forEach(t => t.stop());
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [isCameraActive]);

  return {
    isNativeTurn, isRecording, isProcessing, isCameraActive, setIsCameraActive, 
    history, toggleSession, streamRef, nativeLanguage, targetLanguage, 
    userVoiceGender, partnerVoiceGender
  };
}
