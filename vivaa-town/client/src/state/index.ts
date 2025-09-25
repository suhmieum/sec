// Export all stores
export { useAppStore } from './appStore';
export { useClassroomStore } from './classroomStore';
export { useStudentStore } from './studentStore';
export { useJobStore } from './jobStore';
export { useSavingsStore } from './savingsStore';
export { useStockStore } from './stockStore';
export { useAchievementStore } from './achievementStore';
export { useMarketStore } from './marketStore';
export { useAnalyticsStore } from './analyticsStore';
export { useAIPlanStore } from './aiPlanStore';
export { usePortfolioStore } from './portfolioStore';
export { usePremiumStore } from './premiumStore';

// Import hooks for use in selectors
import { useAppStore } from './appStore';
import { useClassroomStore } from './classroomStore';
import { useStudentStore } from './studentStore';
import { useJobStore } from './jobStore';
import { useSavingsStore } from './savingsStore';
import { useStockStore } from './stockStore';
import { useAchievementStore } from './achievementStore';
import { useMarketStore } from './marketStore';

// Combined initialization hook
export const useInitializeStores = () => {
  const initializeApp = useAppStore(state => state.initialize);
  const loadClassrooms = useClassroomStore(state => state.loadClassrooms);
  const loadStudents = useStudentStore(state => state.loadStudents);
  const loadJobs = useJobStore(state => state.loadJobs);
  const loadSavingsAccounts = useSavingsStore(state => state.loadSavingsAccounts);
  const loadStocks = useStockStore(state => state.loadStocks);
  const loadStockTransactions = useStockStore(state => state.loadStockTransactions);
  const loadStockPortfolios = useStockStore(state => state.loadStockPortfolios);
  const loadAchievements = useAchievementStore(state => state.loadAchievements);
  const loadStudentAchievements = useAchievementStore(state => state.loadStudentAchievements);
  const createDefaultAchievements = useAchievementStore(state => state.createDefaultAchievements);
  const loadMarketNews = useMarketStore(state => state.loadMarketNews);
  const loadMarketIndicators = useMarketStore(state => state.loadMarketIndicators);
  const loadStockPriceHistory = useMarketStore(state => state.loadStockPriceHistory);

  const initialize = () => {
    initializeApp();
    loadClassrooms();
    loadStudents();
    loadJobs();
    loadSavingsAccounts();
    loadStocks();
    loadStockTransactions();
    loadStockPortfolios();
    loadAchievements();
    loadStudentAchievements();
    createDefaultAchievements('default');
    loadMarketNews();
    loadMarketIndicators();
    loadStockPriceHistory();
  };

  return { initialize };
};

// Commonly used selectors
export const useCurrentClassroom = () => {
  const currentClassId = useAppStore(state => state.currentClassId);
  const getClassroom = useClassroomStore(state => state.getClassroom);

  return currentClassId ? getClassroom(currentClassId) : null;
};

export const useCurrentStudents = () => {
  const currentClassId = useAppStore(state => state.currentClassId);
  const getStudentsByClassroom = useStudentStore(state => state.getStudentsByClassroom);

  return currentClassId ? getStudentsByClassroom(currentClassId) : [];
};

export const useCurrentJobs = () => {
  const currentClassId = useAppStore(state => state.currentClassId);
  const getJobsByClassroom = useJobStore(state => state.getJobsByClassroom);

  return currentClassId ? getJobsByClassroom(currentClassId) : [];
};