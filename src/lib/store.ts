import { create } from 'zustand';

/**
 * @interface AppState
 * Define el estado global de la aplicación siguiendo los requerimientos del MVP.
 */
interface AppState {
  isThermalThrottled: boolean;
  thermalTemperature: number;
  cameraResolution: '1080p' | '720p';
  cameraFPS: number;
  learningProgress: number;
  nativeLanguage: string;
  targetLanguage: string;
  lastTranslation: {
    original: string;
    translated: string;
  } | null;
  setThermalTemperature: (temp: number) => void;
  updateTranslation: (original: string, translated: string) => void;
  incrementProgress: (amount: number) => void;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
}

export const useStore = create<AppState>((set) => ({
  isThermalThrottled: false,
  thermalTemperature: 38,
  cameraResolution: '1080p',
  cameraFPS: 60,
  learningProgress: 45,
  nativeLanguage: 'Español',
  targetLanguage: 'Inglés',
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

  setNativeLanguage: (lang) => set({ nativeLanguage: lang }),
  setTargetLanguage: (lang) => set({ targetLanguage: lang }),
}));
