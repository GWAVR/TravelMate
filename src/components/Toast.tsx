interface ToastProps {
  message: string | null;
  icon?: string;
}

export function Toast({ message, icon = 'check_circle' }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-3">
      <div className="bg-[#283044] text-[#eef0ff] px-4 py-2 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 max-w-sm border border-white/10">
        <span className="material-symbols-outlined text-[18px] text-[#6cf8bb]">
          {icon}
        </span>
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
