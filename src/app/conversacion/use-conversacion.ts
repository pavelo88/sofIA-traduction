
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
   * Selecciona la mejor voz basada en idioma y género configurado.
   */
  const speakText = useCallback((text: string, langName: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Detener cualquier locución previa
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = langMap[langName] || 'en-US';
    utterance.lang = langCode;

    // Obtener voces del sistema y filtrar por idioma y género
    const voices = window.speechSynthesis.getVoices();
    
    // Determinamos el género objetivo: 
    // Si acaba de traducir al target (mi turno), habla con la voz del compañero.
    const targetGender = isNativeTurn ? partnerVoiceGender : userVoiceGender;
    
    const voice = voices.find(v => {
      const isLangMatch = v.lang.startsWith(langCode.split('-')[0]);
      const genderRegex = targetGender === 'femenino' 
        ? /female|woman|zira|samantha|helena|laura|google/i 
        : /male|man|david|mark|pablo|sergio/i;
      return isLangMatch && genderRegex.test(v.name);
    }) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

    if (voice) utterance.voice = voice;
    
    // Al terminar de hablar, preparamos el cambio de turno y reinicio automático
    utterance.onend = () => {
      setIsNativeTurn(prev => !prev);
      isAutoRestarting.current = true;
    };

    window.speechSynthesis.speak(utterance);
  }, [isNativeTurn, userVoiceGender, partnerVoiceGender]);

  /**
   * Procesamiento Directo de Traducción
   * Envía el texto capturado por voz al flujo de Genkit.
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
      
      // Reproducir la traducción de forma inmediata
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
      recognition.continuous = false; // Manejo por turnos manuales/auto
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
        // Si hay contenido en el buffer tras el cierre, lo procesamos directamente
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
   * Reactiva el micrófono tras la síntesis de voz.
   */
  useEffect(() => {
    if (isAutoRestarting.current && !isRecording && !isProcessing) {
      isAutoRestarting.current = false;
      const currentLang = isNativeTurn ? nativeLanguage : targetLanguage;
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[currentLang] || 'en-US';
        try { recognitionRef.current.start(); } catch (e) {
          console.warn("[SoftIA Audio Engine] Reconocimiento ya en curso.");
        }
      }
    }
  }, [isNativeTurn, isRecording, isProcessing, nativeLanguage, targetLanguage]);

  /**
   * Gestión Estricta de Hardware (Cámara)
   */
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
        }).catch(() => {
          setIsCameraActive(false);
          toast({ title: "Hardware Error", description: "No se pudo acceder a la cámara visual.", variant: "destructive" });
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
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
