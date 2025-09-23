export interface Class {
  id: string;
  name: string;
  description?: string;
  currencyUnit: string;
  treasury: number;
  donation: number;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  nickname?: string;
  jobTitle?: string;
  salary: number;
  balance: number;
  creditScore: number;
  totalIncome: number;
  totalSpending: number;
  createdAt: string;
}

export interface Job {
  id: string;
  classId: string;
  title: string;
  description?: string;
  salary: number;
  maxPositions: number;
  currentPositions: number;
}

export interface Transaction {
  id: string;
  classId: string;
  from: string;
  to: string;
  amount: number;
  type: 'salary' | 'purchase' | 'transfer' | 'tax' | 'fine' | 'donation';
  description: string;
  timestamp: string;
  afterBalanceFrom?: number;
  afterBalanceTo?: number;
}

export interface Item {
  id: string;
  classId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  forSale: boolean;
  studentTradable: boolean;
}