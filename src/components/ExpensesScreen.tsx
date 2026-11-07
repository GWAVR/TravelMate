import { useState, useEffect, useRef } from 'react';
import { Expense, Currency, Member, UserProfile } from '../types';
import { CurrencyConverterUtility } from './CurrencyConverterUtility';
import { formatCurrency, getCurrencyInfo } from '../utils/currencies';
import { CurrencyPickerModal } from './CurrencyPickerModal';
import { INITIAL_MEMBERS } from '../data/mockData';
import { UserAvatar } from './UserAvatar';

interface ExpensesScreenProps {
  expenses: Expense[];
  onOpenExpenseDetails: (expenseId: string) => void;
  onOpenAddExpense: () => void;
  onShowToast: (msg: string) => void;
  isOffline?: boolean;
  onOpenOfflineModal?: () => void;
  members?: Member[];
  currentUser?: UserProfile;
  budgetLimit?: number;
  onNavigateToProfile?: () => void;
}

export function ExpensesScreen({
  expenses,
  onOpenExpenseDetails,
  onOpenAddExpense,
  onShowToast,
  isOffline = false,
  onOpenOfflineModal,
  members = INITIAL_MEMBERS,
  currentUser,
  budgetLimit,
  onNavigateToProfile,
}: ExpensesScreenProps) {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'food' | 'transport' | 'stays' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settledDebts, setSettledDebts] = useState<{ [key: string]: boolean }>({});

  const activeCurrencyInfo = getCurrencyInfo(currency);

  const formatAmount = (usd: number) => {
    return formatCurrency(usd, currency);
  };

  // Real-time trip totals & budget calculation
  const totalTripSpendUsd = expenses.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
  const rawBudgetLimit = budgetLimit ?? currentUser?.tripBudgetLimit;
  const tripBudgetLimitUsd = rawBudgetLimit && rawBudgetLimit > 1000 ? rawBudgetLimit : 45000;
  const isOverBudget = totalTripSpendUsd > tripBudgetLimitUsd;
  const overBudgetDiffUsd = totalTripSpendUsd - tripBudgetLimitUsd;
  const budgetUtilizationPercent = tripBudgetLimitUsd > 0
    ? Math.round((totalTripSpendUsd / tripBudgetLimitUsd) * 1000) / 10
    : 100;

  // Personal net share calculation
  const userNetShareUsd = expenses.reduce((sum, item) => {
    if (item.payerId === 'alex' || item.payerId === currentUser?.id) {
      return sum + (item.isPersonal ? item.amountUsd : (item.personalShareUsd || item.amountUsd / 4));
    }
    return sum + (item.personalShareUsd || 0);
  }, 0);
  const userSharePercent = totalTripSpendUsd > 0
    ? Math.round((userNetShareUsd / totalTripSpendUsd) * 100)
    : 0;

  // Automated Warning Toast Trigger when total trip expenses exceed predefined budget limit
  const lastWarnedTotalRef = useRef<number>(0);

  useEffect(() => {
    if (isOverBudget && lastWarnedTotalRef.current !== totalTripSpendUsd) {
      lastWarnedTotalRef.current = totalTripSpendUsd;
      const formattedTotal = formatCurrency(totalTripSpendUsd, currency);
      const formattedLimit = formatCurrency(tripBudgetLimitUsd, currency);
      const formattedDiff = formatCurrency(overBudgetDiffUsd, currency);
      onShowToast(
        `⚠️ Budget Alert: Total trip expenses (${formattedTotal}) have exceeded your defined budget limit of ${formattedLimit} by ${formattedDiff}!`
      );
    } else if (!isOverBudget) {
      lastWarnedTotalRef.current = 0;
    }
  }, [isOverBudget, totalTripSpendUsd, tripBudgetLimitUsd, currency, overBudgetDiffUsd, onShowToast]);

  const triggerBudgetWarningToast = () => {
    const formattedTotal = formatCurrency(totalTripSpendUsd, currency);
    const formattedLimit = formatCurrency(tripBudgetLimitUsd, currency);
    const formattedDiff = formatCurrency(overBudgetDiffUsd, currency);
    if (isOverBudget) {
      onShowToast(
        `⚠️ Budget Warning: Total trip expenses (${formattedTotal}) exceed your budget limit of ${formattedLimit} by ${formattedDiff}!`
      );
    } else {
      const remaining = formatCurrency(tripBudgetLimitUsd - totalTripSpendUsd, currency);
      onShowToast(
        `✓ On Budget: Total spend ${formattedTotal} of ${formattedLimit} (${remaining} remaining).`
      );
    }
  };

  // Dynamic category calculations
  const catAccom = expenses.filter(e => e.category === 'stays').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catFood = expenses.filter(e => e.category === 'food').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catTrans = expenses.filter(e => e.category === 'transport').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catOther = expenses.filter(e => e.category !== 'stays' && e.category !== 'food' && e.category !== 'transport').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catTotal = (catAccom + catFood + catTrans + catOther) || 1;
  const pctAccom = Math.round((catAccom / catTotal) * 100);
  const pctFood = Math.round((catFood / catTotal) * 100);
  const pctTrans = Math.round((catTrans / catTotal) * 100);
  const pctOther = Math.max(0, 100 - (pctAccom + pctFood + pctTrans));

  const filteredExpenses = expenses.filter((item) => {
    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'mine' && (item.payerId === 'alex' || item.isPersonal)) ||
      (selectedFilter === 'food' && item.category === 'food') ||
      (selectedFilter === 'transport' && item.category === 'transport') ||
      (selectedFilter === 'stays' && (item.category === 'stays' || item.category === 'activities'));

    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.payerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.splitDetails || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = 'ID,Title,Category,Amount USD,Date,Payer,Split\n';
    const rows = expenses
      .map(
        (e) =>
          `"${e.id || ''}","${e.title || ''}","${e.categoryLabel || e.category || ''}","${e.amountUsd || 0}","${e.date || ''}","${e.payerName || ''}","${e.splitDetails || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TravelMate-Expenses-${currency}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Exported ${expenses.length} logs to CSV (${currency}).`);
  };

  return (
    <div className="flex flex-col w-full px-4 pb-12 space-y-4">
      {/* Overview Header & Currency Control Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">
            Group Ledger
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#131b2e]">
            Expenses &amp; Splits
          </h1>
        </div>

        {/* Currency Toggle Pill & Picker */}
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-[#e2e7ff] text-[#3f4850] shadow-xs flex-wrap">
          {(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const).map((currCode) => {
            const info = getCurrencyInfo(currCode);
            const isSelected = currency === currCode;
            return (
              <button
                key={currCode}
                onClick={() => {
                  setCurrency(currCode);
                  onShowToast(`Display currency set to ${currCode} (${info.symbol})`);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-[#006194] shadow-xs'
                    : 'text-[#64748b] hover:text-[#131b2e]'
                }`}
                type="button"
              >
                {currCode} ({info.symbol})
              </button>
            );
          })}
          <button
            onClick={() => setIsCurrencyPickerOpen(true)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-0.5 ${
              !['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(currency)
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#006194] hover:bg-white/60'
            }`}
            type="button"
            title="Browse all 40+ currencies"
          >
            <span>{!['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(currency) ? `${currency} (${activeCurrencyInfo.symbol})` : 'More ▾'}</span>
          </button>
        </div>
      </section>

      {/* Currency Converter Utility Component */}
      <CurrencyConverterUtility
        activeLedgerCurrency={currency}
        onSetLedgerCurrency={(c) => setCurrency(c)}
        onShowToast={onShowToast}
      />

      {/* Live Rate Pill Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#f2f3ff] text-[#475569]">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-[#006194] shrink-0">
            currency_exchange
          </span>
          <span className="text-xs truncate">
            Active Currency: <strong>{activeCurrencyInfo.flag} {currency} ({activeCurrencyInfo.name})</strong> • 1 USD = {activeCurrencyInfo.rateToUsd >= 100 ? Math.round(activeCurrencyInfo.rateToUsd).toLocaleString() : activeCurrencyInfo.rateToUsd.toFixed(2)} {currency}
          </span>
        </div>
        <span className="text-[10px] text-[#006c49] bg-[#d1fae5] px-2 py-0.5 rounded-full font-bold shrink-0">
          Live Rates
        </span>
      </div>

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        isOpen={isCurrencyPickerOpen}
        onClose={() => setIsCurrencyPickerOpen(false)}
        onSelectCurrency={(code) => {
          setCurrency(code);
          onShowToast(`Display currency changed to ${code} (${getCurrencyInfo(code).name})`);
        }}
        selectedCode={currency}
        title="Select Ledger Display Currency"
      />

      {/* Offline Storage Status Indicator */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-[#ea580c] animate-pulse' : 'bg-[#10b981]'}`} />
          <span className="text-[11px] text-[#475569]">
            {isOffline
              ? 'Offline Mode Active • Expenses served from localStorage'
              : 'LocalStorage Caching: Ready • All logs saved locally'}
          </span>
        </div>
        {onOpenOfflineModal && (
          <button
            onClick={onOpenOfflineModal}
            className="text-[11px] text-[#006194] font-bold hover:underline flex items-center gap-0.5"
            type="button"
          >
            <span>Storage Details</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Over-Budget Warning Card Banner */}
      {isOverBudget && (
        <div className="p-3.5 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] space-y-2 text-[#9f1239] shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ffe4e6] flex items-center justify-center shrink-0 text-[#f43f5e]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#e11d48]">
                    Trip Budget Exceeded
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#fecdd3] text-[#be123c] text-[10px] font-bold">
                    {budgetUtilizationPercent}% Limit
                  </span>
                </div>
                <p className="text-[11px] text-[#881337] mt-0.5 leading-snug">
                  Total expenses of <strong>{formatAmount(totalTripSpendUsd)}</strong> exceed your profile limit of <strong>{formatAmount(tripBudgetLimitUsd)}</strong> by <strong>{formatAmount(overBudgetDiffUsd)}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#fecdd3]/60 text-xs">
            <button
              type="button"
              onClick={triggerBudgetWarningToast}
              className="px-3 py-1 rounded-lg bg-[#f43f5e] text-white text-[11px] font-bold hover:bg-[#e11d48] active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
              <span>Trigger Warning Toast</span>
            </button>
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="px-3 py-1 rounded-lg bg-white border border-[#fecdd3] text-[#be123c] text-[11px] font-bold hover:bg-[#fff5f5] active:scale-95 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Adjust in Profile</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expense Summary & Health Card */}
      <section className="rounded-2xl bg-white p-4 shadow-sm space-y-4 border border-[#e2e8f0]/60">
        {/* Top Numbers Grid */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">
                Total Trip Spend
              </span>
              {isOverBudget ? (
                <span className="px-1.5 py-0.2 rounded-md bg-[#ffe4e6] text-[#e11d48] text-[10px] font-extrabold uppercase">
                  Over Budget
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-md bg-[#d1fae5] text-[#006c49] text-[10px] font-bold uppercase">
                  On Target
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl sm:text-2xl font-bold ${isOverBudget ? 'text-[#e11d48]' : 'text-[#131b2e]'}`}>
                {formatAmount(totalTripSpendUsd)}
              </span>
              <span className="text-xs text-[#64748b]">
                / {formatAmount(tripBudgetLimitUsd)}
              </span>
            </div>
            {isOverBudget ? (
              <div className="flex items-center gap-1 mt-1 text-[#e11d48] font-bold">
                <span className="material-symbols-outlined text-[16px] animate-pulse">warning</span>
                <span className="text-xs">{budgetUtilizationPercent}% utilized · +{formatAmount(overBudgetDiffUsd)} over</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 text-[#006c49]">
                <span className="material-symbols-outlined text-[15px]">trending_down</span>
                <span className="text-xs font-semibold">{budgetUtilizationPercent}% utilized · On Track</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">
              Your Net Share
            </span>
            <span className="text-lg font-bold text-[#006194] mt-0.5">
              {formatAmount(userNetShareUsd)}
            </span>
            <span className="text-xs text-[#475569] mt-0.5">{userSharePercent}% of trip total</span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b] font-medium">Budget Consumption</span>
            <span className={`font-bold ${isOverBudget ? 'text-[#e11d48]' : 'text-[#006194]'}`}>
              {budgetUtilizationPercent}% ({formatAmount(totalTripSpendUsd)} / {formatAmount(tripBudgetLimitUsd)})
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#eaedff] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget ? 'bg-[#f43f5e]' : budgetUtilizationPercent > 80 ? 'bg-[#ea580c]' : 'bg-[#006194]'
              }`}
              style={{ width: `${Math.min(budgetUtilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Segmented Category Bar Visual */}
        <div className="space-y-2 pt-1 border-t border-[#f1f5f9]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b] font-medium">Category Breakdown</span>
            <span className="text-[10px] text-[#006194] font-semibold">{expenses.length} expenses logged</span>
          </div>
          <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-[#eaedff] gap-0.5 p-0.5">
            <div className="h-full rounded-l-full bg-[#006194] transition-all" style={{ width: `${Math.max(pctAccom, 4)}%` }} />
            <div className="h-full bg-[#0ea5e9] transition-all" style={{ width: `${Math.max(pctFood, 4)}%` }} />
            <div className="h-full bg-[#a36700] transition-all" style={{ width: `${Math.max(pctTrans, 4)}%` }} />
            <div className="h-full rounded-r-full bg-[#006c49] transition-all" style={{ width: `${Math.max(pctOther, 4)}%` }} />
          </div>

          {/* Category Legend Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f2f3ff]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#006194] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#64748b] truncate">Stays &amp; Hotels ({pctAccom}%)</span>
                <span className="text-xs text-[#131b2e] font-bold">{formatAmount(catAccom)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f2f3ff]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#64748b] truncate">Food &amp; Drinks ({pctFood}%)</span>
                <span className="text-xs text-[#131b2e] font-bold">{formatAmount(catFood)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f2f3ff]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#a36700] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#64748b] truncate">Transport ({pctTrans}%)</span>
                <span className="text-xs text-[#131b2e] font-bold">{formatAmount(catTrans)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f2f3ff]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#006c49] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#64748b] truncate">Activities &amp; Other ({pctOther}%)</span>
                <span className="text-xs text-[#131b2e] font-bold">{formatAmount(catOther)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group Settlement Hub Matrix */}
      <section className="rounded-2xl bg-white p-4 shadow-sm space-y-3 border border-[#e2e8f0]/60">
        {/* Settlement Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#d1fae5] text-[#006c49]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#006c49]/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-[#006c49]">
                account_balance_wallet
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#006c49]">
                Net Balance Position
              </span>
              <span className="text-sm font-bold text-[#006c49] leading-tight">
                {expenses.length === 0 || members.length <= 1
                  ? `All settled · ${formatAmount(0)}`
                  : `You are owed +${formatAmount(84.50)}`}
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] text-[#006c49]/70">
            verified
          </span>
        </div>

        {/* Member Breakdown Rows */}
        {members.length <= 1 ? (
          <div className="p-3 text-center rounded-xl bg-[#f8fafc] text-xs text-[#64748b]">
            <p className="font-bold text-[#131b2e]">Solo Traveler Mode (1 Member)</p>
            <p className="text-[11px] mt-0.5 text-[#64748b]">
              You have no pending group balances. Add travel companions to track shared splits.
            </p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-3 text-center rounded-xl bg-[#f8fafc] text-xs text-[#64748b]">
            <p className="font-bold text-[#131b2e]">No group expenses recorded yet</p>
            <p className="text-[11px] mt-0.5 text-[#64748b]">
              Log shared expenses with your {members.length} companions to compute automatic settlements.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 pt-1">
              {members.slice(1).map((m, idx) => {
                const isOwed = (m.netBalance ?? (idx % 2 === 0 ? 54.5 : -18.0)) >= 0;
                const amountVal = Math.abs(m.netBalance ?? (idx % 2 === 0 ? 54.5 : 18.0));
                const isSettled = settledDebts[m.id];

                return (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#f2f3ff]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <UserAvatar
                          name={m.name}
                          avatar={m.avatar}
                          initials={m.initials}
                          size="md"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            isOwed ? 'bg-[#006c49]' : 'bg-[#f43f5e]'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#131b2e] truncate">{m.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold self-start mt-0.5 ${
                            isOwed
                              ? 'bg-[#d1fae5] text-[#006c49]'
                              : 'bg-[#ffe4e6] text-[#f43f5e]'
                          }`}
                        >
                          {isSettled
                            ? 'Settled'
                            : isOwed
                            ? `Owes you ${formatAmount(amountVal)}`
                            : `You owe ${formatAmount(amountVal)}`}
                        </span>
                      </div>
                    </div>
                    {isSettled ? (
                      <span className="px-3 py-1.5 rounded-full bg-[#d1fae5] text-[#006c49] text-xs font-bold shrink-0">
                        Settled ✓
                      </span>
                    ) : isOwed ? (
                      <button
                        onClick={() => {
                          onShowToast(`Payment reminder dispatched to ${m.name}.`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#e0f2fe] text-[#006194] text-xs font-bold hover:bg-[#006194] hover:text-white active:scale-95 transition-all shrink-0"
                        type="button"
                      >
                        Remind
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSettledDebts({ ...settledDebts, [m.id]: true });
                          onShowToast(`Settled ${formatAmount(amountVal)} with ${m.name}.`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#f43f5e] text-white text-xs font-bold hover:opacity-95 active:scale-95 shadow-xs transition-all shrink-0"
                        type="button"
                      >
                        Settle Up
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hub Footer Actions */}
            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => {
                  setSettledDebts({ kenji: true, maya: true, sarah: true });
                  onShowToast('Optimized group debt settlement graph resolved all balances!');
                }}
                className="w-full py-2.5 rounded-xl bg-[#e2e7ff] text-[#131b2e] text-xs font-bold hover:bg-[#dae2fd] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">handshake</span>
                <span>Settle All Debts Automatically</span>
              </button>
            </div>
          </>
        )}
      </section>

      {/* Transaction Feed Section */}
      <section className="space-y-3 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-[#131b2e]">Transactions</h2>
            <span className="text-[10px] font-bold bg-[#e2e7ff] px-2 py-0.5 rounded-full text-[#475569]">
              {filteredExpenses.length} logs
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-[#006194] text-xs font-semibold hover:underline flex items-center gap-0.5"
            type="button"
          >
            <span>Export CSV</span>
            <span className="material-symbols-outlined text-[14px]">download</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#64748b]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white text-[#131b2e] placeholder:text-[#64748b] text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-[#006194]/20 border border-[#e2e8f0]/60"
            placeholder="Search dinner, train, pass..."
            type="text"
          />
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
              selectedFilter === 'all'
                ? 'bg-[#006194] text-white'
                : 'bg-white text-[#475569] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            All ({expenses.length})
          </button>
          <button
            onClick={() => setSelectedFilter('food')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
              selectedFilter === 'food'
                ? 'bg-[#006194] text-white'
                : 'bg-white text-[#475569] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            Food
          </button>
          <button
            onClick={() => setSelectedFilter('transport')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
              selectedFilter === 'transport'
                ? 'bg-[#006194] text-white'
                : 'bg-white text-[#475569] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            Transport
          </button>
          <button
            onClick={() => setSelectedFilter('stays')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
              selectedFilter === 'stays'
                ? 'bg-[#006194] text-white'
                : 'bg-white text-[#475569] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            Stays
          </button>
          <button
            onClick={() => setSelectedFilter('mine')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 shadow-xs transition-colors ${
              selectedFilter === 'mine'
                ? 'bg-[#006194] text-white'
                : 'bg-white text-[#475569] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            My Expenses
          </button>
        </div>

        {/* Transaction List Cards */}
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#e2e8f0] shadow-xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#e2e7ff] text-[#006194] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#131b2e]">
                {expenses.length === 0 ? 'No expenses logged yet' : 'No matching expenses'}
              </h4>
              <p className="text-xs text-[#64748b] mt-1 max-w-xs mx-auto">
                {expenses.length === 0
                  ? 'Keep track of your travel spending. Record meals, transit, stays, and activities with automatic currency conversion.'
                  : `No expenses match "${searchQuery || selectedFilter}".`}
              </p>
            </div>
            {expenses.length === 0 ? (
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs hover:bg-[#004f7a] transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Log First Expense</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-[#f1f5f9] text-[#006194] text-xs font-bold hover:bg-[#e2e8f0] transition-colors inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((tx) => {
              const isMe = tx.payerId === 'alex' || tx.payerId === currentUser?.id || tx.payerId === 'usr-abhijeet';
              const iconName =
                tx.category === 'food'
                  ? 'restaurant'
                  : tx.category === 'transport'
                  ? 'train'
                  : tx.category === 'activities'
                  ? 'attractions'
                  : 'hotel';

              const iconBg =
                tx.category === 'food'
                  ? 'bg-[#e0f2fe] text-[#006194]'
                  : tx.category === 'transport'
                  ? 'bg-[#fef3c7] text-[#a36700]'
                  : 'bg-[#d1fae5] text-[#006c49]';

              return (
                <article
                  key={tx.id}
                  onClick={() => onOpenExpenseDetails(tx.id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white shadow-xs active:bg-[#f2f3ff] transition-colors border border-[#e2e8f0]/60 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-xs font-bold text-[#131b2e] truncate group-hover:text-[#006194] transition-colors">
                        {tx.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[#64748b] text-[10px] flex-wrap">
                        <span>{tx.date ? tx.date.split(',')[0] : 'Today'}</span>
                        <span>•</span>
                        <span className={isMe ? 'font-bold text-[#006194]' : 'text-[#3f4850]'}>
                          {isMe ? 'Paid by You' : `Paid by ${tx.payerName ? tx.payerName.split(' ')[0] : 'Companion'}`}
                        </span>
                        <span>•</span>
                        <span className="bg-[#eaedff] px-1.5 py-0.5 rounded text-[9px] text-[#3f4850] font-medium">
                          {tx.splitDetails || 'Split Equally'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="text-xs font-bold text-[#131b2e]">
                      {formatAmount(tx.amountUsd)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isMe ? 'text-[#006c49]' : 'text-[#f43f5e]'
                      }`}
                    >
                      {tx.isPersonal
                        ? `Personal (100%)`
                        : isMe
                        ? `Your share: ${formatAmount(tx.personalShareUsd)}`
                        : `Your share: ${formatAmount(tx.personalShareUsd)}`}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
