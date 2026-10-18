import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  CheckSquare,
  Square,
  Download,
} from 'lucide-react';
import { ExpenseRecord, TransactionType } from '../types/expense';
import { ALL_CATEGORIES, PAYMENT_METHODS } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { exportExpensesToExcel } from '../services/excelExport';

interface ExpenseListProps {
  records: ExpenseRecord[];
  onAddClick: () => void;
  onEditClick: (record: ExpenseRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onClearAll?: () => void;
  onSyncPendingClick?: () => void;
  isSheetLinked?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  records,
  onAddClick,
  onEditClick,
  onDeleteRecord,
  onBatchDelete,
  onClearAll,
  onSyncPendingClick,
  isSheetLinked,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm delete dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Filtered & sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Search match
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchCategory = r.category.toLowerCase().includes(q);
          const matchNote = r.note?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchCategory && !matchNote) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && r.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [records, searchTerm, typeFilter, categoryFilter, sortBy]);

  // Statistics for current filtered view
  const summary = useMemo(() => {
    let expense = 0;
    let income = 0;
    filteredRecords.forEach((r) => {
      if (r.type === 'expense') expense += r.amount;
      else income += r.amount;
    });
    return {
      expense,
      income,
      balance: income - expense,
      count: filteredRecords.length,
    };
  }, [filteredRecords]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const handleDeleteSingle = (record: ExpenseRecord) => {
    setConfirmModal({
      isOpen: true,
      title: '確定要刪除這筆紀錄嗎？',
      message: `即將刪除「${record.title} (NT$ ${record.amount})」，刪除後無法復原。`,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onDeleteRecord(record.id);
        const next = new Set(selectedIds);
        next.delete(record.id);
        setSelectedIds(next);
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '批次刪除選取的紀錄？',
      message: `已選取 ${selectedIds.size} 筆紀錄，確定要全部刪除嗎？此操作無法還原。`,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onBatchDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      },
    });
  };

  const handleClearAll = () => {
    if (!onClearAll || records.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: '確定要清空所有紀錄嗎？',
      message: `這將會徹底清除應用程式內現存的全部 ${records.length} 筆生活開支紀錄。此操作無法復原，確認清空？`,
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onClearAll();
        setSelectedIds(new Set());
      },
    });
  };

  const handleExportFilteredExcel = () => {
    exportExpensesToExcel(filteredRecords, '生活開支明細清單');
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Quick Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋項目名稱、消費類別或備註..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                清除
              </button>
            )}
          </div>

          {/* Action Buttons: Add Record & Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={onAddClick}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>記一筆</span>
            </button>

            <button
              onClick={handleExportFilteredExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              title="匯出目前列表為 Excel"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">匯出 Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          {/* Type Filters */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                typeFilter === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              收入
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium cursor-pointer"
            >
              <option value="all">所有類別</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium cursor-pointer"
            >
              <option value="date_desc">日期：新 → 舊</option>
              <option value="date_asc">日期：舊 → 新</option>
              <option value="amount_desc">金額：高 → 低</option>
              <option value="amount_asc">金額：低 → 高</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary Banner & Batch Bar */}
      <div className="bg-emerald-50/50 rounded-xl px-4 py-2.5 border border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-gray-700 font-medium">
          <span>共 {summary.count} 筆</span>
          <span>
            總支出：<strong className="text-rose-600">NT$ {summary.expense.toLocaleString()}</strong>
          </span>
          <span>
            總收入：<strong className="text-emerald-700">NT$ {summary.income.toLocaleString()}</strong>
          </span>
          <span>
            結餘：
            <strong className={summary.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}>
              NT$ {summary.balance.toLocaleString()}
            </strong>
          </span>
        </div>

        {/* Batch Operations */}
        <div className="flex items-center gap-2">
          {filteredRecords.length > 0 && (
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              {selectedIds.size === filteredRecords.length ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>全選 ({selectedIds.size})</span>
            </button>
          )}

          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>刪除已選 ({selectedIds.size})</span>
            </button>
          )}

          {records.length > 0 && onClearAll && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer ml-1"
              title="清空目前所有記帳紀錄"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空所有</span>
            </button>
          )}
        </div>
      </div>

      {/* Record Items List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-xs text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-700 text-sm">查無符合條件的記帳紀錄</h4>
          <p className="text-xs text-gray-400 max-w-sm">請嘗試更換篩選條件，或是點擊上方「記一筆」新增您的第一筆日常開支。</p>
          <button
            onClick={onAddClick}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            立即記一筆
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const catInfo = ALL_CATEGORIES.find((c) => c.name === record.category);
            const paymentInfo = PAYMENT_METHODS.find((p) => p.id === record.paymentMethod);
            const isSelected = selectedIds.has(record.id);

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex items-center gap-3 group hover:border-emerald-300 hover:shadow-xs ${
                  isSelected ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100'
                }`}
              >
                {/* Select Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleSelect(record.id)}
                  className="text-gray-400 hover:text-emerald-600 cursor-pointer shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Category Icon Badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: catInfo?.bgColor || '#f1f5f9',
                    color: catInfo?.color || '#64748b',
                  }}
                >
                  <CategoryIcon name={catInfo?.icon || 'MoreHorizontal'} className="w-5 h-5" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 truncate">
                      {record.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-gray-100 text-gray-600 shrink-0">
                      {record.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {record.date}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <CreditCard className="w-3 h-3" />
                      {paymentInfo?.name.split(' ')[0] || record.paymentMethod}
                    </span>
                    {record.note && (
                      <span className="text-gray-400 truncate max-w-[150px] sm:max-w-xs">
                        {record.note}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm sm:text-base font-black ${
                      record.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {record.type === 'expense' ? '-' : '+'}NT$ {record.amount.toLocaleString()}
                  </div>
                </div>

                {/* Actions (Edit / Delete) */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <button
                    onClick={() => onEditClick(record)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="編輯"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(record)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Deletion Safety */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
