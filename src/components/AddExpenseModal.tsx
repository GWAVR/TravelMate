import React, { useState, useEffect } from 'react';
import { APP_ASSETS, INITIAL_MEMBERS } from '../data/mockData';
import { Expense, Member, UserProfile } from '../types';
import { getCurrencyInfo, convertAmount } from '../utils/currencies';
import { CurrencyPickerModal } from './CurrencyPickerModal';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Expense) => void;
  onShowToast: (msg: string) => void;
  members?: Member[];
  currentUser?: UserProfile;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  onSaveExpense,
  onShowToast,
  members,
  currentUser,
}: AddExpenseModalProps) {
  const crew = members && members.length > 0 ? members : INITIAL_MEMBERS;
  const defaultPayerId = currentUser?.id || crew[0]?.id || 'usr-abhijeet';

  const [currency, setCurrency] = useState<string>('INR');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [amount, setAmount] = useState('1500');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'food' | 'transport' | 'stays' | 'activities' | 'shopping' | 'other'>('food');
  const [payerId, setPayerId] = useState(defaultPayerId);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom' | 'percent'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => crew.map((m) => m.id));
  const [linkItinerary, setLinkItinerary] = useState(true);
  const [ocrAttached, setOcrAttached] = useState(false);
  const [notes, setNotes] = useState('');

  // Keep member IDs synchronized when modal opens or crew updates
  useEffect(() => {
    if (isOpen) {
      if (!crew.some((m) => m.id === payerId)) {
        setPayerId(crew[0]?.id || defaultPayerId);
      }
      setSelectedMembers(crew.map((m) => m.id));
    }
  }, [isOpen, crew, defaultPayerId]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const numMembers = selectedMembers.length || 1;
  const currencyInfo = getCurrencyInfo(currency);
  const perPersonAmountLocal = (numAmount / numMembers).toFixed(
    ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2
  );

  const categories = [
    { id: 'food', label: 'Dining', icon: 'restaurant' },
    { id: 'transport', label: 'Transit', icon: 'train' },
    { id: 'stays', label: 'Stay', icon: 'hotel' },
    { id: 'activities', label: 'Activity', icon: 'attractions' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping_bag' },
    { id: 'other', label: 'Other', icon: 'more_horiz' },
  ];

  const handleToggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length === 1) return; // keep at least 1
      setSelectedMembers(selectedMembers.filter((m) => m !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSave = (isPersonal: boolean = false) => {
    if (!amount || numAmount <= 0) {
      onShowToast('Please enter an amount.');
      return;
    }

    const payer = crew.find((m) => m.id === payerId);
    const isPayerMe = payerId === currentUser?.id || payerId === crew[0]?.id || payerId === 'usr-abhijeet';
    const isMeInSplit = selectedMembers.some((id) => id === currentUser?.id || id === crew[0]?.id || id === 'usr-abhijeet');

    const newExpense: Expense = {
      id: `EXP-${Math.floor(1000 + Math.random() * 9000)}-${currency}`,
      title: title.trim() || 'Travel Expense',
      category,
      categoryLabel: categories.find((c) => c.id === category)?.label || 'General',
      amountUsd: numAmount, // Standard base unit in Rupees
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: 'Just now',
      payerId,
      payerName: payer ? (isPayerMe ? `${payer.name} (You)` : payer.name) : (currentUser?.name || 'You'),
      splitType: isPersonal ? 'custom' : splitMode,
      splitDetails: isPersonal
        ? 'Personal Expense'
        : `Split ${numMembers} ways (${currencyInfo.symbol}${perPersonAmountLocal} ea)`,
      personalShareUsd: isPersonal
        ? numAmount
        : isMeInSplit
        ? parseFloat((numAmount / numMembers).toFixed(2))
        : 0,
      isPersonal,
      linkedStop: linkItinerary ? 'Maharashtra Sightseeing & Stops' : undefined,
      receiptImage: ocrAttached ? APP_ASSETS.receiptKanji : undefined,
      ocrVerified: ocrAttached,
      notes: notes.trim() || undefined,
    };

    onSaveExpense(newExpense);
    onClose();
    onShowToast(`Saved "${newExpense.title}" (₹${numAmount.toLocaleString('en-IN')}) to expenses!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]/60">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#e2e8f0] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-sm font-bold text-[#131b2e]">Add Expense</h2>
            <span className="text-[10px] text-[#64748b]">
              Maharashtra Tour • Indian Rupees (₹)
            </span>
          </div>
          <button
            onClick={() => handleSave(false)}
            className="px-3.5 py-1.5 rounded-full bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            type="button"
          >
            Save
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Amount and Currency Card */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#f2f3ff] border border-[#e2e8f0]/60">
            {/* Currency Switcher */}
            <div className="flex items-center gap-1 p-0.5 rounded-full bg-white shadow-xs mb-2 flex-wrap justify-center">
              {(['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const).map((currCode) => {
                const info = getCurrencyInfo(currCode);
                const isSelected = currency === currCode;
                return (
                  <button
                    key={currCode}
                    onClick={() => setCurrency(currCode)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected ? 'bg-[#006194] text-white shadow-xs' : 'text-[#64748b] hover:text-[#131b2e]'
                    }`}
                    type="button"
                  >
                    {currCode} ({info.symbol})
                  </button>
                );
              })}
              <button
                onClick={() => setIsPickerOpen(true)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-0.5 ${
                  !['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(currency)
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'text-[#006194] hover:bg-[#e0f2fe]'
                }`}
                type="button"
              >
                <span>
                  {!['INR', 'USD', 'EUR', 'GBP', 'JPY'].includes(currency)
                    ? `${currency} (${currencyInfo.symbol})`
                    : 'More ▾'}
                </span>
              </button>
            </div>

            {/* Big Amount Input */}
            <div className="flex items-center justify-center gap-1 w-full">
              <span className="text-3xl font-extrabold text-[#006194]">
                {currencyInfo.symbol}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-3xl font-extrabold text-[#131b2e] bg-transparent text-center outline-none max-w-[200px]"
                autoFocus
              />
            </div>
            <span className="text-[11px] text-[#64748b] mt-1 text-center">
              Total: ₹{Number(amount || 0).toLocaleString('en-IN')} INR • Split across {selectedMembers.length} travelers
            </span>
          </div>

          {/* Title & Description Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#131b2e]">Expense Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MTDC Resort Stay, Misal Pav Breakfast, Sinhagad Entry..."
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#131b2e] placeholder:text-[#64748b] outline-none focus:ring-2 focus:ring-[#006194]/20"
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#131b2e]">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id as any)}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === c.id
                      ? 'bg-[#006194] text-white border-[#006194]'
                      : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f2f3ff]'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Paid By Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#131b2e]">Paid By</label>
            <div className="grid grid-cols-2 gap-2">
              {crew.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayerId(m.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    payerId === m.id
                      ? 'bg-[#e0f2fe] border-[#006194] text-[#006194]'
                      : 'bg-white border-[#e2e8f0] text-[#131b2e] hover:bg-[#f2f3ff]'
                  }`}
                  type="button"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-[#006194]"
                    style={m.color && m.color.startsWith('#') ? { backgroundColor: m.color } : undefined}
                  >
                    {m.initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold truncate">{m.name}</span>
                    {m.phone && <span className="text-[10px] text-[#64748b] truncate">{m.phone}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Split Breakdown */}
          <div className="p-3.5 rounded-2xl bg-[#f2f3ff] border border-[#e2e8f0]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131b2e]">Split Breakdown</span>
              <div className="flex items-center gap-1 text-[11px] text-[#006c49] font-bold bg-[#d1fae5] px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">check</span>
                <span>₹{perPersonAmountLocal} / person</span>
              </div>
            </div>

            {/* Split Mode Tabs */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#eaedff]">
              <button
                onClick={() => setSplitMode('equal')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === 'equal' ? 'bg-white text-[#006194] shadow-xs' : 'text-[#64748b]'
                }`}
                type="button"
              >
                Equally
              </button>
              <button
                onClick={() => setSplitMode('custom')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === 'custom' ? 'bg-white text-[#006194] shadow-xs' : 'text-[#64748b]'
                }`}
                type="button"
              >
                Custom ₹
              </button>
              <button
                onClick={() => setSplitMode('percent')}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === 'percent' ? 'bg-white text-[#006194] shadow-xs' : 'text-[#64748b]'
                }`}
                type="button"
              >
                % Share
              </button>
            </div>

            {/* Members checkboxes */}
            <div className="space-y-1.5">
              {crew.map((m) => {
                const isSelected = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMember(m.id)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e2e8f0]/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#006194] text-white' : 'border border-[#64748b]'
                        }`}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#131b2e]">{m.name}</span>
                        {m.phone && <span className="text-[10px] text-[#64748b]">({m.phone})</span>}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#006194]">
                      {isSelected ? `${currencyInfo.symbol}${perPersonAmountLocal}` : `${currencyInfo.symbol}0`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt OCR Scan & Itinerary Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006194] text-[20px]">
                  document_scanner
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">Scan Japanese Receipt</span>
                  <span className="text-[10px] text-[#64748b]">OCR Itemizes kanji automatically</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setOcrAttached(!ocrAttached);
                  if (!ocrAttached) {
                    setTitle('Gion Kaiseki Dinner');
                    setAmount('160.00');
                    setCategory('food');
                    onShowToast('Kanji Receipt scanned! Extracted 4 items & 10% consumption tax.');
                  } else {
                    onShowToast('Removed attached receipt.');
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  ocrAttached ? 'bg-[#d1fae5] text-[#006c49]' : 'bg-[#e0f2fe] text-[#006194]'
                }`}
                type="button"
              >
                {ocrAttached ? 'Attached ✓' : 'Scan Demo'}
              </button>
            </div>

            {/* If receipt attached, show thumbnail preview */}
            {ocrAttached && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0]/60">
                <img
                  src={APP_ASSETS.receiptKanji}
                  alt="Scanned Kanji Receipt"
                  className="w-12 h-14 object-cover rounded-lg border border-white"
                />
                <div className="flex flex-col text-[11px] min-w-0 flex-1">
                  <span className="font-bold text-[#131b2e] truncate">
                    Receipt_Gion_Nov16.jpg
                  </span>
                  <span className="text-[#006c49] font-medium">OCR Verified 4 items • ¥24,384</span>
                </div>
              </div>
            )}

            {/* Link to Stop 4 toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e2e8f0]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#006194] text-[20px]">
                  link
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e]">Link to Itinerary Stop</span>
                  <span className="text-[10px] text-[#64748b]">Gion Traditional Kaiseki Dining</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={linkItinerary}
                onChange={(e) => setLinkItinerary(e.target.checked)}
                className="w-4 h-4 rounded text-[#006194]"
              />
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shared notes (e.g. Maya had the extra matcha dessert)..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-white border border-[#e2e8f0] outline-none resize-none placeholder:text-[#64748b] focus:ring-2 focus:ring-[#006194]/20"
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-[#e2e8f0]/60 flex items-center gap-2">
          <button
            onClick={() => handleSave(true)}
            className="flex-1 py-3 rounded-xl bg-[#e2e7ff] text-[#131b2e] text-xs font-bold hover:bg-[#dae2fd] active:scale-95 transition-all"
            type="button"
          >
            Save as Personal
          </button>
          <button
            onClick={() => handleSave(false)}
            className="flex-1 py-3 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-md hover:bg-[#007bb9] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>Save &amp; Split Expense</span>
          </button>
        </div>
      </div>

      {/* Currency Selector Modal */}
      <CurrencyPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectCurrency={(code) => {
          setCurrency(code);
          onShowToast(`Selected ${code} (${getCurrencyInfo(code).name}) for expense`);
        }}
        selectedCode={currency}
        title="Select Expense Currency"
      />
    </div>
  );
}
