import React from 'react';
import {
  Wallet,
  ListOrdered,
  BarChart3,
  FileSpreadsheet,
  Plus,
  Download,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSheetConfig } from '../types/expense';

export type ActiveTab = 'list' | 'report' | 'sheets';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickAdd: () => void;
  onExportExcel: () => void;
  onOpenSheetsModal: () => void;
  user: User | null;
  sheetConfig: GoogleSheetConfig | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onQuickAdd,
  onExportExcel,
  onOpenSheetsModal,
  user,
  sheetConfig,
}) => {
  return (
    <>
      {/* Desktop / Tablet Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 text-lg select-none">
                🐷
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900 leading-tight flex items-center gap-1.5">
                  <span>生活開支記帳本</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200 hidden sm:inline">
                    嘟嘟金庫 ✨
                  </span>
                </h1>
                <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                  Google Sheets 雲端連動 • Excel 匯出 • 消費圖表報告
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60">
              <button
                onClick={() => onTabChange('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>明細紀錄</span>
              </button>

              <button
                onClick={() => onTabChange('report')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'report'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>每月消費分析</span>
              </button>

              <button
                onClick={() => onTabChange('sheets')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                  activeTab === 'sheets'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google 試算表</span>
                {sheetConfig ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="已連動 Google 試算表" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300" title="未連動" />
                )}
              </button>
            </nav>

            {/* Right Side Header Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Excel Export */}
              <button
                onClick={onExportExcel}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="匯出完整 Excel 報表 (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>匯出 Excel</span>
              </button>

              {/* Quick Record Button */}
              <button
                onClick={onQuickAdd}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>記一筆</span>
              </button>

              {/* Google Sheets / Auth Status Button */}
              <button
                onClick={onOpenSheetsModal}
                className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  user
                    ? 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
                title={user ? `${user.displayName || user.email} (點擊設定試算表)` : '登入 Google 帳號'}
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google'}
                    className="w-6 h-6 rounded-full border border-emerald-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user?.displayName?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <span className="hidden md:inline truncate max-w-[100px]">
                  {user ? user.displayName || '已登入' : 'Google 試算表連動'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, accessible) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg px-2 py-1.5 pb-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => onTabChange('list')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'list' ? 'text-emerald-700 font-black' : 'text-gray-500'
            }`}
          >
            <ListOrdered className={`w-5 h-5 mb-0.5 ${activeTab === 'list' ? 'stroke-[2.5]' : ''}`} />
            <span>明細</span>
          </button>

          <button
            onClick={() => onTabChange('report')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'report' ? 'text-emerald-700 font-black' : 'text-gray-500'
            }`}
          >
            <BarChart3 className={`w-5 h-5 mb-0.5 ${activeTab === 'report' ? 'stroke-[2.5]' : ''}`} />
            <span>月報表</span>
          </button>

          {/* Center Floating Add Button */}
          <button
            onClick={onQuickAdd}
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 mt-1">記一筆</span>
          </button>

          <button
            onClick={() => onTabChange('sheets')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold transition-colors cursor-pointer relative ${
              activeTab === 'sheets' ? 'text-emerald-700 font-black' : 'text-gray-500'
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 mb-0.5 ${activeTab === 'sheets' ? 'stroke-[2.5]' : ''}`} />
            <span>試算表</span>
            {sheetConfig && (
              <span className="absolute top-1 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={onExportExcel}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-bold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <Download className="w-5 h-5 mb-0.5" />
            <span>匯出</span>
          </button>
        </div>
      </div>
    </>
  );
};
