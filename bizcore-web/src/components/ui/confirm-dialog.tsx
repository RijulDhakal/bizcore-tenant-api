import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = true
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={clsx(
          "absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Dialog Panel */}
      <div 
        className={clsx(
          "relative w-full max-w-md transform rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] p-8 shadow-2xl transition-all duration-200 ease-out theme-transition",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <div className="flex items-start gap-5">
          <div className={clsx(
            "rounded-2xl p-4 bg-opacity-10 shrink-0",
            isDanger ? "bg-rose-500 text-rose-500" : "bg-[#4F6EF7] text-[#4F6EF7]"
          )}>
            <AlertCircle size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-[var(--text-primary)] leading-tight italic uppercase tracking-tight">{title}</h3>
            <p className="mt-2 text-[var(--text-secondary)] leading-relaxed text-sm font-medium">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-sans"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={clsx(
              "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg font-sans",
              isDanger 
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                : "bg-[#4F6EF7] hover:bg-[#3B5BDB] text-white shadow-[#4F6EF7]/20"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
