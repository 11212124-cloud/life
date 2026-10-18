import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  ExpenseRecord,
  GoogleSheetConfig,
  MonthlyBudget,
} from './types/expense';
import {
  getLocalRecords,
  saveLocalRecords,
  getGoogleSheetConfig,
  saveGoogleSheetConfig,
  getMonthlyBudgets,
  saveMonthlyBudgets,
} from './services/storage';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken,
} from './services/firebaseAuth';
import { appendExpensesToSheet } from './services/googleSheets';
import { exportExpensesToExcel } from './services/excelExport';

import { Navbar, ActiveTab } from './components/Navbar';
import { ExpenseList } from './components/ExpenseList';
import { MonthlyReport } from './components/MonthlyReport';
import { GoogleSheetsTab } from './components/GoogleSheetsTab';
import { ExpenseFormModal } from './components/ExpenseFormModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig | null>(null);
  const [budgets, setBudgets] = useState<MonthlyBudget>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');

  // Google Auth
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load local state on mount
  useEffect(() => {
    const loadedRecords = getLocalRecords();
    setRecords(loadedRecords);

    const loadedSheetConfig = getGoogleSheetConfig();
    setSheetConfig(loadedSheetConfig);

    const loadedBudgets = getMonthlyBudgets();
    setBudgets(loadedBudgets);

    // Initialize Firebase Auth listener
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        // Not authenticated
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Save records whenever changed
  const updateRecords = useCallback((newRecords: ExpenseRecord[]) => {
    setRecords(newRecords);
    saveLocalRecords(newRecords);
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast(`歡迎回來，${res.user.displayName || 'Google 使用者'}！已成功連線 Google 服務。`);
      }
    } catch (err: any) {
      console.error('登入錯誤:', err);
      showToast(err.message || 'Google 登入失敗，請重試', 'error');
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('已登出 Google 帳號');
    } catch (err: any) {
      showToast('登出失敗', 'error');
    }
  };

  // Sheet config update
  const handleUpdateSheetConfig = (newConfig: GoogleSheetConfig | null) => {
    setSheetConfig(newConfig);
    saveGoogleSheetConfig(newConfig);
  };

  // Update budget
  const handleUpdateBudget = (month: string, amount: number) => {
    const updated = { ...budgets, [month]: amount };
    setBudgets(updated);
    saveMonthlyBudgets(updated);
    showToast(`已儲存 ${month} 預算目標 NT$ ${amount.toLocaleString()}`);
  };

  // Add or Edit Expense
  const handleSaveExpense = async (record: ExpenseRecord) => {
    if (editingRecord) {
      // Edit existing
      const updated = records.map((r) => (r.id === record.id ? record : r));
      updateRecords(updated);
      showToast(`已更新「${record.title}」`);
    } else {
      // Add new
      const updated = [record, ...records];
      updateRecords(updated);
      showToast(`已記錄「${record.title}」NT$ ${record.amount}`);

      // If user has linked Google Sheets and is signed in, auto-append in background
      if (accessToken && sheetConfig?.spreadsheetId) {
        appendExpensesToSheet(accessToken, sheetConfig.spreadsheetId, [record]).catch((err) => {
          console.warn('Auto-append to Google Sheet failed:', err);
        });
      }
    }
    setEditingRecord(null);
  };

  // Delete single
  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    updateRecords(updated);
    showToast('已刪除紀錄');
  };

  // Batch delete
  const handleBatchDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = records.filter((r) => !idSet.has(r.id));
    updateRecords(updated);
    showToast(`已批次刪除 ${ids.length} 筆紀錄`);
  };

  // Records imported from Google Sheets
  const handleRecordsImported = (imported: ExpenseRecord[]) => {
    // Merge without duplicates based on id
    const existingMap = new Map(records.map((r) => [r.id, r]));
    imported.forEach((item) => {
      existingMap.set(item.id, item);
    });
    const merged = Array.from(existingMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    updateRecords(merged);
    showToast(`已從 Google 試算表同步更新 ${imported.length} 筆資料`);
  };

  // Export full Excel workbook
  const handleExportFullExcel = () => {
    try {
      exportExpensesToExcel(records, '生活開支總記帳表');
      showToast('已成功匯出 Excel 報表 (.xlsx)');
    } catch (err: any) {
      showToast(err.message || '匯出失敗', 'error');
    }
  };

  // Clear all records
  const handleClearAllRecords = () => {
    updateRecords([]);
    showToast('已清空所有生活開支紀錄');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-gray-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickAdd={() => {
          setEditingRecord(null);
          setIsFormModalOpen(true);
        }}
        onExportExcel={handleExportFullExcel}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        user={user}
        sheetConfig={sheetConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-12">
        {activeTab === 'list' && (
          <ExpenseList
            records={records}
            onAddClick={() => {
              setEditingRecord(null);
              setIsFormModalOpen(true);
            }}
            onEditClick={(record) => {
              setEditingRecord(record);
              setIsFormModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onBatchDelete={handleBatchDelete}
            onClearAll={handleClearAllRecords}
            isSheetLinked={!!sheetConfig}
          />
        )}

        {activeTab === 'report' && (
          <MonthlyReport
            records={records}
            budgets={budgets}
            onUpdateBudget={handleUpdateBudget}
            onSelectCategory={() => {
              setActiveTab('list');
            }}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsTab
            user={user}
            accessToken={accessToken}
            onSignIn={handleGoogleSignIn}
            onSignOut={handleGoogleSignOut}
            sheetConfig={sheetConfig}
            onUpdateSheetConfig={handleUpdateSheetConfig}
            records={records}
            onRecordsImported={handleRecordsImported}
          />
        )}
      </main>

      {/* Expense Form Modal (Add / Edit) */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleSaveExpense}
        initialRecord={editingRecord}
      />

      {/* Google Sheets Sync & Auth Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        sheetConfig={sheetConfig}
        onUpdateSheetConfig={handleUpdateSheetConfig}
        localRecords={records}
        onRecordsImported={handleRecordsImported}
      />

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-18 md:bottom-6 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xl border border-gray-800 animate-in slide-in-from-bottom-5 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
