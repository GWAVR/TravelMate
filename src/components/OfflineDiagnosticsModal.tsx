import { useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getCachedExpenses, getCachedActivities, resetCacheToDefaults } from '../utils/offlineStorage';
import { Expense, ItineraryActivity } from '../types';

interface OfflineDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onDataReset?: (newExpenses: Expense[], newActivities: ItineraryActivity[]) => void;
}

export function OfflineDiagnosticsModal({
  isOpen,
  onClose,
  onShowToast,
  onDataReset,
}: OfflineDiagnosticsModalProps) {
  const { isOnline, isRealOnline, isSimulatedOffline, toggleSimulatedOffline, diagnostics, refreshDiagnostics } =
    useNetworkStatus();
  const [activeTab, setActiveTab] = useState<'status' | 'activities' | 'expenses'>('status');

  if (!isOpen) return null;

  const cachedExpenses = getCachedExpenses();
  const cachedActivities = getCachedActivities();

  const handleForceSync = () => {
    refreshDiagnostics();
    onShowToast('✓ LocalStorage & Service Worker cache refreshed!');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all offline itinerary and expenses back to initial trip defaults?')) {
      const reset = resetCacheToDefaults();
      refreshDiagnostics();
      if (onDataReset) {
        onDataReset(reset.expenses, reset.activities);
      }
      onShowToast('Reset offline cache to initial trip data!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#e2e8f0]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#006194] to-[#004f7a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-white">
                {isOnline ? 'cloud_done' : 'cloud_off'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Offline Cache &amp; Storage</h3>
              <p className="text-[11px] text-[#e0f2fe]">Service Worker &amp; LocalStorage Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            type="button"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 pt-3 pb-2 border-b border-[#f1f5f9] gap-2 bg-[#faf8ff]">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'status'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-[#64748b] hover:bg-[#e2e7ff]/40'
            }`}
            type="button"
          >
            Diagnostics &amp; Controls
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activities'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-[#64748b] hover:bg-[#e2e7ff]/40'
            }`}
            type="button"
          >
            Itinerary ({cachedActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'expenses'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-[#64748b] hover:bg-[#e2e7ff]/40'
            }`}
            type="button"
          >
            Expenses ({cachedExpenses.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#131b2e]">
          {activeTab === 'status' && (
            <>
              {/* Online/Offline Status Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isOnline
                    ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                    : 'bg-[#fff7ed] border-[#fed7aa] text-[#9a3412]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[22px]">
                      {isOnline ? 'wifi' : 'wifi_off'}
                    </span>
                    <div>
                      <div className="font-bold text-sm">
                        {isOnline ? 'Online (Real-time & Cached)' : 'Offline Mode Active'}
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        {isSimulatedOffline
                          ? 'Simulated offline mode enabled for preview testing.'
                          : isRealOnline
                          ? 'Browser has internet connectivity.'
                          : 'No internet connection detected.'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isOnline ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#ffedd5] text-[#c2410c]'
                    }`}
                  >
                    {isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Simulation Mode Toggle Button */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-[#131b2e]">Simulate Offline Mode</div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">
                    Test how TravelMate renders itinerary &amp; expenses without network
                  </div>
                </div>
                <button
                  onClick={toggleSimulatedOffline}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
                    isSimulatedOffline
                      ? 'bg-[#ea580c] text-white shadow-xs'
                      : 'bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1]'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSimulatedOffline ? 'toggle_on' : 'toggle_off'}
                  </span>
                  <span>{isSimulatedOffline ? 'Offline ON' : 'Offline OFF'}</span>
                </button>
              </div>

              {/* Cache Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#006194]">
                    <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                    <span className="font-bold text-xs">Cached Expenses</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#131b2e] mt-2">
                    {diagnostics.expenseCount} items
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">
                    Total: ${diagnostics.totalExpenseUsd.toFixed(2)} USD
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#006194]">
                    <span className="material-symbols-outlined text-[18px]">map</span>
                    <span className="font-bold text-xs">Cached Stops</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#131b2e] mt-2">
                    {diagnostics.activityCount} stops
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">Full Day 3 timeline &amp; routes</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#006194]">
                    <span className="material-symbols-outlined text-[18px]">cached</span>
                    <span className="font-bold text-xs">Service Worker</span>
                  </div>
                  <div className="text-sm font-bold text-[#006c49] mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>Registered &amp; Active</span>
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">Precached /sw.js shell</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
                  <div className="flex items-center gap-1.5 text-[#006194]">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span className="font-bold text-xs">Storage Footprint</span>
                  </div>
                  <div className="text-sm font-bold text-[#131b2e] mt-2">
                    ~{(diagnostics.storageBytesEstimate / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">HTML5 LocalStorage</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleForceSync}
                  className="flex-1 py-2.5 rounded-xl bg-[#006194] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#004f7a] transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span>Sync &amp; Validate Cache</span>
                </button>
                <button
                  onClick={handleResetData}
                  className="px-4 py-2.5 rounded-xl bg-[#fee2e2] text-[#b91c1c] font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#fecaca] transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">restore</span>
                  <span>Reset Cache</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[#64748b] text-[11px] pb-1">
                <span>Stored in localStorage key: travelmate_cached_itinerary_v1</span>
                <span className="font-bold text-[#006194]">{cachedActivities.length} Activities</span>
              </div>
              {cachedActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-[#e2e7ff] text-[#006194] font-bold flex items-center justify-center text-xs shrink-0">
                      {act.day || 3}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#131b2e] truncate">{act.title}</h4>
                      <p className="text-[10px] text-[#64748b] truncate">
                        {act.timeSlot} • {act.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#e2e8f0] text-[#006194] shrink-0">
                    {act.cost || 'Free'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[#64748b] text-[11px] pb-1">
                <span>Stored in localStorage key: travelmate_cached_expenses_v1</span>
                <span className="font-bold text-[#006194]">{cachedExpenses.length} Records</span>
              </div>
              {cachedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-[#006194] shrink-0">
                      {exp.category === 'food'
                        ? 'restaurant'
                        : exp.category === 'transport'
                        ? 'train'
                        : exp.category === 'stays'
                        ? 'hotel'
                        : 'payments'}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#131b2e] truncate">{exp.title}</h4>
                      <p className="text-[10px] text-[#64748b] truncate">
                        {exp.date} • Paid by {exp.payerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-[#131b2e]">
                      ${exp.amountUsd.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[#006c49] font-medium">{exp.splitDetails}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#faf8ff] border-t border-[#f1f5f9] flex items-center justify-between">
          <span className="text-[11px] text-[#64748b]">
            Last Synced: {new Date(diagnostics.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-bold hover:bg-[#004f7a] transition-colors"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
