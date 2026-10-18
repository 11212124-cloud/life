import { CategoryInfo, PaymentMethodInfo } from '../types/expense';

export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: '餐飲美食', type: 'expense', icon: 'Utensils', emoji: '🍜', color: '#f97316', bgColor: '#ffedd5' },
  { id: 'transport', name: '交通出行', type: 'expense', icon: 'Car', emoji: '🚗', color: '#0ea5e9', bgColor: '#e0f2fe' },
  { id: 'housing', name: '居住水電', type: 'expense', icon: 'Home', emoji: '🏠', color: '#8b5cf6', bgColor: '#ede9fe' },
  { id: 'entertainment', name: '休閒娛樂', type: 'expense', icon: 'Gamepad2', emoji: '🎮', color: '#ec4899', bgColor: '#fce7f3' },
  { id: 'shopping', name: '日常購物', type: 'expense', icon: 'ShoppingBag', emoji: '🛍️', color: '#f43f5e', bgColor: '#ffe4e6' },
  { id: 'medical', name: '醫療保健', type: 'expense', icon: 'HeartPulse', emoji: '💊', color: '#10b981', bgColor: '#d1fae5' },
  { id: 'education', name: '進修學習', type: 'expense', icon: 'GraduationCap', emoji: '📚', color: '#6366f1', bgColor: '#e0e7ff' },
  { id: 'investment', name: '投資保險', type: 'expense', icon: 'TrendingUp', emoji: '📈', color: '#14b8a6', bgColor: '#ccfbf1' },
  { id: 'other_exp', name: '其他雜支', type: 'expense', icon: 'MoreHorizontal', emoji: '📦', color: '#64748b', bgColor: '#f1f5f9' },
];

export const INCOME_CATEGORIES: CategoryInfo[] = [
  { id: 'salary', name: '薪資收入', type: 'income', icon: 'Briefcase', emoji: '💰', color: '#059669', bgColor: '#d1fae5' },
  { id: 'bonus', name: '獎金紅利', type: 'income', icon: 'Award', emoji: '🧧', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'investment_inc', name: '理財收益', type: 'income', icon: 'LineChart', emoji: '💹', color: '#0284c7', bgColor: '#e0f2fe' },
  { id: 'side_job', name: '兼職副業', type: 'income', icon: 'Laptop', emoji: '💼', color: '#7c3aed', bgColor: '#ede9fe' },
  { id: 'other_inc', name: '其他收入', type: 'income', emoji: '🪙', icon: 'PiggyBank', color: '#d97706', bgColor: '#fef3c7' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'cash', name: '現金', icon: 'Banknote', color: '#10b981' },
  { id: 'credit_card', name: '信用卡', icon: 'CreditCard', color: '#3b82f6' },
  { id: 'mobile_pay', name: '行動支付 / LINE Pay', icon: 'Smartphone', color: '#06c755' },
  { id: 'bank_transfer', name: '銀行轉帳', icon: 'Building2', color: '#6366f1' },
];

export interface ExpenseMood {
  id: string;
  label: string;
  emoji: string;
  badgeClass: string;
}

export const EXPENSE_MOODS: ExpenseMood[] = [
  { id: 'worth_it', label: '超值', emoji: '👍', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'happy', label: '小確幸', emoji: '✨', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'essential', label: '必備', emoji: '🛡️', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'healthy', label: '健康', emoji: '🥗', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'splurge', label: '犒賞', emoji: '🥳', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'painful', label: '肉痛', emoji: '💸', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export const QUICK_EXPENSE_PRESETS = [
  { title: '早餐', category: '餐飲美食', amount: 80, paymentMethod: 'cash', emoji: '🥪' },
  { title: '午餐便當', category: '餐飲美食', amount: 130, paymentMethod: 'mobile_pay', emoji: '🍱' },
  { title: '手搖飲料/咖啡', category: '餐飲美食', amount: 65, paymentMethod: 'mobile_pay', emoji: '🧋' },
  { title: '晚餐', category: '餐飲美食', amount: 160, paymentMethod: 'mobile_pay', emoji: '🍲' },
  { title: '捷運/公車通勤', category: '交通出行', amount: 40, paymentMethod: 'credit_card', emoji: '🚇' },
  { title: '超商日常補給', category: '日常購物', amount: 120, paymentMethod: 'mobile_pay', emoji: '🏪' },
  { title: '機車加油', category: '交通出行', amount: 150, paymentMethod: 'credit_card', emoji: '⛽' },
];
