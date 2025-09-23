import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Stock, StockTransaction, StockPortfolio } from '../schemas';
import { storageAdapter } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface StockState {
  stocks: Stock[];
  stockTransactions: StockTransaction[];
  stockPortfolios: StockPortfolio[];

  // Actions
  loadStocks: () => void;
  loadStockTransactions: () => void;
  loadStockPortfolios: () => void;

  createStock: (data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) => Stock;
  updateStock: (id: string, updates: Partial<Stock>) => void;
  deleteStock: (id: string) => void;

  buyStock: (studentId: string, stockId: string, quantity: number, price: number) => boolean;
  sellStock: (studentId: string, stockId: string, quantity: number, price: number) => boolean;
  addStockTransaction: (transaction: Omit<StockTransaction, 'id' | 'createdAt'>) => StockTransaction;
  createStockPortfolio: (portfolio: Omit<StockPortfolio, 'id'>) => StockPortfolio;

  // Queries
  getStock: (id: string) => Stock | undefined;
  getStocksByClassroom: (classroomId: string) => Stock[];
  getPortfolioByStudent: (studentId: string) => StockPortfolio[];
  getTransactionsByStudent: (studentId: string) => StockTransaction[];

  // Market simulation
  updateStockPrices: (classroomId: string) => void;
  getMarketMood: (classroomId: string) => 'bullish' | 'bearish' | 'neutral';

  // Utils
  calculatePortfolioValue: (studentId: string) => number;
  calculateProfitLoss: (studentId: string, stockId: string) => number;
  getTotalInvestment: (studentId: string) => number;
}

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  stockTransactions: [],
  stockPortfolios: [],

  loadStocks: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.STOCKS);
    if (stored) {
      set({ stocks: stored });
    }
  },

  loadStockTransactions: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.STOCK_TRANSACTIONS);
    if (stored) {
      set({ stockTransactions: stored });
    }
  },

  loadStockPortfolios: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.STOCK_PORTFOLIOS);
    if (stored) {
      set({ stockPortfolios: stored });
    }
  },

  createStock: (data) => {
    const now = new Date().toISOString();
    const newStock: Stock = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      stocks: [...state.stocks, newStock]
    }));

    return newStock;
  },

  updateStock: (id, updates) => {
    set((state) => ({
      stocks: state.stocks.map(stock =>
        stock.id === id ? { ...stock, ...updates, updatedAt: new Date().toISOString() } : stock
      )
    }));
  },

  deleteStock: (id) => {
    set((state) => ({
      stocks: state.stocks.filter(stock => stock.id !== id)
    }));
  },

  buyStock: (studentId, stockId, quantity, price) => {
    const stock = get().getStock(stockId);
    if (!stock) return false;

    const totalCost = quantity * price;
    const fee = Math.floor(totalCost * 0.01); // 1% 수수료
    const totalAmount = totalCost + fee;

    // 거래 기록 추가
    const transaction: StockTransaction = {
      id: uuidv4(),
      classroomId: stock.classroomId,
      studentId,
      stockId,
      type: 'buy',
      quantity,
      price,
      totalAmount,
      fee,
      createdAt: new Date().toISOString(),
    };

    // 포트폴리오 업데이트
    const existingPortfolio = get().stockPortfolios.find(
      p => p.studentId === studentId && p.stockId === stockId
    );

    if (existingPortfolio) {
      // 기존 보유 종목 추가 매수
      const newQuantity = existingPortfolio.quantity + quantity;
      const newTotalCost = existingPortfolio.totalCost + totalCost;
      const newAveragePrice = newTotalCost / newQuantity;

      set((state) => ({
        stockPortfolios: state.stockPortfolios.map(portfolio =>
          portfolio.id === existingPortfolio.id
            ? {
                ...portfolio,
                quantity: newQuantity,
                averagePrice: newAveragePrice,
                totalCost: newTotalCost,
                updatedAt: new Date().toISOString(),
              }
            : portfolio
        ),
        stockTransactions: [...state.stockTransactions, transaction]
      }));
    } else {
      // 신규 종목 매수
      const newPortfolio: StockPortfolio = {
        id: uuidv4(),
        classroomId: stock.classroomId,
        studentId,
        stockId,
        quantity,
        averagePrice: price,
        totalCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      set((state) => ({
        stockPortfolios: [...state.stockPortfolios, newPortfolio],
        stockTransactions: [...state.stockTransactions, transaction]
      }));
    }

    return true;
  },

  sellStock: (studentId, stockId, quantity, price) => {
    const stock = get().getStock(stockId);
    const portfolio = get().stockPortfolios.find(
      p => p.studentId === studentId && p.stockId === stockId
    );

    if (!stock || !portfolio || portfolio.quantity < quantity) return false;

    const totalAmount = quantity * price;
    const fee = Math.floor(totalAmount * 0.01); // 1% 수수료
    const netAmount = totalAmount - fee;

    // 거래 기록 추가
    const transaction: StockTransaction = {
      id: uuidv4(),
      classroomId: stock.classroomId,
      studentId,
      stockId,
      type: 'sell',
      quantity,
      price,
      totalAmount: netAmount,
      fee,
      createdAt: new Date().toISOString(),
    };

    // 포트폴리오 업데이트
    const newQuantity = portfolio.quantity - quantity;
    const soldCost = (portfolio.totalCost / portfolio.quantity) * quantity;
    const newTotalCost = portfolio.totalCost - soldCost;

    if (newQuantity === 0) {
      // 전량 매도 시 포트폴리오에서 제거
      set((state) => ({
        stockPortfolios: state.stockPortfolios.filter(p => p.id !== portfolio.id),
        stockTransactions: [...state.stockTransactions, transaction]
      }));
    } else {
      // 일부 매도
      set((state) => ({
        stockPortfolios: state.stockPortfolios.map(p =>
          p.id === portfolio.id
            ? {
                ...p,
                quantity: newQuantity,
                totalCost: newTotalCost,
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
        stockTransactions: [...state.stockTransactions, transaction]
      }));
    }

    return true;
  },

  getStock: (id) => {
    return get().stocks.find(stock => stock.id === id);
  },

  getStocksByClassroom: (classroomId) => {
    return get().stocks.filter(stock => stock.classroomId === classroomId);
  },

  getPortfolioByStudent: (studentId) => {
    return get().stockPortfolios.filter(portfolio => portfolio.studentId === studentId);
  },

  getTransactionsByStudent: (studentId) => {
    return get().stockTransactions.filter(transaction => transaction.studentId === studentId);
  },

  updateStockPrices: (classroomId) => {
    const classroomStocks = get().getStocksByClassroom(classroomId);

    classroomStocks.forEach(stock => {
      // 교육적 지표 기반 주가 변동 시뮬레이션
      let priceChange = 0;
      const volatility = 0.05; // 5% 변동성

      // 섹터별 특성 반영
      switch (stock.sector) {
        case '환경':
          // 미세먼지, 날씨 등에 영향
          const environmentFactor = Math.random() > 0.6 ? 1.02 : 0.98; // 환경주는 대체로 상승
          priceChange = (Math.random() - 0.5) * volatility * environmentFactor;
          break;
        case '교육':
          // 교육 관련 뉴스, 정책에 영향
          const educationFactor = Math.random() > 0.5 ? 1.01 : 0.99;
          priceChange = (Math.random() - 0.5) * volatility * educationFactor;
          break;
        case '기술':
          // 변동성이 큰 기술주
          priceChange = (Math.random() - 0.5) * volatility * 1.5;
          break;
        case '식품':
          // 안정적인 생필품
          priceChange = (Math.random() - 0.5) * volatility * 0.7;
          break;
        default:
          priceChange = (Math.random() - 0.5) * volatility;
      }

      const newPrice = Math.max(
        stock.currentPrice * 0.5, // 최소 50%까지만 하락
        Math.floor(stock.currentPrice * (1 + priceChange))
      );

      get().updateStock(stock.id, {
        previousPrice: stock.currentPrice,
        currentPrice: newPrice,
      });
    });
  },

  getMarketMood: (classroomId) => {
    const stocks = get().getStocksByClassroom(classroomId);
    if (stocks.length === 0) return 'neutral';

    const gainers = stocks.filter(stock => stock.currentPrice > stock.previousPrice).length;
    const total = stocks.length;
    const gainerRatio = gainers / total;

    if (gainerRatio > 0.6) return 'bullish';
    if (gainerRatio < 0.4) return 'bearish';
    return 'neutral';
  },

  calculatePortfolioValue: (studentId) => {
    const portfolios = get().getPortfolioByStudent(studentId);
    const { stocks } = get();

    return portfolios.reduce((total, portfolio) => {
      const stock = stocks.find(s => s.id === portfolio.stockId);
      if (!stock) return total;
      return total + (portfolio.quantity * stock.currentPrice);
    }, 0);
  },

  calculateProfitLoss: (studentId, stockId) => {
    const portfolio = get().stockPortfolios.find(
      p => p.studentId === studentId && p.stockId === stockId
    );
    const stock = get().getStock(stockId);

    if (!portfolio || !stock) return 0;

    const currentValue = portfolio.quantity * stock.currentPrice;
    return currentValue - portfolio.totalCost;
  },

  getTotalInvestment: (studentId) => {
    const portfolios = get().getPortfolioByStudent(studentId);
    return portfolios.reduce((total, portfolio) => total + portfolio.totalCost, 0);
  },

  addStockTransaction: (transaction) => {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    set(state => {
      const updated = [...state.stockTransactions, newTransaction];
      storageAdapter.set(STORAGE_KEYS.STOCK_TRANSACTIONS, updated);
      return { stockTransactions: updated };
    });

    return newTransaction;
  },

  createStockPortfolio: (portfolio) => {
    const newPortfolio: StockPortfolio = {
      ...portfolio,
      id: uuidv4(),
    };

    set(state => {
      const updated = [...state.stockPortfolios, newPortfolio];
      storageAdapter.set(STORAGE_KEYS.STOCK_PORTFOLIOS, updated);
      return { stockPortfolios: updated };
    });

    return newPortfolio;
  },
}));

// Auto-persist stocks on changes
useStockStore.subscribe(
  (state) => state.stocks,
  (stocks) => {
    storageAdapter.set(STORAGE_KEYS.STOCKS, stocks);
  }
);

useStockStore.subscribe(
  (state) => state.stockTransactions,
  (transactions) => {
    storageAdapter.set(STORAGE_KEYS.STOCK_TRANSACTIONS, transactions);
  }
);

useStockStore.subscribe(
  (state) => state.stockPortfolios,
  (portfolios) => {
    storageAdapter.set(STORAGE_KEYS.STOCK_PORTFOLIOS, portfolios);
  }
);