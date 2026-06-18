
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
 * @summary Hook de lógica de negocio para Conversación Dual (Audio-First).
 * Implementa procesamiento directo de voz y síntesis dinámica por género.
 * Optimización de Hardware v5.0: Gestión estricta de ciclos de vida de cámara.
 */
export function useConversacion() {
  const { 
    nativeLanguage, 
    targetLanguage, 
    userVoiceGender, 
    partnerVoiceGender 
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

  // Mapeo de códigos ISO para Speech API
  const langMap: Record<string, string> = {
    "Español": "es-ES", "Inglés": "en-US", "Francés": "fr-FR", "Alemán": "de-DE",
    "Portugués": "pt-PT", "Italiano": "it-IT", "Chino": "zh-CN", "Japonés": "ja-JP",
    "Árabe": "ar-SA", "Ruso": "ru-RU"
  };

  /**
   * Síntesis de Voz Inteligente (TTS)
   */
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

  /**
   * Procesamiento Directo de Traducción
   */
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
      console.error("[SoftIA Audio Engine] Fallo en la matriz de traducción:", error);
      toast({ 
        title: "Falla de Traducción", 
        description: "Se perdió el enlace espacial con el motor de voz.", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Inicialización del Reconocimiento de Voz
   */
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setIsRecording(true);
        transcriptBuffer.current = '';
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        transcriptBuffer.current = transcript;
      };

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
  }, [nativeLanguage, targetLanguage, isNativeTurn]);

  /**
   * Orquestador de Turnos Automático
   */
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

  /**
   * Gestión Imperativa de Hardware (Cámara)
   * Prevención de sobrecalentamiento y fugas de memoria.
   */
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          activeStream = stream;
          streamRef.current = stream;
          console.log(`[SoftIA Hardware] Cámara activada: ${stream.id}`);
        }).catch((err) => {
          console.error("[SoftIA Hardware] Error al activar cámara:", err);
          setIsCameraActive(false);
          toast({ title: "Hardware Error", description: "No se pudo acceder a la cámara visual.", variant: "destructive" });
        });
    }

    // CICLO DE APAGADO ESTRICTO
    return () => {
      const streamToCleanup = activeStream || streamRef.current;
      if (streamToCleanup) {
        streamToCleanup.getTracks().forEach(track => {
          track.stop();
          console.log(`[SoftIA Hardware] Track ${track.kind} destruido y apagado a nivel de CPU: ${track.label}`);
        });
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
        try { 
          recognitionRef.current.start(); 
        } catch (e) {}
      }
    }
  };

  return {
    isNativeTurn, 
    isRecording, 
    isProcessing, 
    isCameraActive,
    setIsCameraActive, 
    history, 
    toggleSession, 
    streamRef,
    nativeLanguage, 
    targetLanguage, 
    userVoiceGender, 
    partnerVoiceGender
  };
}
