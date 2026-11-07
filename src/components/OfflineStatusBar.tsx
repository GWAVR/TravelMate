import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineStatusBarProps {
  onOpenDiagnostics: () => void;
}

export function OfflineStatusBar({ onOpenDiagnostics }: OfflineStatusBarProps) {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, diagnostics } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="w-full bg-gradient-to-r from-[#9a3412] via-[#c2410c] to-[#ea580c] text-white px-4 py-2 shadow-md animate-in slide-in-from-top duration-300 relative z-30"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <div className="min-w-0">
            <span className="font-extrabold tracking-wide">
              {isSimulatedOffline ? 'SIMULATED OFFLINE' : 'OFFLINE MODE'}
            </span>
            <span className="hidden sm:inline text-white/90 ml-1.5">
              • Accessing cached {diagnostics.activityCount} stops &amp; {diagnostics.expenseCount} expenses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenDiagnostics}
            className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-[11px] font-bold backdrop-blur-xs transition-colors flex items-center gap-1"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">storage</span>
            <span>Cache Status</span>
          </button>

          {isSimulatedOffline && (
            <button
              onClick={toggleSimulatedOffline}
              className="px-2 py-1 rounded-lg bg-white text-[#9a3412] text-[11px] font-extrabold hover:bg-white/90 transition-colors"
              type="button"
            >
              Go Online
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
