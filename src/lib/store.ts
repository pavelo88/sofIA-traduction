
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

export type SessionType = 'chat' | 'conversacion' | 'lectura' | 'lente';

export interface SavedSession {
  id: string;
  type: SessionType;
  name: string;
  date: string;
  data: any; // Flexible data payload based on type
}

interface AppState {
  isThermalThrottled: boolean;
  thermalTemperature: number;
  cameraResolution: '1080p' | '720p';
  cameraFPS: number;
  learningProgress: number;
  nativeLanguage: string;
  targetLanguage: string;
  nativeName: string;
  targetName: string;
  userVoiceGender: 'masculino' | 'femenino';
  partnerVoiceGender: 'masculino' | 'femenino';
  lastTranslation: {
    original: string;
    translated: string;
  } | null;
  conversationHistory: ConversationItem[];
  savedSessions: SavedSession[];
  
  // Infraestructura de IA y SaaS
  aiEngineMode: 'gemini' | 'deepseek' | 'device';
  userCredits: number;
  isProfileOpen: boolean;
  hasCompletedOnboarding: boolean;
  defaultNativeName: string;
  defaultTargetName: string;
  
  // Setters
  setThermalTemperature: (temp: number) => void;
  updateTranslation: (original: string, translated: string) => void;
  incrementProgress: (amount: number) => void;
  setNativeLanguage: (lang: string) => void;
  setTargetLanguage: (lang: string) => void;
  setNativeName: (name: string) => void;
  setTargetName: (name: string) => void;
  setUserVoiceGender: (gender: 'masculino' | 'femenino') => void;
  setPartnerVoiceGender: (gender: 'masculino' | 'femenino') => void;
  addConversationItem: (item: ConversationItem) => void;
  saveAndClearConversation: (name: string) => void;
  saveGenericSession: (type: SessionType, name: string, data: any) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearConversation: () => void;
  setHasCompletedOnboarding: (val: boolean) => void;
  setDefaultNativeName: (name: string) => void;
  setDefaultTargetName: (name: string) => void;
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
      nativeName: 'Usuario',
      targetName: 'Invitado',
      defaultNativeName: 'Usuario',
      defaultTargetName: 'Invitado',
      userVoiceGender: 'masculino',
      partnerVoiceGender: 'femenino',
      lastTranslation: null,
      conversationHistory: [],
      savedSessions: [],
      aiEngineMode: 'gemini',
      userCredits: 25,
      isProfileOpen: false,
      hasCompletedOnboarding: false,

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
      setNativeName: (name) => set({ nativeName: name }),
      setTargetName: (name) => set({ targetName: name }),
      setDefaultNativeName: (name) => set({ defaultNativeName: name, nativeName: name }),
      setDefaultTargetName: (name) => set({ defaultTargetName: name, targetName: name }),
      setHasCompletedOnboarding: (val) => set({ hasCompletedOnboarding: val }),
      setUserVoiceGender: (gender) => set({ userVoiceGender: gender }),
      setPartnerVoiceGender: (gender) => set({ partnerVoiceGender: gender }),
      addConversationItem: (item) => set((state) => {
        const newHistory = [item, ...state.conversationHistory].slice(0, 50);
        
        // Auto-save logic
        const today = new Date().toDateString();
        const existingIdx = state.savedSessions.findIndex(s => s.type === 'conversacion' && new Date(s.date).toDateString() === today);
        let newSessions = [...state.savedSessions];
        
        if (existingIdx >= 0) {
          newSessions[existingIdx] = {
            ...newSessions[existingIdx],
            data: newHistory,
            date: new Date().toISOString()
          };
        } else {
          newSessions = [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'conversacion',
            name: `Conversación ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            data: newHistory
          }, ...newSessions];
        }

        return {
          conversationHistory: newHistory,
          savedSessions: newSessions
        };
      }),
      saveAndClearConversation: (name) => set((state) => {
        if (state.conversationHistory.length === 0) return state;
        const newSession: SavedSession = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'conversacion',
          name,
          date: new Date().toISOString(),
          data: [...state.conversationHistory]
        };
        return {
          savedSessions: [newSession, ...state.savedSessions],
          conversationHistory: []
        };
      }),
      saveGenericSession: (type, name, data) => set((state) => {
        // Find existing session of same type for "Today" or create new
        const today = new Date().toDateString();
        const existingIdx = state.savedSessions.findIndex(s => s.type === type && new Date(s.date).toDateString() === today && s.name === name);
        
        let newSessions = [...state.savedSessions];
        if (existingIdx >= 0) {
          newSessions[existingIdx] = {
            ...newSessions[existingIdx],
            data,
            date: new Date().toISOString()
          };
        } else {
          newSessions = [{
            id: Math.random().toString(36).substr(2, 9),
            type,
            name,
            date: new Date().toISOString(),
            data
          }, ...newSessions];
        }
        return { savedSessions: newSessions };
      }),
      loadSession: (id) => set((state) => {
        const session = state.savedSessions.find(s => s.id === id);
        if (session) {
          if (session.type === 'conversacion') {
            return { conversationHistory: [...session.data], isProfileOpen: false };
          }
          // Other modules will load their own data from localStorage state or generic loading
        }
        return state;
      }),
      deleteSession: (id) => set((state) => ({
        savedSessions: state.savedSessions.filter(s => s.id !== id)
      })),
      clearConversation: () => set({ conversationHistory: [] }),
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
        savedSessions: state.savedSessions,
        learningProgress: state.learningProgress,
        aiEngineMode: state.aiEngineMode,
        userCredits: state.userCredits,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        defaultNativeName: state.defaultNativeName,
        defaultTargetName: state.defaultTargetName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setNativeName(state.defaultNativeName);
          state.setTargetName(state.defaultTargetName);
        }
      },
    }
  )
);
