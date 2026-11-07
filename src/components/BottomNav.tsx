import { ScreenTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  onQuickAdd: () => void;
}

export function BottomNav({ activeTab, onTabChange, onQuickAdd }: BottomNavProps) {
  const { t } = useLanguage();

  const tabs: { id: ScreenTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: 'dashboard' },
    { id: 'itinerary', label: t('nav.itinerary'), icon: 'calendar_today' },
    { id: 'lodging', label: 'Hotels', icon: 'hotel' },
    { id: 'expenses', label: t('nav.expenses'), icon: 'receipt_long' },
    { id: 'explore-ai', label: 'Explore', icon: 'explore' },
    { id: 'tripgenie', label: t('nav.tripgenie'), icon: 'psychology' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <>
      {/* Floating Action Button (FAB) positioned above the bottom bar on mobile, corner on desktop */}
      <button
        onClick={onQuickAdd}
        aria-label="Add Expense or Log Activity"
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 w-14 h-14 rounded-full bg-[#006194] text-white flex items-center justify-center shadow-[0_10px_25px_-3px_rgba(0,97,148,0.45)] hover:bg-[#007bb9] active:scale-95 transition-all focus:outline-none"
        type="button"
        title="+ Add Expense or Log (₹)"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Docked Bottom Bar (Visible on mobile & tablet, hidden on desktop website) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#faf8ff]/90 backdrop-blur-xl border-t border-[#e2e8f0]/80 shadow-[0_-4px_16px_-2px_rgba(15,23,42,0.06)]"
        aria-label="Main Navigation"
      >
        <div className="max-w-xl mx-auto flex justify-around items-center h-16 px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] transition-colors ${
                  isActive
                    ? 'text-[#006194] font-bold'
                    : 'text-[#64748b] hover:text-[#131b2e]'
                }`}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span className="text-[10px] leading-tight font-medium tracking-tight">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006194] -mb-1 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
