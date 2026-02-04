import { useToast } from '@/contexts/ToastContext';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-md pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex gap-3 p-4 rounded-lg shadow-lg pointer-events-auto animate-in slide-in-from-right-5 fade-in ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : toast.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : toast.type === 'warning'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            {toast.type === 'warning' && (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            {toast.type === 'info' && (
              <Info className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p
              className={`font-medium ${
                toast.type === 'success'
                  ? 'text-green-900'
                  : toast.type === 'error'
                  ? 'text-red-900'
                  : toast.type === 'warning'
                  ? 'text-amber-900'
                  : 'text-blue-900'
              }`}
            >
              {toast.title}
            </p>
            {toast.message && (
              <p
                className={`text-sm mt-1 ${
                  toast.type === 'success'
                    ? 'text-green-700'
                    : toast.type === 'error'
                    ? 'text-red-700'
                    : toast.type === 'warning'
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}
              >
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
