import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, CreditCard, FileText, Check, Plus } from 'lucide-react';
import { ExpenseRecord, TransactionType, PaymentMethod } from '../types/expense';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, QUICK_EXPENSE_PRESETS } from '../constants/categories';
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
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory('餐飲美食');
      setPaymentMethod('mobile_pay');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
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

    const newRecord: ExpenseRecord = {
      id: initialRecord ? initialRecord.id : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      type,
      category,
      title: title.trim(),
      amount: Math.round(numAmount * 100) / 100,
      paymentMethod,
      note: note.trim() || undefined,
      syncedToSheets: false, // will trigger sync prompt or auto-sync
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {initialRecord ? '編輯紀錄' : '新增收支紀錄'}
            </h2>
            <div className="flex bg-gray-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
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
                    ? 'bg-emerald-600 text-white shadow-xs'
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
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <span>⚡ 常用快速記帳</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EXPENSE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-xs px-2.5 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-gray-200 rounded-lg text-gray-700 transition-colors cursor-pointer"
                  >
                    {p.title} ${p.amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              金額 (NT$)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className={`text-xl font-bold ${type === 'expense' ? 'text-rose-500' : 'text-emerald-600'}`}>
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
                className="w-full pl-16 pr-4 py-3 text-2xl font-bold text-gray-900 bg-gray-50/70 border border-gray-200 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-300"
              />
            </div>
            {/* Quick Amount Adders */}
            <div className="flex gap-2 mt-2">
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="flex-1 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors cursor-pointer"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              項目名稱 / 說明
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? '例如：午餐便當、高鐵車票、全聯鮮奶' : '例如：十月薪資、兼職收入、股票股息'}
              className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
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
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20 text-emerald-950 font-semibold'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.bgColor, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
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
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              記帳日期
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setDate(todayStr)}
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
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
                className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              備註說明 (選填)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：發票存載具、與同事合購、特別優惠等"
              className="w-full px-4 py-2 text-sm text-gray-900 bg-gray-50/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-2xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>{initialRecord ? '儲存變更' : '確定記錄'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
