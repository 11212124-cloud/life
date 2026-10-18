import { CategoryInfo, PaymentMethodInfo } from '../types/expense';

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: '餐飲美食', type: 'expense', icon: 'Utensils', color: '#f97316', bgColor: '#ffedd5' },
  { id: 'transport', name: '交通出行', type: 'expense', icon: 'Car', color: '#0ea5e9', bgColor: '#e0f2fe' },
  { id: 'housing', name: '居住水電', type: 'expense', icon: 'Home', color: '#8b5cf6', bgColor: '#ede9fe' },
  { id: 'entertainment', name: '休閒娛樂', type: 'expense', icon: 'Gamepad2', color: '#ec4899', bgColor: '#fce7f3' },
  { id: 'shopping', name: '日常購物', type: 'expense', icon: 'ShoppingBag', color: '#f43f5e', bgColor: '#ffe4e6' },
  { id: 'medical', name: '醫療保健', type: 'expense', icon: 'HeartPulse', color: '#10b981', bgColor: '#d1fae5' },
  { id: 'education', name: '進修學習', type: 'expense', icon: 'GraduationCap', color: '#6366f1', bgColor: '#e0e7ff' },
  { id: 'investment', name: '投資保險', type: 'expense', icon: 'TrendingUp', color: '#14b8a6', bgColor: '#ccfbf1' },
  { id: 'other_exp', name: '其他雜支', type: 'expense', icon: 'MoreHorizontal', color: '#64748b', bgColor: '#f1f5f9' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', name: '薪資收入', type: 'income', icon: 'Briefcase', color: '#059669', bgColor: '#d1fae5' },
  { id: 'bonus', name: '獎金紅利', type: 'income', icon: 'Award', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'investment_inc', name: '理財收益', type: 'income', icon: 'LineChart', color: '#0284c7', bgColor: '#e0f2fe' },
  { id: 'side_job', name: '兼職副業', type: 'income', icon: 'Laptop', color: '#7c3aed', bgColor: '#ede9fe' },
  { id: 'other_inc', name: '其他收入', type: 'income', icon: 'PiggyBank', color: '#d97706', bgColor: '#fef3c7' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'cash', name: '現金', icon: 'Banknote', color: '#10b981' },
  { id: 'credit_card', name: '信用卡', icon: 'CreditCard', color: '#3b82f6' },
  { id: 'mobile_pay', name: '行動支付 / LINE Pay', icon: 'Smartphone', color: '#06c755' },
  { id: 'bank_transfer', name: '銀行轉帳', icon: 'Building2', color: '#6366f1' },
];

export const QUICK_EXPENSE_PRESETS = [
  { title: '早餐', category: '餐飲美食', amount: 80, paymentMethod: 'cash' },
  { title: '午餐', category: '餐飲美食', amount: 130, paymentMethod: 'mobile_pay' },
  { title: '手搖飲料/咖啡', category: '餐飲美食', amount: 65, paymentMethod: 'mobile_pay' },
  { title: '晚餐', category: '餐飲美食', amount: 160, paymentMethod: 'mobile_pay' },
  { title: '捷運/公車通勤', category: '交通出行', amount: 40, paymentMethod: 'credit_card' },
  { title: '超商日常用品', category: '日常購物', amount: 120, paymentMethod: 'mobile_pay' },
  { title: '加油', category: '交通出行', amount: 150, paymentMethod: 'credit_card' },
];
