import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStudentStore } from './studentStore';
import { useJobStore } from './jobStore';
import { useStockStore } from './stockStore';
import { useSavingsStore } from './savingsStore';
import type { Transaction, MarketParticipation, SavingsRate, ActivityHeatmap } from '../schemas';

interface EconomicMetrics {
  giniCoefficient: number; // 지니계수 (빈부격차)
  inflationRate: number; // 인플레이션율
  marketParticipation: number; // 시장 참여율
  savingsRate: number; // 저축률
  tradingVolume: number; // 거래량
  averageBalance: number; // 평균 잔고
  totalCirculation: number; // 총 통화량
  employmentRate: number; // 고용률
}

interface StudentActivity {
  studentId: string;
  studentName: string;
  lastActivityDate: string;
  totalTransactions: number;
  weeklyActivity: number[]; // 요일별 활동 (0-6)
  hourlyActivity: number[]; // 시간대별 활동 (0-23)
  activityScore: number; // 활동 점수 (0-100)
}

interface AnalyticsState {
  // Data Storage
  marketParticipation: MarketParticipation[];
  savingsRates: SavingsRate[];
  activityHeatmap: ActivityHeatmap[];

  // Data Management
  addMarketParticipation: (data: MarketParticipation) => void;
  addSavingsRate: (data: SavingsRate) => void;
  addActivityHeatmap: (data: ActivityHeatmap) => void;
  getMarketParticipationByClassroom: (classroomId: string) => MarketParticipation[];
  getSavingsRatesByClassroom: (classroomId: string) => SavingsRate[];
  getActivityHeatmapByClassroom: (classroomId: string) => ActivityHeatmap[];

  // Economic Metrics
  calculateEconomicMetrics: (classroomId: string) => EconomicMetrics;
  calculateGiniCoefficient: (balances: number[]) => number;
  calculateInflationRate: (classroomId: string, period?: number) => number;
  calculateMarketParticipation: (classroomId: string) => number;

  // Student Activity Analysis
  getStudentActivityHeatmap: (classroomId: string) => StudentActivity[];
  analyzeTransactionPatterns: (classroomId: string, studentId?: string) => any;

  // Predictions
  predictEconomicTrend: (classroomId: string) => 'growing' | 'stable' | 'declining';
  identifyRiskStudents: (classroomId: string) => string[]; // 경제적 위험 학생

  // Reports
  generateClassroomReport: (classroomId: string) => any;
  generateStudentReport: (studentId: string) => any;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
  // Data Storage
  marketParticipation: [],
  savingsRates: [],
  activityHeatmap: [],

  // Data Management Functions
  addMarketParticipation: (data) => set(state => ({
    marketParticipation: [...state.marketParticipation, data]
  })),

  addSavingsRate: (data) => set(state => ({
    savingsRates: [...state.savingsRates, data]
  })),

  addActivityHeatmap: (data) => set(state => ({
    activityHeatmap: [...state.activityHeatmap, data]
  })),

  getMarketParticipationByClassroom: (classroomId) => {
    return get().marketParticipation.filter(mp => mp.classroomId === classroomId);
  },

  getSavingsRatesByClassroom: (classroomId) => {
    return get().savingsRates.filter(sr => sr.classroomId === classroomId);
  },

  getActivityHeatmapByClassroom: (classroomId) => {
    return get().activityHeatmap.filter(ah => ah.classroomId === classroomId);
  },

