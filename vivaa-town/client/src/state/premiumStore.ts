import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PremiumStore {
  // API 키 관리
  geminiApiKey: string | null;

  // 프리미엄 기능 상태
  isPremiumActive: boolean;

  // Actions
  setGeminiApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  validateApiKey: (apiKey: string) => Promise<boolean>;
}

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      geminiApiKey: null,
      isPremiumActive: false,

      setGeminiApiKey: (apiKey: string) => {
        set({
          geminiApiKey: apiKey,
          isPremiumActive: true
        });
      },

      clearApiKey: () => {
        set({
          geminiApiKey: null,
          isPremiumActive: false
        });
      },

      validateApiKey: async (apiKey: string) => {
        try {
          // Gemini API 키 유효성 검증
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

          // 간단한 테스트 요청으로 API 키 검증
          await model.generateContent("test");

          get().setGeminiApiKey(apiKey);
          return true;
        } catch (error) {
          console.error('API 키 검증 실패:', error);
          return false;
        }
      },
    }),
    {
      name: 'premium-store',
    }
  )
);