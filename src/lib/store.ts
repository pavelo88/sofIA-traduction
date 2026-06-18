
import { create } from 'zustand';

/**
 * @interface AppState
 * Estado global con persistencia híbrida (Firebase/LocalStorage).
 */
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
  setThermalTemperature: (temp: number) => void;
  updateTranslation: (original: string, translated: string) => void;
  incrementProgress: (amount: number) => void;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setUserVoiceGender: (gender: 'masculino' | 'femenino') => void;
  setPartnerVoiceGender: (gender: 'masculino' | 'femenino') => void;
}

// Carga inicial de LocalStorage para modo invitado
const getInitialValue = (key: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
};

export const useStore = create<AppState>((set) => ({
  isThermalThrottled: false,
  thermalTemperature: 38,
  cameraResolution: '1080p',
  cameraFPS: 60,
  learningProgress: 45,
  nativeLanguage: getInitialValue('softia_native_lang', 'Español'),
  targetLanguage: getInitialValue('softia_target_lang', 'Inglés'),
  userVoiceGender: getInitialValue('softia_user_gender', 'masculino') as any,
  partnerVoiceGender: getInitialValue('softia_partner_gender', 'femenino') as any,
  lastTranslation: null,

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

  setNativeLanguage: (lang) => {
    localStorage.setItem('softia_native_lang', lang);
    set({ nativeLanguage: lang });
  },
  setTargetLanguage: (lang) => {
    localStorage.setItem('softia_target_lang', lang);
    set({ targetLanguage: lang });
  },
  setUserVoiceGender: (gender) => {
    localStorage.setItem('softia_user_gender', gender);
    set({ userVoiceGender: gender });
  },
  setPartnerVoiceGender: (gender) => {
    localStorage.setItem('softia_partner_gender', gender);
    set({ partnerVoiceGender: gender });
  },
}));