  calculateEconomicMetrics: (classroomId) => {
    const students = useStudentStore.getState().getStudentsByClassroom(classroomId);
    const jobs = useJobStore.getState().getJobsByClassroom(classroomId);
    const stockStore = useStockStore.getState();
    const savingsStore = useSavingsStore.getState();

    // 학생 잔고 배열
    const balances = students.map(s => s.balance);

    // 지니계수 계산
    const giniCoefficient = get().calculateGiniCoefficient(balances);

    // 평균 잔고
    const averageBalance = balances.reduce((a, b) => a + b, 0) / balances.length || 0;

    // 총 통화량
    const totalCirculation = balances.reduce((a, b) => a + b, 0);

    // 시장 참여율 - 저장된 데이터에서 최신값 가져오기
    const marketParticipationData = get().getMarketParticipationByClassroom(classroomId);
    const latestMarketParticipation = marketParticipationData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const marketParticipation = latestMarketParticipation
      ? latestMarketParticipation.participationRate * 100
      : 0;

    // 저축률 - 저장된 데이터에서 최신값 가져오기
    const savingsRateData = get().getSavingsRatesByClassroom(classroomId);
    const latestSavingsRate = savingsRateData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const savingsRate = latestSavingsRate
      ? latestSavingsRate.savingsRate * 100
      : 0;

    // 고용률
    const employedStudents = students.filter(s => s.jobId).length;
    const employmentRate = (employedStudents / students.length) * 100 || 0;

    // 거래량 (최근 7일)
    const recentTransactions = stockStore.stockTransactions.filter(t => {
      const transDate = new Date(t.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return t.classroomId === classroomId && transDate >= weekAgo;
    });
    const tradingVolume = recentTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // 인플레이션율 계산 (간단한 버전)
    const inflationRate = get().calculateInflationRate(classroomId);

    return {
      giniCoefficient,
      inflationRate,
      marketParticipation,
      savingsRate,
      tradingVolume,
      averageBalance,
      totalCirculation,
      employmentRate
    };
  },

  calculateGiniCoefficient: (balances) => {
    if (balances.length === 0) return 0;

    const sorted = [...balances].sort((a, b) => a - b);
    const n = sorted.length;
    const cumSum = sorted.reduce((acc, val, i) => {
      acc.push((acc[i - 1] || 0) + val);
      return acc;
    }, [] as number[]);

    const totalWealth = cumSum[n - 1];
    if (totalWealth === 0) return 0;

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
      giniSum += (n - i) * sorted[i];
    }

    return ((2 * giniSum) / (n * totalWealth)) - ((n + 1) / n);
  },

  calculateInflationRate: (classroomId, period = 30) => {
    const stockStore = useStockStore.getState();
    const stocks = stockStore.getStocksByClassroom(classroomId);

    if (stocks.length === 0) return 0;

    // 주식 가격 변동률로 인플레이션 추정
    const priceChanges = stocks.map(stock => {
      const changeRate = ((stock.currentPrice - stock.previousPrice) / stock.previousPrice) * 100;
      return changeRate;
    });

    const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;

    // 연간 인플레이션율로 환산 (단순화)
    return avgPriceChange * 12;
  },

