
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @interface AppState
 * Estado global con persistencia híbrida (Firebase/LocalStorage).
 * Refactorización v7.0: Triple motor de IA (Gemini, DeepSeek, Device).
 */

export interface ConversationItem {
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: string;
}

interface AppState {
  isThermalThrottled: boolean;
  thermalTemperature: number;
  cameraResolution: '1080p' | '720p';
  cameraFPS: number;
  learningProgress: number;
  nativeLanguage: string;
  targetLanguage: string;
  userVoiceGender: 'masculino' | 'femenino';
  partnerVoiceGender: 'masculino' | 'femenino';
  lastTranslation: {
    original: string;
    translated: string;
  } | null;
  conversationHistory: ConversationItem[];
  
  // Infraestructura de IA y SaaS
  aiEngineMode: 'gemini' | 'deepseek' | 'device';
  userCredits: number;
  isProfileOpen: boolean;
  
  // Setters
  setThermalTemperature: (temp: number) => void;
  updateTranslation: (original: string, translated: string) => void;
  incrementProgress: (amount: number) => void;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setUserVoiceGender: (gender: 'masculino' | 'femenino') => void;
  setPartnerVoiceGender: (gender: 'masculino' | 'femenino') => void;
  addConversationItem: (item: ConversationItem) => void;
  setAiEngineMode: (mode: 'gemini' | 'deepseek' | 'device') => void;
  addCredits: (amount: number) => void;
  setIsProfileOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isThermalThrottled: false,
      thermalTemperature: 38,
      cameraResolution: '1080p',
      cameraFPS: 60,
      learningProgress: 45,
      nativeLanguage: 'Español',
      targetLanguage: 'Inglés',
      userVoiceGender: 'masculino',
      partnerVoiceGender: 'femenino',
      lastTranslation: null,
      conversationHistory: [],
      aiEngineMode: 'gemini',
      userCredits: 25,
      isProfileOpen: false,

      setThermalTemperature: (temp) => set((state) => {
        const isThrottled = temp > 45;
        return {
          thermalTemperature: temp,
          isThermalThrottled: isThrottled,
          cameraResolution: isThrottled ? '720p' : '1080p',
          cameraFPS: isThrottled ? 30 : 60
        };
      }),

      updateTranslation: (original, translated) => set({
        lastTranslation: { original, translated }
      }),

      incrementProgress: (amount) => set((state) => ({
        learningProgress: Math.min(100, state.learningProgress + amount)
      })),

      setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
      setTargetLanguage: (lang) => set({ targetLanguage: lang }),
      setUserVoiceGender: (gender) => set({ userVoiceGender: gender }),
      setPartnerVoiceGender: (gender) => set({ partnerVoiceGender: gender }),
      addConversationItem: (item) => set((state) => ({
        conversationHistory: [item, ...state.conversationHistory].slice(0, 50)
      })),
      setAiEngineMode: (mode) => set({ aiEngineMode: mode }),
      addCredits: (amount) => set((state) => ({ userCredits: state.userCredits + amount })),
      setIsProfileOpen: (open) => set({ isProfileOpen: open }),
    }),
    {
      name: 'softia-core-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nativeLanguage: state.nativeLanguage,
        targetLanguage: state.targetLanguage,
        userVoiceGender: state.userVoiceGender,
        partnerVoiceGender: state.partnerVoiceGender,
        conversationHistory: state.conversationHistory,
        learningProgress: state.learningProgress,
        aiEngineMode: state.aiEngineMode,
        userCredits: state.userCredits,
      }),
    }
  )
);
