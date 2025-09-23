import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { MarketNews, MarketIndicators, StockPriceHistory } from '../schemas';
import { storageAdapter } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface MarketState {
  marketNews: MarketNews[];
  marketIndicators: MarketIndicators[];
  stockPriceHistory: StockPriceHistory[];

  // Actions
  loadMarketNews: () => void;
  loadMarketIndicators: () => void;
  loadStockPriceHistory: () => void;

  createMarketNews: (data: Omit<MarketNews, 'id' | 'createdAt'>) => MarketNews;
  updateMarketNews: (id: string, updates: Partial<MarketNews>) => void;
  deleteMarketNews: (id: string) => void;

  createMarketIndicators: (data: Omit<MarketIndicators, 'id' | 'createdAt'>) => MarketIndicators;
  generateDailyIndicators: (classroomId: string) => MarketIndicators;

  addStockPriceHistory: (data: Omit<StockPriceHistory, 'id' | 'createdAt'>) => void;
  getStockPriceHistory: (stockId: string, days?: number) => StockPriceHistory[];

  // Market simulation
  generateRandomNews: (classroomId: string, availableStocks: string[]) => MarketNews[];
  getActiveNews: (classroomId: string) => MarketNews[];
  getTodayIndicators: (classroomId: string) => MarketIndicators | null;

  // Educational news templates
  createEducationalNews: (classroomId: string, type: string, stockIds: string[]) => MarketNews;
}

// 교육적 뉴스 템플릿들
const NEWS_TEMPLATES = {
  환경: [
    {
      title: '🌱 오늘의 미세먼지 농도가 {value}㎍/㎥입니다!',
      content: '미세먼지 농도가 {value}㎍/㎥로 측정되었습니다. 환경 관련 기업들의 주가에 영향을 줄 것으로 예상됩니다.',
      getImpact: (value: number) => value > 80 ? 'positive' : value > 40 ? 'neutral' : 'negative',
      getSeverity: (value: number) => Math.min(5, Math.max(1, Math.floor(value / 20)))
    },
    {
      title: '☔ 강수량 {value}mm로 물 부족 해결!',
      content: '오늘 강수량이 {value}mm를 기록하여 물 부족 문제가 일부 해결되었습니다.',
      getImpact: (value: number) => value > 10 ? 'positive' : 'neutral',
      getSeverity: (value: number) => Math.min(3, Math.max(1, Math.floor(value / 10)))
    }
  ],
  교육: [
    {
      title: '📚 선생님 기분 지수 {value}점!',
      content: '오늘 선생님의 기분 지수가 {value}점입니다. 교육 관련 기업들의 성과에 영향을 줄 것으로 보입니다.',
      getImpact: (value: number) => value > 7 ? 'positive' : value > 4 ? 'neutral' : 'negative',
      getSeverity: (value: number) => Math.abs(value - 5.5)
    },
    {
      title: '📝 시험 스트레스 지수 {value}점 기록',
      content: '학생들의 시험 스트레스가 {value}점으로 측정되었습니다. 교육업계 동향에 주목해야 할 시점입니다.',
      getImpact: (value: number) => value > 7 ? 'negative' : value < 4 ? 'positive' : 'neutral',
      getSeverity: (value: number) => Math.abs(value - 5)
    }
  ],
  기술: [
    {
      title: '💻 디지털 출석률 {value}% 달성!',
      content: '오늘 학생 출석률이 {value}%를 기록했습니다. 기술 기업들의 실적에 긍정적 영향이 예상됩니다.',
      getImpact: (value: number) => value > 90 ? 'positive' : value > 70 ? 'neutral' : 'negative',
      getSeverity: (value: number) => Math.abs(value - 85) / 20
    }
  ],
  식품: [
    {
      title: '🍎 급식 만족도 {value}점 기록!',
      content: '오늘 급식 만족도가 {value}점을 기록했습니다. 식품업계에 미치는 영향을 분석해보세요.',
      getImpact: (value: number) => value > 3.5 ? 'positive' : value > 2.5 ? 'neutral' : 'negative',
      getSeverity: (value: number) => Math.abs(value - 3) * 2
    }
  ],
  특별이벤트: [
    {
      title: '🎯 선생님 몸무게가 {value}kg입니다!',
      content: '선생님의 건강 관리 상태가 시장 심리에 미치는 특별한 영향을 관찰해보세요!',
      getImpact: () => Math.random() > 0.5 ? 'positive' : 'negative',
      getSeverity: () => Math.floor(Math.random() * 3) + 1
    },
    {
      title: '🌡️ 교실 온도 {value}°C',
      content: '오늘 교실 온도가 {value}°C입니다. 쾌적한 환경이 학습과 투자 심리에 미치는 영향을 살펴보세요.',
      getImpact: (value: number) => (value >= 18 && value <= 26) ? 'positive' : 'negative',
      getSeverity: (value: number) => Math.abs(value - 22) / 5
    }
  ]
};

