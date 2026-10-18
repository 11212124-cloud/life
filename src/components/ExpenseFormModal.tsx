import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Calendar, DollarSign, Tag, CreditCard, FileText, Check, Plus, Smile } from 'lucide-react';
import { ExpenseRecord, TransactionType, PaymentMethod } from '../types/expense';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  QUICK_EXPENSE_PRESETS,
  EXPENSE_MOODS,
} from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: ExpenseRecord) => void;
  initialRecord?: ExpenseRecord | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRecord,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('餐飲美食');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_pay');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [mood, setMood] = useState<string>('worth_it');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialRecord) {
      setType(initialRecord.type);
      setAmount(initialRecord.amount.toString());
      setTitle(initialRecord.title);
      setCategory(initialRecord.category);
      setPaymentMethod(initialRecord.paymentMethod);
      setDate(initialRecord.date);
      setNote(initialRecord.note || '');
      setMood(initialRecord.mood || 'worth_it');
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory('餐飲美食');
      setPaymentMethod('mobile_pay');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setMood('worth_it');
    }
    setError('');
  }, [initialRecord, isOpen]);

  // When type changes, adjust default category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('薪資收入');
      setPaymentMethod('bank_transfer');
    } else {
      setCategory('餐飲美食');
      setPaymentMethod('mobile_pay');
    }
  };

  const handleApplyPreset = (preset: typeof QUICK_EXPENSE_PRESETS[0]) => {
    setType('expense');
    setTitle(preset.title);
    setCategory(preset.category);
    setAmount(preset.amount.toString());
    setPaymentMethod(preset.paymentMethod as PaymentMethod);
  };

  const handleAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('請輸入有效的金額大於 0');
      return;
    }
    if (!title.trim()) {
      setError('請輸入項目說明');
      return;
    }

    // Trigger playful celebration confetti!
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: type === 'income' ? ['#10b981', '#34d399', '#f59e0b'] : ['#f43f5e', '#fb7185', '#38bdf8', '#fbbf24'],
    });

    const newRecord: ExpenseRecord = {
      id: initialRecord ? initialRecord.id : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      type,
      category,
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      paymentMethod,
      note: note.trim() || undefined,
      mood: type === 'expense' ? mood : undefined,
      syncedToSheets: false,
      createdAt: initialRecord ? initialRecord.createdAt : new Date().toISOString(),
    };

    onSubmit(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-emerald-50/40 to-teal-50/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{type === 'expense' ? '💸' : '💰'}</span>
            <h2 className="text-xl font-black text-gray-900">
              {initialRecord ? '編輯生活紀錄' : '記下生活這筆帳'}
            </h2>
            <div className="flex bg-gray-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                收入
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-200 flex items-center gap-2">
              <span className="font-semibold">提示：</span> {error}
            </div>
          )}

          {/* Quick Presets (Only when adding expense) */}
          {!initialRecord && type === 'expense' && (
            <div>
              <div className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                <span>⚡ 常用一鍵快選</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXPENSE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-gray-200 rounded-xl text-gray-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.title}</span>
                    <strong className="text-emerald-700">${p.amount}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              金額 (NT$)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className={`text-xl font-black ${type === 'expense' ? 'text-rose-500' : 'text-emerald-600'}`}>
                  NT$
                </span>
              </div>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus={!initialRecord}
                className="w-full pl-16 pr-4 py-3 text-2xl font-black text-gray-900 bg-gray-50/70 border border-gray-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-300"
              />
            </div>
            {/* Quick Amount Adders */}
            <div className="flex gap-2 mt-2">
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="flex-1 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 active:scale-95 rounded-xl transition-all cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              項目名稱 / 描述
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? '例如：牛肉麵、星巴克拿鐵、全聯鮮奶' : '例如：本月薪水、業績獎金、二手拍賣'}
              className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Category Picker with Emojis */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              選擇類別
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 shadow-xs ring-2 ring-emerald-500/30 text-emerald-950 font-bold scale-[1.02]'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-lg leading-none shrink-0">{cat.emoji}</span>
                    <span className="text-xs truncate font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fun Mood / Feeling Tag (Only for Expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>這筆開銷的心情感覺？</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPENSE_MOODS.map((m) => {
                  const isSelected = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${m.badgeClass} ring-2 ring-emerald-400 shadow-xs scale-105`
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              支付方式
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs scale-[1.02]'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CategoryIcon name={method.icon} className="w-3.5 h-3.5" />
                    <span>{method.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              記帳日期
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
              />
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  date === todayStr
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                今天
              </button>
              <button
                type="button"
                onClick={() => setDate(yesterdayStr)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  date === yesterdayStr
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                昨天
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              備註說明 (選填)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：發票已存載具、與朋友均攤、特惠活動等"
              className="w-full px-4 py-2 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-base rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{initialRecord ? '儲存變更' : '確定記錄 🚀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
