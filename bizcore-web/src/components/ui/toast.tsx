import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={clsx(
      "fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-[#1A1D27] text-white px-4 py-3 rounded-lg shadow-2xl border-l-4 animate-in fade-in slide-in-from-right-4 duration-300",
      type === 'success' ? "border-l-[#22C55E]" : "border-l-[#EF4444]"
    )}>
      {type === 'success' ? (
        <CheckCircle className="text-[#22C55E]" size={20} />
      ) : (
        <XCircle className="text-[#EF4444]" size={20} />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button 
        onClick={onClose}
        className="ml-2 text-gray-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Simple hook-like pattern for ease of use in pages
export function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(t => (
        <Toast 
          key={t.id} 
          message={t.message} 
          type={t.type} 
          onClose={() => removeToast(t.id)} 
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
