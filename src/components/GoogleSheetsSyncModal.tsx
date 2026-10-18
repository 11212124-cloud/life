import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Link2,
  LogOut,
  FileCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetConfig, ExpenseRecord } from '../types/expense';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmationModal } from './ConfirmationModal';
import {
  createExpenseSpreadsheet,
  syncFullExpensesToSheet,
  loadExpensesFromSheet,
  getSpreadsheetInfo,
} from '../services/googleSheets';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  sheetConfig: GoogleSheetConfig | null;
  onUpdateSheetConfig: (config: GoogleSheetConfig | null) => void;
  localRecords: ExpenseRecord[];
  onRecordsImported: (records: ExpenseRecord[]) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  sheetConfig,
  onUpdateSheetConfig,
  localRecords,
  onRecordsImported,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [showInputExisting, setShowInputExisting] = useState(false);

  // Destructive confirmations
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

  if (!isOpen) return null;

  // 1. Create a new Google Sheet
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: '請先登入 Google 帳號' });
      return;
    }
    setLoading(true);
    setStatusMessage({ type: 'info', text: '正在您的 Google 雲端硬碟建立試算表...' });

    try {
      const result = await createExpenseSpreadsheet(accessToken, '生活開支記帳本 (Expense Tracker)');
      // Now sync all existing local records to this new sheet immediately!
      await syncFullExpensesToSheet(accessToken, result.spreadsheetId, localRecords);

      const newConfig: GoogleSheetConfig = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetTitle: result.title,
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
      };

      onUpdateSheetConfig(newConfig);
      setStatusMessage({
        type: 'success',
        text: `成功在 Google 雲端建立試算表！已同步 ${localRecords.length} 筆現有資料。`,
      });
    } catch (err: any) {
      console.error('Create sheet failed:', err);
      setStatusMessage({
        type: 'error',
        text: `建立失敗：${err.message || '請確認是否已授權 Google 試算表存取權限。'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Link existing Google Sheet
  const handleLinkExistingSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: '請先登入 Google 帳號' });
      return;
    }
    let sheetId = existingSheetInput.trim();
    if (!sheetId) {
      setStatusMessage({ type: 'error', text: '請輸入 Google 試算表網址或 ID' });
      return;
    }

    // Extract ID if full URL was pasted
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: '正在驗證 Google 試算表連線...' });

    try {
      const info = await getSpreadsheetInfo(accessToken, sheetId);
      const newConfig: GoogleSheetConfig = {
        spreadsheetId: sheetId,
        spreadsheetTitle: info.title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSheetConfig(newConfig);
      setShowInputExisting(false);
      setStatusMessage({ type: 'success', text: `成功綁定試算表：「${info.title}」` });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `驗證失敗：${err.message || '找不到此試算表或您沒有存取權限。'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Upload / Overwrite to Google Sheets (Safe confirmation)
  const triggerSyncToSheets = () => {
    if (!accessToken || !sheetConfig) return;

    setConfirmModal({
      isOpen: true,
      title: '確認同步至 Google 試算表？',
      message: `這將會把目前本機的 ${localRecords.length} 筆紀錄完整同步至雲端試算表「${sheetConfig.spreadsheetTitle}」，確認要執行嗎？`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setStatusMessage({ type: 'info', text: '正在同步資料至 Google 試算表...' });

        try {
          await syncFullExpensesToSheet(accessToken, sheetConfig.spreadsheetId, localRecords);
          const updatedConfig: GoogleSheetConfig = {
            ...sheetConfig,
            lastSyncedAt: new Date().toISOString(),
          };
          onUpdateSheetConfig(updatedConfig);
          setStatusMessage({
            type: 'success',
            text: `同步成功！已更新 ${localRecords.length} 筆紀錄至 Google 試算表。`,
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `同步失敗：${err.message}` });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 4. Download / Import from Google Sheets
  const triggerImportFromSheets = () => {
    if (!accessToken || !sheetConfig) return;

    setConfirmModal({
      isOpen: true,
      title: '從 Google 試算表下載載入資料？',
      message: `這將從「${sheetConfig.spreadsheetTitle}」下載試算表中的所有收支數據並合併更新至本應用程式。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setStatusMessage({ type: 'info', text: '正在自 Google 試算表讀取資料...' });

        try {
          const fetched = await loadExpensesFromSheet(accessToken, sheetConfig.spreadsheetId);
          if (fetched.length === 0) {
            setStatusMessage({ type: 'info', text: '試算表中尚無資料行。' });
          } else {
            onRecordsImported(fetched);
            const updatedConfig: GoogleSheetConfig = {
              ...sheetConfig,
              lastSyncedAt: new Date().toISOString(),
            };
            onUpdateSheetConfig(updatedConfig);
            setStatusMessage({
              type: 'success',
              text: `成功自 Google 試算表載入 ${fetched.length} 筆收支資料！`,
            });
          }
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `讀取失敗：${err.message}` });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 5. Unlink sheet
  const triggerUnlinkSheet = () => {
    setConfirmModal({
      isOpen: true,
      title: '解除試算表綁定？',
      message: '解除綁定不會刪除 Google 雲端上的試算表，但此應用程式將停止自動同步。',
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onUpdateSheetConfig(null);
        setStatusMessage({ type: 'info', text: '已解除 Google 試算表綁定。' });
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden"
          role="dialog"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Google Sheets 試算表記錄表連動</h2>
                <p className="text-xs text-gray-500">雲端即時儲存、隨時隨地開啟試算表</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Feedback banner */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
                )}
                <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
              </div>
            )}

            {/* Step 1: Google Account Authentication */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user ? (
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Google User'}
                          className="w-10 h-10 rounded-full border border-emerald-400"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {user.displayName || '已登入 Google 使用者'}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-bold text-gray-800">尚未登入 Google 帳號</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        登入以建立或連動個人 Google 雲端試算表
                      </div>
                    </div>
                  )}
                </div>

                {user ? (
                  <button
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>登出</span>
                  </button>
                ) : (
                  <GoogleSignInButton onClick={onSignIn} isLoading={loading} />
                )}
              </div>
            </div>

            {/* Step 2: Linked Spreadsheet Section */}
            {user && (
              <div className="space-y-4">
                {sheetConfig ? (
                  <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                            {sheetConfig.spreadsheetTitle}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          ID: {sheetConfig.spreadsheetId}
                        </p>
                      </div>

                      <a
                        href={sheetConfig.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>在 Google Sheets 開啟</span>
                      </a>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>本機待存/現存紀錄：{localRecords.length} 筆</span>
                      {sheetConfig.lastSyncedAt && (
                        <span>
                          上次同步：{new Date(sheetConfig.lastSyncedAt).toLocaleString('zh-TW')}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={triggerSyncToSheets}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>同步上傳至 Google 試算表</span>
                      </button>

                      <button
                        onClick={triggerImportFromSheets}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>從試算表載入資料</span>
                      </button>
                    </div>

                    <div className="text-right pt-2">
                      <button
                        onClick={triggerUnlinkSheet}
                        className="text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer underline"
                      >
                        解除連動此試算表
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      選擇連動方式
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Create New */}
                      <button
                        onClick={handleCreateNewSheet}
                        disabled={loading}
                        className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 text-left transition-all cursor-pointer flex flex-col justify-between group disabled:opacity-50"
                      >
                        <div>
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-xs">
                            <PlusCircle className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-emerald-950 text-sm">
                            一鍵建立全新 Google 記帳試算表
                          </h4>
                          <p className="text-xs text-emerald-800/80 mt-1 leading-relaxed">
                            自動在個人 Google Drive 建立含美化格式、固定表頭的「生活開支記帳本」，並同步現有紀錄。
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          立即建立並連動 →
                        </span>
                      </button>

                      {/* Link Existing */}
                      <button
                        onClick={() => setShowInputExisting(!showInputExisting)}
                        className="p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-left transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                            <Link2 className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">綁定現有的 Google 試算表</h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            輸入您已有 Google 試算表連結或 Spreadsheet ID 進行資料雙向讀寫與記錄。
                          </p>
                        </div>
                        <span className="text-xs font-bold text-blue-600 mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          輸入試算表網址 →
                        </span>
                      </button>
                    </div>

                    {showInputExisting && (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                        <label className="block text-xs font-semibold text-gray-700">
                          Google 試算表網址或 ID
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={existingSheetInput}
                            onChange={(e) => setExistingSheetInput(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            onClick={handleLinkExistingSheet}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                          >
                            確認綁定
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
