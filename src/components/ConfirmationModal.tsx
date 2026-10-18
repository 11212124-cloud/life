import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = '確認執行',
  cancelLabel = '取消',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-full ${
                  isDestructive ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{message}</p>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-100'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
