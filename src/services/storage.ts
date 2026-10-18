import { ExpenseRecord, GoogleSheetConfig, MonthlyBudget } from '../types/expense';

const STORAGE_KEYS = {
  EXPENSES: 'life_expenses_data_v1',
  SHEET_CONFIG: 'life_expenses_sheet_config_v1',
  BUDGETS: 'life_expenses_budgets_v1',
};

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  // 2026-10 (Current Month)
  {
    id: 'rec_20261017_01',
    date: '2026-10-17',
    type: 'expense',
    category: '餐飲美食',
    title: '早午餐 (鮪魚蛋餅 + 冰美式)',
    amount: 125,
    paymentMethod: 'mobile_pay',
    note: '週末悠閒早午餐',
    syncedToSheets: true,
    createdAt: '2026-10-17T09:30:00.000Z',
  },
  {
    id: 'rec_20261017_02',
    date: '2026-10-17',
    type: 'expense',
    category: '日常購物',
    title: '全聯日常補貨 (鮮奶、燕麥、水果)',
    amount: 468,
    paymentMethod: 'credit_card',
    note: '一週生活食材',
    syncedToSheets: true,
    createdAt: '2026-10-17T11:45:00.000Z',
  },
  {
    id: 'rec_20261016_01',
    date: '2026-10-16',
    type: 'expense',
    category: '休閒娛樂',
    title: '週五威秀看電影 (兩人同行)',
    amount: 680,
    paymentMethod: 'credit_card',
    note: '最新科幻電影',
    syncedToSheets: true,
    createdAt: '2026-10-16T19:20:00.000Z',
  },
  {
    id: 'rec_20261015_01',
    date: '2026-10-15',
    type: 'expense',
    category: '餐飲美食',
    title: '商業午餐健康餐盒',
    amount: 140,
    paymentMethod: 'mobile_pay',
    note: '少油少鹽低GI',
    syncedToSheets: true,
    createdAt: '2026-10-15T12:15:00.000Z',
  },
  {
    id: 'rec_20261015_02',
    date: '2026-10-15',
    type: 'expense',
    category: '交通出行',
    title: '悠遊卡定期票儲值',
    amount: 1200,
    paymentMethod: 'credit_card',
    note: '台北都會區月票',
    syncedToSheets: true,
    createdAt: '2026-10-15T18:10:00.000Z',
  },
  {
    id: 'rec_20261014_01',
    date: '2026-10-14',
    type: 'expense',
    category: '進修學習',
    title: '線上程式與設計專業課程',
    amount: 1480,
    paymentMethod: 'credit_card',
    note: '前端進階架構',
    syncedToSheets: true,
    createdAt: '2026-10-14T21:00:00.000Z',
  },
  {
    id: 'rec_20261012_01',
    date: '2026-10-12',
    type: 'expense',
    category: '居住水電',
    title: '秋季台電電費繳納',
    amount: 1120,
    paymentMethod: 'bank_transfer',
    note: '冷氣使用變少電費下降',
    syncedToSheets: true,
    createdAt: '2026-10-12T14:00:00.000Z',
  },
  {
    id: 'rec_20261010_01',
    date: '2026-10-10',
    type: 'expense',
    category: '餐飲美食',
    title: '國慶連假朋友聚餐火鍋',
    amount: 850,
    paymentMethod: 'credit_card',
    note: '海底撈四人平攤',
    syncedToSheets: true,
    createdAt: '2026-10-10T19:00:00.000Z',
  },
  {
    id: 'rec_20261005_01',
    date: '2026-10-05',
    type: 'income',
    category: '薪資收入',
    title: '十月份本薪發放',
    amount: 52000,
    paymentMethod: 'bank_transfer',
    note: '公司發薪日',
    syncedToSheets: true,
    createdAt: '2026-10-05T10:00:00.000Z',
  },
  {
    id: 'rec_20261005_02',
    date: '2026-10-05',
    type: 'expense',
    category: '居住水電',
    title: '十月份房屋租金',
    amount: 14500,
    paymentMethod: 'bank_transfer',
    note: '每月固定房租',
    syncedToSheets: true,
    createdAt: '2026-10-05T10:30:00.000Z',
  },
  {
    id: 'rec_20261003_01',
    date: '2026-10-03',
    type: 'expense',
    category: '日常購物',
    title: '秋裝外套與休閒褲',
    amount: 1890,
    paymentMethod: 'credit_card',
    note: 'Uniqlo 週年慶特價',
    syncedToSheets: true,
    createdAt: '2026-10-03T16:00:00.000Z',
  },
  {
    id: 'rec_20261002_01',
    date: '2026-10-02',
    type: 'expense',
    category: '醫療保健',
    title: '定期牙醫洗牙與護理',
    amount: 200,
    paymentMethod: 'cash',
    note: '健保掛號費',
    syncedToSheets: true,
    createdAt: '2026-10-02T15:30:00.000Z',
  },

  // 2026-09 (Previous Month)
  {
    id: 'rec_20260928_01',
    date: '2026-09-28',
    type: 'expense',
    category: '餐飲美食',
    title: '日式拉麵與叉燒小菜',
    amount: 320,
    paymentMethod: 'mobile_pay',
    syncedToSheets: true,
    createdAt: '2026-09-28T18:45:00.000Z',
  },
  {
    id: 'rec_20260925_01',
    date: '2026-09-25',
    type: 'income',
    category: '理財收益',
    title: 'ETF 定期定額股息發放',
    amount: 3600,
    paymentMethod: 'bank_transfer',
    note: '高股息ETF配息',
    syncedToSheets: true,
    createdAt: '2026-09-25T09:00:00.000Z',
  },
  {
    id: 'rec_20260920_01',
    date: '2026-09-20',
    type: 'expense',
    category: '交通出行',
    title: '中秋返鄉高鐵來回車票',
    amount: 2980,
    paymentMethod: 'credit_card',
    note: '台北往返左營',
    syncedToSheets: true,
    createdAt: '2026-09-20T11:00:00.000Z',
  },
  {
    id: 'rec_20260915_01',
    date: '2026-09-15',
    type: 'expense',
    category: '休閒娛樂',
    title: '串流訂閱 (Netflix + Spotify)',
    amount: 540,
    paymentMethod: 'credit_card',
    syncedToSheets: true,
    createdAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'rec_20260905_01',
    date: '2026-09-05',
    type: 'income',
    category: '薪資收入',
    title: '九月份本薪發放',
    amount: 52000,
    paymentMethod: 'bank_transfer',
    syncedToSheets: true,
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'rec_20260905_02',
    date: '2026-09-05',
    type: 'expense',
    category: '居住水電',
    title: '九月份房屋租金',
    amount: 14500,
    paymentMethod: 'bank_transfer',
    syncedToSheets: true,
    createdAt: '2026-09-05T10:30:00.000Z',
  },
  {
    id: 'rec_20260902_01',
    date: '2026-09-02',
    type: 'expense',
    category: '餐飲美食',
    title: '辦公室訂購手搖飲料',
    amount: 75,
    paymentMethod: 'mobile_pay',
    syncedToSheets: true,
    createdAt: '2026-09-02T15:00:00.000Z',
  },

  // 2026-08 (Historical)
  {
    id: 'rec_20260825_01',
    date: '2026-08-25',
    type: 'expense',
    category: '日常購物',
    title: 'MUJI 無印良品文具與收納盒',
    amount: 620,
    paymentMethod: 'mobile_pay',
    syncedToSheets: true,
    createdAt: '2026-08-25T17:00:00.000Z',
  },
  {
    id: 'rec_20260810_01',
    date: '2026-08-10',
    type: 'expense',
    category: '休閒娛樂',
    title: '暑期露營裝備租借',
    amount: 1200,
    paymentMethod: 'credit_card',
    syncedToSheets: true,
    createdAt: '2026-08-10T14:00:00.000Z',
  },
  {
    id: 'rec_20260805_01',
    date: '2026-08-05',
    type: 'income',
    category: '薪資收入',
    title: '八月份本薪發放',
    amount: 52000,
    paymentMethod: 'bank_transfer',
    syncedToSheets: true,
    createdAt: '2026-08-05T10:00:00.000Z',
  },
  {
    id: 'rec_20260805_02',
    date: '2026-08-05',
    type: 'expense',
    category: '居住水電',
    title: '八月份房屋租金',
    amount: 14500,
    paymentMethod: 'bank_transfer',
    syncedToSheets: true,
    createdAt: '2026-08-05T10:30:00.000Z',
  },
];

export const getLocalRecords = (): ExpenseRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      saveLocalRecords(INITIAL_EXPENSES);
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return INITIAL_EXPENSES;
  }
};

export const saveLocalRecords = (records: ExpenseRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
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
        '2026-09': 30000,
        '2026-08': 30000,
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
