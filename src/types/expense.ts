export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'credit_card' | 'mobile_pay' | 'bank_transfer';

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  mood?: string; // e.g. 'happy', 'worth_it', 'painful', etc.
  syncedToSheets?: boolean;
  createdAt: string; // ISO string
}

export interface CategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: string;
  color: string;
}

export interface MonthlyBudget {
  [yearMonth: string]: number; // e.g. "2026-10": 25000
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt?: string;
}
