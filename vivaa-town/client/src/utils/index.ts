import { nanoid } from 'nanoid';
import { format } from 'date-fns';

// ID generation
export const generateId = () => nanoid();

// Date utilities
export const getCurrentISOString = () => new Date().toISOString();

export const formatDate = (dateString: string, formatStr: string = 'yyyy-MM-dd HH:mm') => {
  return format(new Date(dateString), formatStr);
};

export const formatCurrency = (amount: number, unit: string = '원') => {
  return `${amount.toLocaleString()}${unit}`;
};

// PIN utilities
export const generatePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const validatePin = (pin: string) => {
  return /^\d{4}$/.test(pin);
};

// Math utilities
export const calculateTax = (amount: number, taxRate: number) => {
  return Math.floor(amount * (taxRate / 100));
};

export const calculateNetAmount = (grossAmount: number, taxRate: number) => {
  const tax = calculateTax(grossAmount, taxRate);
  return grossAmount - tax;
};

// Array utilities
export const sortByCreatedAt = <T extends { createdAt: string }>(items: T[], order: 'asc' | 'desc' = 'desc') => {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return order === 'desc' ? timeB - timeA : timeA - timeB;
  });
};

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

// Guard functions
export const isNotNull = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};