export const useMarketStore = create<MarketState>((set, get) => ({
  marketNews: [],
  marketIndicators: [],
  stockPriceHistory: [],

  loadMarketNews: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.MARKET_NEWS);
    if (stored) {
      set({ marketNews: stored });
    }
  },

  loadMarketIndicators: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.MARKET_INDICATORS);
    if (stored) {
      set({ marketIndicators: stored });
    }
  },

  loadStockPriceHistory: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.STOCK_PRICE_HISTORY);
    if (stored) {
      set({ stockPriceHistory: stored });
    }
  },

  createMarketNews: (data) => {
    const now = new Date().toISOString();
    const newNews: MarketNews = {
      ...data,
      id: uuidv4(),
      createdAt: now,
    };

    set((state) => ({
      marketNews: [...state.marketNews, newNews]
    }));

    return newNews;
  },

  updateMarketNews: (id, updates) => {
    set((state) => ({
      marketNews: state.marketNews.map(news =>
        news.id === id ? { ...news, ...updates } : news
      )
    }));
  },

  deleteMarketNews: (id) => {
    set((state) => ({
      marketNews: state.marketNews.filter(news => news.id !== id)
    }));
  },

  createMarketIndicators: (data) => {
    const now = new Date().toISOString();
    const newIndicators: MarketIndicators = {
      ...data,
      id: uuidv4(),
      createdAt: now,
    };

    set((state) => ({
      marketIndicators: [...state.marketIndicators, newIndicators]
    }));

    return newIndicators;
  },

  generateDailyIndicators: (classroomId) => {
    const today = new Date().toISOString().split('T')[0];

    // 기존에 오늘 지표가 있는지 확인
    const existingToday = get().marketIndicators.find(
      ind => ind.classroomId === classroomId && ind.date === today
    );

    if (existingToday) {
      return existingToday;
    }

    // 새로운 일일 지표 생성 (교육적이고 재미있는 값들)
    const indicators = {
      fineDust: Math.floor(Math.random() * 150) + 20, // 20-170 ㎍/㎥
      temperature: Math.floor(Math.random() * 25) + 5, // 5-30°C
      teacherMood: Math.floor(Math.random() * 10) + 1, // 1-10점
      teacherWeight: Math.floor(Math.random() * 30) + 55, // 55-85kg
      rainfall: Math.floor(Math.random() * 50), // 0-50mm
      studentAttendance: Math.floor(Math.random() * 30) + 70, // 70-100%
      lunchMenuRating: Math.floor(Math.random() * 40) / 10 + 1, // 1.0-5.0점
      examStress: Math.floor(Math.random() * 10) + 1, // 1-10점
    };

    return get().createMarketIndicators({
      classroomId,
      date: today,
      indicators,
    });
  },

  addStockPriceHistory: (data) => {
    const now = new Date().toISOString();
    const newHistory: StockPriceHistory = {
      ...data,
      id: uuidv4(),
      createdAt: now,
    };

    set((state) => ({
      stockPriceHistory: [...state.stockPriceHistory, newHistory]
    }));
  },

  getStockPriceHistory: (stockId, days = 30) => {
    const history = get().stockPriceHistory
      .filter(h => h.stockId === stockId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, days);

    return history.reverse(); // 오래된 것부터
  },

  generateRandomNews: (classroomId, availableStocks) => {
    const todayIndicators = get().getTodayIndicators(classroomId);
    if (!todayIndicators) return [];

    const news: MarketNews[] = [];
    const { indicators } = todayIndicators;

    // 미세먼지 뉴스
    if (Math.random() > 0.5) {
      const envStocks = availableStocks.filter(() => Math.random() > 0.7); // 랜덤하게 일부 환경주 선택
      if (envStocks.length > 0) {
        news.push(get().createEducationalNews(classroomId, '환경', envStocks));
      }
    }

    // 선생님 기분 뉴스
    if (Math.random() > 0.6) {
      const eduStocks = availableStocks.filter(() => Math.random() > 0.7);
      if (eduStocks.length > 0) {
        news.push(get().createEducationalNews(classroomId, '교육', eduStocks));
      }
    }

    // 급식 뉴스
    if (Math.random() > 0.7) {
      const foodStocks = availableStocks.filter(() => Math.random() > 0.8);
      if (foodStocks.length > 0) {
        news.push(get().createEducationalNews(classroomId, '식품', foodStocks));
      }
    }

    return news;
  },

  getActiveNews: (classroomId) => {
    const now = new Date();
    return get().marketNews.filter(news =>
      news.classroomId === classroomId &&
      news.isActive &&
      (!news.expiresAt || new Date(news.expiresAt) > now)
    );
  },

  getTodayIndicators: (classroomId) => {
    const today = new Date().toISOString().split('T')[0];
    return get().marketIndicators.find(
      ind => ind.classroomId === classroomId && ind.date === today
    ) || null;
  },

  createEducationalNews: (classroomId, type, stockIds) => {
    const todayIndicators = get().getTodayIndicators(classroomId);
    if (!todayIndicators) {
      throw new Error('No indicators found for today');
    }

    const templates = NEWS_TEMPLATES[type as keyof typeof NEWS_TEMPLATES] || [];
    const template = templates[Math.floor(Math.random() * templates.length)];

    let value: number;
    switch (type) {
      case '환경':
        value = todayIndicators.indicators.fineDust;
        break;
      case '교육':
        value = todayIndicators.indicators.teacherMood;
        break;
      case '기술':
        value = todayIndicators.indicators.studentAttendance;
        break;
      case '식품':
        value = todayIndicators.indicators.lunchMenuRating;
        break;
      default:
        value = todayIndicators.indicators.teacherWeight || 70;
    }

    const title = template.title.replace('{value}', value.toString());
    const content = template.content.replace('{value}', value.toString());
    const impact = template.getImpact(value);
    const severity = Math.min(5, Math.max(1, Math.floor(template.getSeverity(value))));

    // 24시간 후 만료
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return get().createMarketNews({
      classroomId,
      title,
      content,
      type: type as any,
      impact,
      severity,
      affectedStocks: stockIds,
      isActive: true,
      expiresAt: expiresAt.toISOString(),
    });
  },
}));

// Auto-persist data on changes
useMarketStore.subscribe(
  (state) => state.marketNews,
  (marketNews) => {
    storageAdapter.set(STORAGE_KEYS.MARKET_NEWS, marketNews);
  }
);

useMarketStore.subscribe(
  (state) => state.marketIndicators,
  (marketIndicators) => {
    storageAdapter.set(STORAGE_KEYS.MARKET_INDICATORS, marketIndicators);
  }
);

useMarketStore.subscribe(
  (state) => state.stockPriceHistory,
  (stockPriceHistory) => {
    storageAdapter.set(STORAGE_KEYS.STOCK_PRICE_HISTORY, stockPriceHistory);
  }
);