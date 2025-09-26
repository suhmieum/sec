import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { storageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';
import { getCurrentISOString } from '../utils';
import type { ID } from '../schemas';

export interface BankSettings {
  id: string;
  classroomId: ID;
  baseInterestRate: number; // 기준금리 (%)
  creditGradeBonuses: {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D': number;
  };
  lastUpdated: string;
  updatedBy: string; // 교사 이름
  changeReason?: string; // 변경 사유
}

export interface BankStatistics {
  totalDeposits: number;
  totalAccounts: number;
  averageCreditScore: number;
  creditScoreDistribution: {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D': number;
  };
  monthlyGrowth: number; // 전월 대비 증감률
}

interface BankAdminState {
  // State
  bankSettings: BankSettings[];
  isLoading: boolean;

  // Actions
  loadBankSettings: () => void;
  getBankSettings: (classroomId: ID) => BankSettings | undefined;
  updateBaseRate: (classroomId: ID, newRate: number, reason?: string, updatedBy?: string) => void;
  updateCreditGradeBonus: (classroomId: ID, grade: keyof BankSettings['creditGradeBonuses'], bonus: number, updatedBy?: string) => void;
  initializeBankSettings: (classroomId: ID) => BankSettings;

  // Statistics
  calculateBankStatistics: (classroomId: ID, students: any[], savingsAccounts: any[]) => BankStatistics;
}

const defaultCreditGradeBonuses: BankSettings['creditGradeBonuses'] = {
  'A+': 2.0,  // +2.0%
  'A': 1.5,   // +1.5%
  'B+': 1.0,  // +1.0%
  'B': 0.5,   // +0.5%
  'C+': 0.0,  // +0.0%
  'C': -0.5,  // -0.5%
  'D': -1.0,  // -1.0%
};

export const useBankAdminStore = create<BankAdminState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    bankSettings: [],
    isLoading: false,

    // Load bank settings from storage
    loadBankSettings: () => {
      try {
        set({ isLoading: true });
        const stored = storageAdapter.get<BankSettings[]>('BANK_SETTINGS') ?? [];
        set({ bankSettings: stored, isLoading: false });
      } catch (error) {
        console.error('Failed to load bank settings:', error);
        set({ bankSettings: [], isLoading: false });
      }
    },

    // Get bank settings for specific classroom
    getBankSettings: (classroomId) => {
      const settings = get().bankSettings.find(s => s.classroomId === classroomId);
      if (!settings) {
        return get().initializeBankSettings(classroomId);
      }
      return settings;
    },

    // Initialize default bank settings for new classroom
    initializeBankSettings: (classroomId) => {
      const newSettings: BankSettings = {
        id: `bank_${classroomId}_${Date.now()}`,
        classroomId,
        baseInterestRate: 3.0, // 기본 3%
        creditGradeBonuses: { ...defaultCreditGradeBonuses },
        lastUpdated: getCurrentISOString(),
        updatedBy: '시스템',
        changeReason: '초기 설정'
      };

      set(state => {
        const updated = [...state.bankSettings, newSettings];
        storageAdapter.set('BANK_SETTINGS', updated);
        return { bankSettings: updated };
      });

      return newSettings;
    },

    // Update base interest rate
    updateBaseRate: (classroomId, newRate, reason = '교사 조정', updatedBy = '은행장') => {
      set(state => {
        const updated = state.bankSettings.map(settings => {
          if (settings.classroomId === classroomId) {
            return {
              ...settings,
              baseInterestRate: newRate,
              lastUpdated: getCurrentISOString(),
              updatedBy,
              changeReason: reason
            };
          }
          return settings;
        });

        // If no existing settings, create new one
        if (!updated.some(s => s.classroomId === classroomId)) {
          const newSettings = get().initializeBankSettings(classroomId);
          newSettings.baseInterestRate = newRate;
          newSettings.changeReason = reason;
          newSettings.updatedBy = updatedBy;
          updated.push(newSettings);
        }

        storageAdapter.set('BANK_SETTINGS', updated);
        return { bankSettings: updated };
      });
    },

    // Update credit grade bonus
    updateCreditGradeBonus: (classroomId, grade, bonus, updatedBy = '은행장') => {
      set(state => {
        const updated = state.bankSettings.map(settings => {
          if (settings.classroomId === classroomId) {
            return {
              ...settings,
              creditGradeBonuses: {
                ...settings.creditGradeBonuses,
                [grade]: bonus
              },
              lastUpdated: getCurrentISOString(),
              updatedBy,
              changeReason: `${grade}등급 우대금리 조정`
            };
          }
          return settings;
        });

        // If no existing settings, create new one
        if (!updated.some(s => s.classroomId === classroomId)) {
          const newSettings = get().initializeBankSettings(classroomId);
          newSettings.creditGradeBonuses[grade] = bonus;
          newSettings.changeReason = `${grade}등급 우대금리 조정`;
          newSettings.updatedBy = updatedBy;
          updated.push(newSettings);
        }

        storageAdapter.set('BANK_SETTINGS', updated);
        return { bankSettings: updated };
      });
    },

    // Calculate bank statistics
    calculateBankStatistics: (classroomId, students, savingsAccounts) => {
      const classroomAccounts = savingsAccounts.filter(acc => acc.classroomId === classroomId);

      // Total deposits calculation (sum of current balances)
      const totalDeposits = classroomAccounts.reduce((sum, acc) => {
        return sum + (acc.principal || 0) + (acc.accruedInterest || 0);
      }, 0);

      // Credit score distribution
      const creditScoreDistribution = {
        'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0
      };

      let totalCreditScore = 0;
      students.forEach(student => {
        if (student.classroomId === classroomId) {
          totalCreditScore += student.creditScore;
          creditScoreDistribution[student.creditGrade as keyof typeof creditScoreDistribution]++;
        }
      });

      const classroomStudents = students.filter(s => s.classroomId === classroomId);
      const averageCreditScore = classroomStudents.length > 0 ?
        Math.round(totalCreditScore / classroomStudents.length) : 0;

      // Monthly growth calculation (dummy data for now)
      const monthlyGrowth = Math.random() * 20 - 5; // -5% to +15% range

      return {
        totalDeposits,
        totalAccounts: classroomAccounts.length,
        averageCreditScore,
        creditScoreDistribution,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      };
    }
  }))
);

// Auto-load settings on store initialization
useBankAdminStore.getState().loadBankSettings();

// Auto-persist settings on changes
useBankAdminStore.subscribe(
  (state) => state.bankSettings,
  (bankSettings) => {
    storageAdapter.set('BANK_SETTINGS', bankSettings);
  }
);