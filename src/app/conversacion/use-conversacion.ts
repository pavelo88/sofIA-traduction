
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { translateConversation } from '@/ai/flows/conversation-translate';
import { toast } from '@/hooks/use-toast';

export type ChatItem = {
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: Date;
};

/**
 * @summary Hook de lógica central para el modo conversación.
 * Maneja reconocimiento, síntesis, cámara e intercambio de turnos.
 * v4.1: Estabilización de loops de hardware.
 */
export function useConversacion() {
  const { nativeLanguage, targetLanguage, userVoiceGender, partnerVoiceGender } = useStore();
  
  const [isNativeTurn, setIsNativeTurn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    
    const voice = voices.find(v => 
      v.lang.startsWith(langCode.split('-')[0]) && 
      (targetGender === 'femenino' 
        ? /female|woman|zira|samantha|helena|laura|google/i.test(v.name)
        : /male|man|david|mark|pablo|sergio/i.test(v.name))
    ) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

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
      const result = await translateConversation({
        text,
        fromLanguage: fromLang,
        toLanguage: toLang
      });

      const newItem: ChatItem = {
        original: text,
        translated: result.translatedText,
        from: fromLang,
        to: toLang,
        timestamp: new Date()
      };

      setHistory(prev => [newItem, ...prev]);
      speakText(result.translatedText, toLang);
    } catch (error) {
      console.error(error);
      toast({ title: "Falla de Traducción", description: "Se perdió el enlace espacial.", variant: "destructive" });
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
        handleTranslation(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, [nativeLanguage, targetLanguage, isNativeTurn]);

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
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
        }).catch(() => setIsCameraActive(false));
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [isCameraActive]);

  const toggleSession = () => {
    if (isRecording) recognitionRef.current?.stop();
    else {
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try { recognitionRef.current.start(); } catch (e) {}
      }
    }
  };

  return {
    isNativeTurn, isRecording, isProcessing, isCameraActive,
    setIsCameraActive, history, toggleSession, streamRef,
    nativeLanguage, targetLanguage, userVoiceGender, partnerVoiceGender
  };
}
