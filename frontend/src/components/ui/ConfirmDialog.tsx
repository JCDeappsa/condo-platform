import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

type DialogType = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
}

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const alert = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const typeConfig = {
    danger: { icon: <AlertTriangle size={24} />, iconBg: 'bg-red-100 text-red-600', btnClass: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: <AlertTriangle size={24} />, iconBg: 'bg-yellow-100 text-yellow-600', btnClass: 'bg-yellow-600 hover:bg-yellow-700' },
    info: { icon: <Info size={24} />, iconBg: 'bg-blue-100 text-blue-600', btnClass: 'bg-blue-600 hover:bg-blue-700' },
  };

  const toastConfig = {
    success: { icon: <CheckCircle size={18} />, bg: 'bg-green-600' },
    error: { icon: <AlertTriangle size={18} />, bg: 'bg-red-600' },
    info: { icon: <Info size={18} />, bg: 'bg-blue-600' },
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      {/* Confirm Dialog */}
      {dialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={handleCancel}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${typeConfig[dialog.type || 'info'].iconBg}`}>
                  {typeConfig[dialog.type || 'info'].icon}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-lg font-semibold text-gray-900">{dialog.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{dialog.message}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                {dialog.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm transition-colors ${typeConfig[dialog.type || 'info'].btnClass}`}
              >
                {dialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${toastConfig[toast.type].bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] animate-in`}
          >
            {toastConfig[toast.type].icon}
            <span className="text-sm flex-1">{toast.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ConfirmContext.Provider>
  );
}