  calculateMarketParticipation: (classroomId) => {
    const students = useStudentStore.getState().getStudentsByClassroom(classroomId);
    const stockStore = useStockStore.getState();

    const activeTraders = students.filter(student => {
      const transactions = stockStore.getTransactionsByStudent(student.id);
      const recentTrades = transactions.filter(t => {
        const tradeDate = new Date(t.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tradeDate >= weekAgo;
      });
      return recentTrades.length > 0;
    });

    return (activeTraders.length / students.length) * 100 || 0;
  },

  getStudentActivityHeatmap: (classroomId) => {
    const students = useStudentStore.getState().getStudentsByClassroom(classroomId);
    const activityData = get().getActivityHeatmapByClassroom(classroomId);

    return students.map(student => {
      const studentActivity = activityData.filter(ah => ah.studentId === student.id);

      // 요일별 활동 집계 (0-6: 일-토)
      const weeklyActivity = new Array(7).fill(0);
      const hourlyActivity = new Array(24).fill(0);

      studentActivity.forEach(activity => {
        weeklyActivity[activity.dayOfWeek] += activity.transactionCount;
        hourlyActivity[activity.hour] += activity.transactionCount;
      });

      // 최근 활동 날짜와 총 거래 수
      const totalTransactions = studentActivity.reduce((sum, a) => sum + a.transactionCount, 0);
      const lastActivity = studentActivity.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      // 활동 점수 계산 (0-100) - 활동도 기반
      const avgActivityLevel = studentActivity.length > 0
        ? studentActivity.reduce((sum, a) => sum + a.activityLevel, 0) / studentActivity.length
        : 0;
      const activityScore = Math.round(avgActivityLevel * 100);

      return {
        studentId: student.id,
        studentName: student.name,
        lastActivityDate: lastActivity?.createdAt || '',
        totalTransactions,
        weeklyActivity,
        hourlyActivity,
        activityScore
      };
    });
  },

  analyzeTransactionPatterns: (classroomId, studentId) => {
    const stockStore = useStockStore.getState();
    const transactions = studentId
      ? stockStore.getTransactionsByStudent(studentId)
      : stockStore.stockTransactions.filter(t => t.classroomId === classroomId);

    // 거래 패턴 분석
    const buyCount = transactions.filter(t => t.type === 'buy').length;
    const sellCount = transactions.filter(t => t.type === 'sell').length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // 시간대별 패턴
    const hourlyPattern = new Array(24).fill(0);
    transactions.forEach(t => {
      const hour = new Date(t.createdAt).getHours();
      hourlyPattern[hour]++;
    });

    // 가장 활발한 시간대
    const peakHour = hourlyPattern.indexOf(Math.max(...hourlyPattern));

    return {
      totalTransactions: transactions.length,
      buyCount,
      sellCount,
      buyRatio: buyCount / (buyCount + sellCount) || 0,
      totalVolume,
      averageTransactionSize: totalVolume / transactions.length || 0,
      hourlyPattern,
      peakHour,
      tradingStyle: buyCount > sellCount * 1.5 ? 'aggressive' : sellCount > buyCount * 1.5 ? 'conservative' : 'balanced'
    };
  },

  predictEconomicTrend: (classroomId) => {
    const metrics = get().calculateEconomicMetrics(classroomId);

    // 간단한 트렌드 예측 로직
    let score = 0;

    if (metrics.marketParticipation > 70) score += 2;
    else if (metrics.marketParticipation > 40) score += 1;
    else score -= 1;

    if (metrics.employmentRate > 80) score += 2;
    else if (metrics.employmentRate > 50) score += 1;
    else score -= 1;

    if (metrics.savingsRate > 30) score += 1;
    else if (metrics.savingsRate < 10) score -= 1;

    if (metrics.giniCoefficient < 0.3) score += 1;
    else if (metrics.giniCoefficient > 0.5) score -= 2;

    if (score >= 3) return 'growing';
    if (score <= -2) return 'declining';
    return 'stable';
  },

  identifyRiskStudents: (classroomId) => {
    const students = useStudentStore.getState().getStudentsByClassroom(classroomId);
    const averageBalance = students.reduce((sum, s) => sum + s.balance, 0) / students.length;

    return students
      .filter(s => {
        // 위험 지표: 평균 이하 잔고, 실업, 낮은 신용점수
        const isLowBalance = s.balance < averageBalance * 0.3;
        const isUnemployed = !s.jobId;
        const hasLowCredit = s.creditScore < 500;

        return isLowBalance && (isUnemployed || hasLowCredit);
      })
      .map(s => s.id);
  },

  generateClassroomReport: (classroomId) => {
    const metrics = get().calculateEconomicMetrics(classroomId);
    const trend = get().predictEconomicTrend(classroomId);
    const riskStudents = get().identifyRiskStudents(classroomId);
    const activityHeatmap = get().getStudentActivityHeatmap(classroomId);

    return {
      metrics,
      trend,
      riskStudents,
      activityHeatmap,
      timestamp: new Date().toISOString()
    };
  },

  generateStudentReport: (studentId) => {
    const student = useStudentStore.getState().students.find(s => s.id === studentId);
    if (!student) return null;

    const stockStore = useStockStore.getState();
    const savingsStore = useSavingsStore.getState();

    const portfolio = stockStore.getPortfolioByStudent(studentId);
    const portfolioValue = stockStore.calculatePortfolioValue(studentId);
    const savingsAccounts = savingsStore.getSavingsAccountsByStudent(studentId);
    const transactions = stockStore.getTransactionsByStudent(studentId);
    const transactionPattern = get().analyzeTransactionPatterns(student.classroomId, studentId);

    return {
      student,
      portfolio,
      portfolioValue,
      savingsAccounts,
      totalAssets: student.balance + portfolioValue + savingsAccounts.reduce((sum, a) => sum + a.totalBalance, 0),
      transactionHistory: transactions,
      transactionPattern,
      creditScore: student.creditScore,
      creditGrade: student.creditGrade,
      achievements: student.achievements
    };
  }
}),
{
  name: 'analytics-storage',
  partialize: (state) => ({
    marketParticipation: state.marketParticipation,
    savingsRates: state.savingsRates,
    activityHeatmap: state.activityHeatmap,
  }),
}
)
);