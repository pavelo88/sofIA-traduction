
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * @interface AppState
 * Estado global con persistencia híbrida (Firebase/LocalStorage).
 * Refactorización v4.0: Persistencia atómica y soporte para Modo Invitado.
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
  
  // Setters
  setThermalTemperature: (temp: number) => void;
  updateTranslation: (original: string, translated: string) => void;
  incrementProgress: (amount: number) => void;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setUserVoiceGender: (gender: 'masculino' | 'femenino') => void;
  setPartnerVoiceGender: (gender: 'masculino' | 'femenino') => void;
  addConversationItem: (item: ConversationItem) => void;
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
      }),
    }
  )
);
