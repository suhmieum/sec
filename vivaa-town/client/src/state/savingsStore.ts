import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SavingsAccount } from '../schemas';
import { storageAdapter } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface SavingsState {
  savingsAccounts: SavingsAccount[];
  lastInterestProcessDate: string | null;

  // Actions
  loadSavingsAccounts: () => void;
  createSavingsAccount: (data: Omit<SavingsAccount, 'id' | 'createdAt' | 'totalBalance'>) => SavingsAccount;
  updateSavingsAccount: (id: string, updates: Partial<SavingsAccount>) => void;
  deleteSavingsAccount: (id: string) => void;

  // Queries
  getSavingsAccount: (id: string) => SavingsAccount | undefined;
  getSavingsAccountsByStudent: (studentId: string) => SavingsAccount[];
  getSavingsAccountsByClassroom: (classroomId: string) => SavingsAccount[];

  // Business Logic
  makeMonthlyDeposit: (accountId: string, amount: number) => boolean;
  withdrawFromSavings: (accountId: string, amount: number) => boolean;
  calculateMaturityAmount: (accountId: string) => number;
  processMaturity: (accountId: string) => boolean;

  // Auto Process
  processMonthlyInterest: () => number; // 월별 이자 자동 처리
  checkAndProcessInterest: () => void; // 이자 처리 체크
  getUpcomingMaturityAccounts: (days?: number) => SavingsAccount[]; // 만기 임박 계좌

  // Utilities
  calculateCurrentBalance: (account: SavingsAccount) => number;
  getRemainingMonths: (account: SavingsAccount) => number;
  getMonthlyInterest: (account: SavingsAccount) => number;
  getTotalInterestPaidThisMonth: () => number;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savingsAccounts: [],
  lastInterestProcessDate: null,

  loadSavingsAccounts: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.SAVINGS_ACCOUNTS);
    const lastProcessDate = storageAdapter.get('lastInterestProcessDate');

    if (stored) {
      set({
        savingsAccounts: stored,
        lastInterestProcessDate: lastProcessDate
      });

      // 로드 후 자동으로 이자 처리 체크
      setTimeout(() => get().checkAndProcessInterest(), 100);
    }
  },

  createSavingsAccount: (data) => {
    const now = new Date().toISOString();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + data.termMonths);

    const newAccount: SavingsAccount = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      maturityDate: maturityDate.toISOString(),
      totalBalance: data.type === 'deposit' ? data.principal : 0, // 예금은 처음에 원금 입금
      isMatured: false,
      autoRenewal: false,
    };

    set((state) => ({
      savingsAccounts: [...state.savingsAccounts, newAccount]
    }));

    return newAccount;
  },

  updateSavingsAccount: (id, updates) => {
    set((state) => ({
      savingsAccounts: state.savingsAccounts.map(account =>
        account.id === id ? { ...account, ...updates } : account
      )
    }));
  },

  deleteSavingsAccount: (id) => {
    set((state) => ({
      savingsAccounts: state.savingsAccounts.filter(account => account.id !== id)
    }));
  },

  getSavingsAccount: (id) => {
    return get().savingsAccounts.find(account => account.id === id);
  },

  getSavingsAccountsByStudent: (studentId) => {
    return get().savingsAccounts.filter(account => account.studentId === studentId);
  },

  getSavingsAccountsByClassroom: (classroomId) => {
    return get().savingsAccounts.filter(account => account.classroomId === classroomId);
  },

  makeMonthlyDeposit: (accountId, amount) => {
    const account = get().getSavingsAccount(accountId);
    if (!account || account.type !== 'savings' || account.isMatured) return false;

    const newBalance = account.totalBalance + amount;
    get().updateSavingsAccount(accountId, { totalBalance: newBalance });
    return true;
  },

  withdrawFromSavings: (accountId, amount) => {
    const account = get().getSavingsAccount(accountId);
    if (!account || amount <= 0) return false;

    // 만기 전 중도해지는 이자 손실이 있다고 가정
    let availableAmount = account.totalBalance;
    if (!account.isMatured) {
      // 중도해지 시 이자 50% 손실
      const penalty = get().getMonthlyInterest(account) * 0.5;
      availableAmount = Math.max(account.principal, account.totalBalance - penalty);
    }

    if (availableAmount < amount) return false;

    const newBalance = account.totalBalance - amount;
    get().updateSavingsAccount(accountId, { totalBalance: newBalance });
    return true;
  },

  calculateMaturityAmount: (accountId) => {
    const account = get().getSavingsAccount(accountId);
    if (!account) return 0;

    const monthlyRate = account.interestRate / 100 / 12;
    const months = account.termMonths;

    if (account.type === 'deposit') {
      // 예금: 복리 계산
      return account.principal * Math.pow(1 + monthlyRate, months);
    } else {
      // 적금: 월복리 적금 공식
      if (monthlyRate === 0) return account.monthlyDeposit * months;
      return account.monthlyDeposit * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    }
  },

  processMaturity: (accountId) => {
    const account = get().getSavingsAccount(accountId);
    if (!account || account.isMatured) return false;

    const maturityAmount = get().calculateMaturityAmount(accountId);
    get().updateSavingsAccount(accountId, {
      totalBalance: maturityAmount,
      isMatured: true
    });

    return true;
  },

  calculateCurrentBalance: (account) => {
    if (account.type === 'deposit') {
      // 예금의 경우 현재까지의 복리 이자 계산
      const monthsElapsed = Math.floor(
        (Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      const monthlyRate = account.interestRate / 100 / 12;
      return account.principal * Math.pow(1 + monthlyRate, Math.min(monthsElapsed, account.termMonths));
    }

    return account.totalBalance; // 적금은 실제 입금액
  },

  getRemainingMonths: (account) => {
    const monthsElapsed = Math.floor(
      (Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    return Math.max(0, account.termMonths - monthsElapsed);
  },

  getMonthlyInterest: (account) => {
    const monthlyRate = account.interestRate / 100 / 12;
    if (account.type === 'deposit') {
      return account.principal * monthlyRate;
    } else {
      return account.totalBalance * monthlyRate;
    }
  },

  // 월별 이자 자동 처리
  processMonthlyInterest: () => {
    const { savingsAccounts } = get();
    let totalInterest = 0;

    const updatedAccounts = savingsAccounts.map(account => {
      if (account.isMatured) return account;

      const monthlyInterest = get().getMonthlyInterest(account);
      totalInterest += monthlyInterest;

      return {
        ...account,
        totalBalance: account.totalBalance + monthlyInterest
      };
    });

    set({
      savingsAccounts: updatedAccounts,
      lastInterestProcessDate: new Date().toISOString()
    });

    // 마지막 처리 날짜 저장
    storageAdapter.set('lastInterestProcessDate', new Date().toISOString());

    return totalInterest;
  },

  // 이자 처리 체크 (매월 1일 자동 처리)
  checkAndProcessInterest: () => {
    const { lastInterestProcessDate } = get();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 마지막 처리 날짜가 없거나, 현재 월과 다른 경우 처리
    if (!lastInterestProcessDate) {
      get().processMonthlyInterest();
      return;
    }

    const lastProcessDate = new Date(lastInterestProcessDate);
    const lastMonth = `${lastProcessDate.getFullYear()}-${String(lastProcessDate.getMonth() + 1).padStart(2, '0')}`;

    if (currentMonth !== lastMonth) {
      const totalInterest = get().processMonthlyInterest();

      // 알림 표시 (NotificationSystem이 있다면)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('bankingNotification', {
          detail: {
            type: 'info',
            title: '💰 월간 이자 지급',
            message: `총 ${totalInterest.toLocaleString()}원의 이자가 자동 지급되었습니다.`
          }
        }));
      }
    }
  },

  // 만기 임박 계좌
  getUpcomingMaturityAccounts: (days = 30) => {
    const { savingsAccounts } = get();
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return savingsAccounts.filter(account => {
      if (account.isMatured) return false;

      const maturityDate = new Date(account.maturityDate);
      return maturityDate <= targetDate && maturityDate > new Date();
    });
  },

  // 이번 달 지급된 총 이자
  getTotalInterestPaidThisMonth: () => {
    const { lastInterestProcessDate } = get();
    if (!lastInterestProcessDate) return 0;

    const lastProcessDate = new Date(lastInterestProcessDate);
    const now = new Date();

    // 같은 월인지 확인
    if (
      lastProcessDate.getFullYear() === now.getFullYear() &&
      lastProcessDate.getMonth() === now.getMonth()
    ) {
      return get().savingsAccounts.reduce((sum, account) => {
        return sum + get().getMonthlyInterest(account);
      }, 0);
    }

    return 0;
  },
}));

// Auto-persist savings accounts on changes
useSavingsStore.subscribe(
  (state) => state.savingsAccounts,
  (savingsAccounts) => {
    storageAdapter.set(STORAGE_KEYS.SAVINGS_ACCOUNTS, savingsAccounts);
  }
);