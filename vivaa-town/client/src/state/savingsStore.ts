import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SavingsAccount } from '../schemas';
import { storageAdapter } from '../utils/storageAdapter';
import { STORAGE_KEYS } from '../storage/keys';

interface SavingsState {
  savingsAccounts: SavingsAccount[];

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

  // Utilities
  calculateCurrentBalance: (account: SavingsAccount) => number;
  getRemainingMonths: (account: SavingsAccount) => number;
  getMonthlyInterest: (account: SavingsAccount) => number;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  savingsAccounts: [],

  loadSavingsAccounts: () => {
    const stored = storageAdapter.get(STORAGE_KEYS.SAVINGS_ACCOUNTS);
    if (stored) {
      set({ savingsAccounts: stored });
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
}));

// Auto-persist savings accounts on changes
useSavingsStore.subscribe(
  (state) => state.savingsAccounts,
  (savingsAccounts) => {
    storageAdapter.set(STORAGE_KEYS.SAVINGS_ACCOUNTS, savingsAccounts);
  }
);