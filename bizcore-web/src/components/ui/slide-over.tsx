import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number; // width in px
  footer?: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 480,
  footer
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Small delay to trigger entry animation
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Delay dismissal until after animation
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={clsx(
          "absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div 
          className={clsx(
            "pointer-events-auto h-full transition-transform duration-300 ease-in-out flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl theme-transition",
            isVisible ? "translate-x-0" : "translate-x-full"
          )}
          style={{ width: `${width}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-color)]/50">
            <h2 className="text-xl font-black text-[var(--text-primary)] italic uppercase tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 py-5 border-t border-[var(--border-color)]/50 bg-[var(--bg-elevated)]/30">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
