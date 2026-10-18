import { ExpenseRecord, GoogleSheetConfig, MonthlyBudget } from '../types/expense';

const STORAGE_KEYS = {
  EXPENSES: 'life_expenses_data_v2', // bump key to reset built-in sample data
  SHEET_CONFIG: 'life_expenses_sheet_config_v1',
  BUDGETS: 'life_expenses_budgets_v1',
};

// Built-in records set to completely empty
export const INITIAL_EXPENSES: ExpenseRecord[] = [];

export const getLocalRecords = (): ExpenseRecord[] => {
  try {
    // Clear legacy sample data key if present
    localStorage.removeItem('life_expenses_data_v1');

    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      saveLocalRecords([]);
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return [];
  }
};

export const saveLocalRecords = (records: ExpenseRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const clearAllLocalRecords = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear records:', e);
  }
};

export const getGoogleSheetConfig = (): GoogleSheetConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveGoogleSheetConfig = (config: GoogleSheetConfig | null): void => {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEYS.SHEET_CONFIG);
    } else {
      localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to save sheet config:', e);
  }
};

export const getMonthlyBudgets = (): MonthlyBudget => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      const defaultBudgets: MonthlyBudget = {
        '2026-10': 30000,
      };
      saveMonthlyBudgets(defaultBudgets);
      return defaultBudgets;
    }
    return JSON.parse(raw);
  } catch (e) {
    return { '2026-10': 30000 };
  }
};

export const saveMonthlyBudgets = (budgets: MonthlyBudget): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error('Failed to save budgets:', e);
  }
};
