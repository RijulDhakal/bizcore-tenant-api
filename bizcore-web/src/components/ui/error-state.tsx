import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ 
  message = "Failed to load data. Please check your connection and try again.", 
  onRetry,
  className = ""
}: ErrorStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-[#1A1D27] border border-red-500/20 rounded-2xl animate-in fade-in zoom-in duration-300 ${className}`}>
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <AlertCircle className="text-red-500" size={40} />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">Something went wrong</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-[#4F6EF7] hover:bg-[#3B5BDB] text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#4F6EF7]/20"
        >
          <RefreshCcw size={16} />
          Retry Request
        </button>
      )}
    </div>
  );
};
