import { useState } from 'react';
import { ALL_CURRENCIES, CurrencyInfo } from '../utils/currencies';

interface CurrencyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCurrency: (code: string) => void;
  selectedCode?: string;
  title?: string;
}

export function CurrencyPickerModal({
  isOpen,
  onClose,
  onSelectCurrency,
  selectedCode,
  title = 'Select Currency',
}: CurrencyPickerModalProps) {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('All');

  if (!isOpen) return null;

  const regions = [
    'All',
    'Popular',
    'South Asia',
    'Asia & Pacific',
    'Europe',
    'Middle East & Africa',
    'Americas',
  ];

  const filteredCurrencies = ALL_CURRENCIES.filter((curr: CurrencyInfo) => {
    // Region / Category filter
    let matchesRegion = true;
    if (regionFilter === 'Popular') {
      matchesRegion = !!curr.popular;
    } else if (regionFilter !== 'All') {
      matchesRegion = curr.region === regionFilter;
    }

    // Search query filter
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      curr.code.toLowerCase().includes(q) ||
      curr.name.toLowerCase().includes(q) ||
      curr.symbol.toLowerCase().includes(q);

    return matchesRegion && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">payments</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#131b2e]">{title}</h3>
              <p className="text-[11px] text-[#64748b]">
                {ALL_CURRENCIES.length} world currencies supported
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#131b2e] hover:bg-[#f1f5f9] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#f1f5f9] space-y-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[18px]">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search currency (e.g. INR, USD, Yen, Baht, Euro)..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f8faff] border border-[#e2e8f0] text-xs text-[#131b2e] placeholder:text-[#94a3b8] outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194]"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                  regionFilter === r
                    ? 'bg-[#006194] text-white shadow-2xs'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#f8faff] space-y-0.5">
          {filteredCurrencies.length === 0 ? (
            <div className="p-8 text-center text-[#64748b]">
              <span className="material-symbols-outlined text-[32px] text-[#94a3b8]">search_off</span>
              <p className="text-xs font-semibold mt-1">No currency found</p>
              <p className="text-[10px] text-[#94a3b8]">Try searching by currency name, symbol, or country code.</p>
            </div>
          ) : (
            filteredCurrencies.map((curr) => {
              const isSelected = selectedCode === curr.code;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => {
                    onSelectCurrency(curr.code);
                    onClose();
                  }}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? 'bg-[#e0f2fe] border border-[#bae6fd]'
                      : 'hover:bg-[#f8faff]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{curr.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#131b2e]">{curr.code}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#f1f5f9] text-[#475569] text-[10px] font-mono font-bold">
                          {curr.symbol}
                        </span>
                        {curr.popular && (
                          <span className="px-1 py-0.2 rounded-full bg-[#fef3c7] text-[#92400e] text-[8px] font-bold">
                            TOP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748b] truncate mt-0.5">{curr.name}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[11px] font-mono font-semibold text-[#1e293b] block">
                      1 USD = {curr.rateToUsd >= 100 ? Math.round(curr.rateToUsd).toLocaleString() : curr.rateToUsd.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-[#94a3b8] block">{curr.region}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#f8faff] border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
          <span>Exchange rates updated with live reference</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white border border-[#e2e8f0] text-xs font-bold text-[#131b2e] hover:bg-[#f1f5f9]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
