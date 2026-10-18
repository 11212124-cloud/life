import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Link2,
  Table,
  ShieldCheck,
  Calendar,
  Layers,
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
  SHEET_HEADERS,
} from '../services/googleSheets';

interface GoogleSheetsTabProps {
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  sheetConfig: GoogleSheetConfig | null;
  onUpdateSheetConfig: (config: GoogleSheetConfig | null) => void;
  records: ExpenseRecord[];
  onRecordsImported: (records: ExpenseRecord[]) => void;
}

export const GoogleSheetsTab: React.FC<GoogleSheetsTabProps> = ({
  user,
  accessToken,
  onSignIn,
  onSignOut,
  sheetConfig,
  onUpdateSheetConfig,
  records,
  onRecordsImported,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [existingInput, setExistingInput] = useState('');
  const [showExistingInput, setShowExistingInput] = useState(false);

  // Destructive Confirmation
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

  const handleCreateSheet = async () => {
    if (!accessToken) {
      onSignIn();
      return;
    }
    setLoading(true);
    setStatusMessage({ type: 'info', text: '正在您的 Google 雲端硬碟建立生活開支記帳試算表...' });

    try {
      const result = await createExpenseSpreadsheet(accessToken, '生活開支記帳本 (Expense Tracker)');
      await syncFullExpensesToSheet(accessToken, result.spreadsheetId, records);

      const config: GoogleSheetConfig = {
        spreadsheetId: result.spreadsheetId,
        spreadsheetTitle: result.title,
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSheetConfig(config);
      setStatusMessage({
        type: 'success',
        text: `已成功在您的 Google 雲端建立試算表！現有 ${records.length} 筆資料已全部同步。`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `建立失敗：${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!accessToken) {
      onSignIn();
      return;
    }
    let id = existingInput.trim();
    if (!id) return;
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) id = match[1];

    setLoading(true);
    try {
      const info = await getSpreadsheetInfo(accessToken, id);
      const config: GoogleSheetConfig = {
        spreadsheetId: id,
        spreadsheetTitle: info.title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateSheetConfig(config);
      setShowExistingInput(false);
      setStatusMessage({ type: 'success', text: `已成功連結 Google 試算表：「${info.title}」` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `連結失敗：${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToSheets = () => {
    if (!accessToken || !sheetConfig) return;
    setConfirmModal({
      isOpen: true,
      title: '確定同步至 Google 試算表？',
      message: `即將把目前應用程式內的 ${records.length} 筆紀錄同步覆蓋至雲端試算表「${sheetConfig.spreadsheetTitle}」。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setStatusMessage({ type: 'info', text: '正在同步資料至 Google 試算表...' });

        try {
          await syncFullExpensesToSheet(accessToken, sheetConfig.spreadsheetId, records);
          onUpdateSheetConfig({
            ...sheetConfig,
            lastSyncedAt: new Date().toISOString(),
          });
          setStatusMessage({
            type: 'success',
            text: `同步完成！已將 ${records.length} 筆資料寫入 Google 試算表。`,
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `同步失敗：${err.message}` });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleImportFromSheets = () => {
    if (!accessToken || !sheetConfig) return;
    setConfirmModal({
      isOpen: true,
      title: '從 Google 試算表載入資料？',
      message: `這將自「${sheetConfig.spreadsheetTitle}」下載最新資料並匯入到本機記帳紀錄中。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        setStatusMessage({ type: 'info', text: '正在從 Google 試算表讀取資料...' });

        try {
          const list = await loadExpensesFromSheet(accessToken, sheetConfig.spreadsheetId);
          onRecordsImported(list);
          onUpdateSheetConfig({
            ...sheetConfig,
            lastSyncedAt: new Date().toISOString(),
          });
          setStatusMessage({
            type: 'success',
            text: `載入成功！共自 Google 試算表匯入 ${list.length} 筆收支資料。`,
          });
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `載入失敗：${err.message}` });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleUnlink = () => {
    setConfirmModal({
      isOpen: true,
      title: '解除 Google 試算表綁定？',
      message: '解除連動後，本機紀錄依然完整保留，隨時可重新連動。',
      onConfirm: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        onUpdateSheetConfig(null);
        setStatusMessage({ type: 'info', text: '已解除試算表綁定。' });
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner / Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets 雲端連動</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              用 Google 試算表做您的隨身記帳資料庫
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
              每一筆開支均可自動同步寫入您的 Google Drive 個人試算表，隨時在手機或電腦直接開啟編輯，更支援即時 Excel 匯出。
            </p>
          </div>

          {!user ? (
            <div className="shrink-0">
              <GoogleSignInButton onClick={onSignIn} isLoading={loading} />
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900">{user.displayName || 'Google 使用者'}</div>
                <div className="text-[11px] text-gray-400">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
        </div>
      )}

      {/* Main Connection State */}
      {sheetConfig ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>已連動 Google 試算表</span>
              </div>
              <h3 className="text-lg font-black text-gray-900">{sheetConfig.spreadsheetTitle}</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">ID: {sheetConfig.spreadsheetId}</p>
            </div>

            <a
              href={sheetConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span>在 Google Sheets 開啟檢視</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-1">本機儲存紀錄</span>
              <span className="text-xl font-black text-gray-900">{records.length} 筆</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 block mb-1">上次同步時間</span>
              <span className="text-sm font-bold text-gray-800">
                {sheetConfig.lastSyncedAt
                  ? new Date(sheetConfig.lastSyncedAt).toLocaleString('zh-TW')
                  : '尚未同步'}
              </span>
            </div>
          </div>

          {/* Sync actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSyncToSheets}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>同步上傳至 Google 試算表</span>
            </button>

            <button
              onClick={handleImportFromSheets}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>從 Google 試算表載入最新資料</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              每次修改資料均有二次確認保護
            </span>
            <button
              onClick={handleUnlink}
              className="text-xs font-semibold text-gray-400 hover:text-rose-600 transition-colors cursor-pointer underline"
            >
              解除此試算表連動
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Create New */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">一鍵建立全新 Google 記帳試算表</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                系統將會直接在您的 Google 雲端硬碟建立包含表頭、凍結窗格與格式化欄位的「生活開支記帳本」，並同步您目前的所有生活花費紀錄。
              </p>
            </div>
            <button
              onClick={handleCreateSheet}
              disabled={loading}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              立即建立試算表
            </button>
          </div>

          {/* Card 2: Link Existing */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">連結已有 Google 試算表</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                若您已經在 Google Drive 建立過開支表格，貼上試算表網址或 Spreadsheet ID 即可快速綁定連動。
              </p>
            </div>

            {showExistingInput ? (
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  value={existingInput}
                  onChange={(e) => setExistingInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={handleLinkExisting}
                  disabled={loading || !existingInput.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  確認連結
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowExistingInput(true)}
                className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
              >
                輸入試算表網址
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spreadsheet Format Reference Preview */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-emerald-600" />
          <h4 className="text-sm font-bold text-gray-900">Google 試算表欄位結構 (自動建立)</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-emerald-50 text-emerald-950 font-bold">
              <tr>
                {SHEET_HEADERS.map((h, i) => (
                  <th key={i} className="px-3 py-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 font-medium text-gray-700">
              <tr>
                <td className="px-3 py-2 text-gray-400 font-mono">rec_20261017_01</td>
                <td className="px-3 py-2">2026-10-17</td>
                <td className="px-3 py-2 text-rose-600 font-bold">支出</td>
                <td className="px-3 py-2">餐飲美食</td>
                <td className="px-3 py-2">早午餐 (鮪魚蛋餅 + 冰美式)</td>
                <td className="px-3 py-2 font-bold">125</td>
                <td className="px-3 py-2">行動支付 / LINE Pay</td>
                <td className="px-3 py-2 text-gray-400">週末悠閒早午餐</td>
                <td className="px-3 py-2 text-gray-400">2026-10-17 09:30</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-400 font-mono">rec_20261005_01</td>
                <td className="px-3 py-2">2026-10-05</td>
                <td className="px-3 py-2 text-emerald-700 font-bold">收入</td>
                <td className="px-3 py-2">薪資收入</td>
                <td className="px-3 py-2">十月份本薪發放</td>
                <td className="px-3 py-2 font-bold">52000</td>
                <td className="px-3 py-2">銀行轉帳</td>
                <td className="px-3 py-2 text-gray-400">公司發薪日</td>
                <td className="px-3 py-2 text-gray-400">2026-10-05 10:00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
