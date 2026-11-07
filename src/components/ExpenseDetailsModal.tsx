import React, { useState } from 'react';
import { APP_ASSETS, INITIAL_MEMBERS } from '../data/mockData';
import { Expense } from '../types';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  expenseId?: string;
  expenses: Expense[];
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function ExpenseDetailsModal({
  isOpen,
  expenseId,
  expenses,
  onClose,
  onShowToast,
}: ExpenseDetailsModalProps) {
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [remindedMembers, setRemindedMembers] = useState<{ [key: string]: boolean }>({});

  if (!isOpen) return null;

  const expense =
    expenses.find((e) => e.id === expenseId) ||
    expenses[0] || {
      id: 'EXP-8824-MH',
      title: 'MTDC Hill Resort Dining',
      category: 'food',
      categoryLabel: 'Food & Dining',
      amountUsd: 3200.0,
      date: 'Nov 16, 2024',
      time: '19:45 IST',
      payerId: 'alex',
      payerName: 'Alex Rivera (You)',
      splitType: 'equal',
      splitDetails: 'Split 4 ways (Equal)',
      personalShareUsd: 800.0,
      linkedStop: 'Sahyadri Foothills Resort Dining',
      receiptImage: APP_ASSETS.receiptKanji,
      ocrVerified: true,
      notes: 'Maharashtrian thali dinner + Solkadhi for group.',
    };

  const handleRemind = (id: string, name: string) => {
    setRemindedMembers({ ...remindedMembers, [id]: true });
    onShowToast(`Reminder sent to ${name} for ₹800.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]/60">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#e2e7ff] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#131b2e]">{expense.id}</span>
            <span className="text-[10px] text-[#64748b]">
              Maharashtra Tour • Food &amp; Dining
            </span>
          </div>
          <button
            onClick={() => onShowToast('Expense details link copied!')}
            className="w-9 h-9 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#e2e7ff] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* Main Hero Expense Banner */}
          <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#e2e8f0]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#006194] text-[10px] font-bold uppercase tracking-wider">
                Food &amp; Dining
              </span>
              <span className="text-[11px] text-[#006c49] font-bold bg-[#d1fae5] px-2 py-0.5 rounded-full">
                OCR Verified
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#131b2e]">
                  {expense.title}
                </h1>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Local Currency: Indian Rupees (INR)
                </p>
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#006194]">
                ₹{expense.amountUsd.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#dae2fd]/60 text-xs">
              <div>
                <span className="text-[10px] text-[#64748b] block">Paid By</span>
                <span className="font-bold text-[#131b2e]">{expense.payerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] block">Date &amp; Time</span>
                <span className="font-bold text-[#131b2e]">
                  {expense.date} • {expense.time || '19:45 IST'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Itinerary Stop */}
          {expense.linkedStop && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_today
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748b]">
                    Linked Itinerary Stop
                  </span>
                  <h4 className="text-xs font-bold text-[#131b2e]">{expense.linkedStop}</h4>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#006194]">Stop #4</span>
            </div>
          )}

          {/* Attached Japanese Receipt with Kanji OCR */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194] text-[18px]">
                  receipt
                </span>
                <span className="text-xs font-bold text-[#131b2e]">Attached Receipt</span>
              </div>
              <button
                onClick={() => setShowFullReceipt(!showFullReceipt)}
                className="text-[11px] font-bold text-[#006194] hover:underline"
                type="button"
              >
                {showFullReceipt ? 'Collapse' : 'Enlarge'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div
                onClick={() => setShowFullReceipt(!showFullReceipt)}
                className="w-16 h-20 rounded-xl overflow-hidden cursor-pointer shadow-xs border border-[#dae2fd] shrink-0"
              >
                <img
                  src={APP_ASSETS.receiptKanji}
                  alt="Gion Kaiseki Receipt"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col text-xs min-w-0">
                <span className="font-bold text-[#131b2e] truncate">Receipt_MTDC_Nov16.jpg</span>
                <span className="text-[11px] text-[#64748b]">4 items itemized • GST included</span>
                <span className="text-[11px] text-[#006c49] font-semibold mt-1">
                  ✓ OCR Match ₹3,200 (Verified)
                </span>
              </div>
            </div>

            {showFullReceipt && (
              <div className="rounded-xl overflow-hidden border border-[#dae2fd] mt-2">
                <img
                  src={APP_ASSETS.receiptKanji}
                  alt="Maharashtra Dining Receipt Full"
                  className="w-full max-h-72 object-contain bg-[#131b2e]/5"
                />
              </div>
            )}
          </div>

          {/* Split Breakdown Details */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#131b2e]">Split Breakdown</span>
                <p className="text-[10px] text-[#64748b]">Split Equally (4 Ways)</p>
              </div>
              <span className="text-xs font-bold text-[#006c49]">+₹2,400 Reimbursement</span>
            </div>

            <div className="space-y-2">
              {INITIAL_MEMBERS.map((m) => {
                const isAlex = m.id === 'alex';
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#f2f3ff] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </div>
                      <span className="font-bold text-[#131b2e]">{m.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#131b2e]">₹800</span>
                      {isAlex ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#006c49] text-[10px] font-bold">
                          Paid ₹3,200
                        </span>
                      ) : remindedMembers[m.id] ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#006c49] text-[10px] font-bold">
                          Reminded
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemind(m.id, m.name)}
                          className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#006194] text-[10px] font-bold hover:bg-[#006194] hover:text-white transition-colors"
                          type="button"
                        >
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit History & Audit Trail */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] space-y-2.5 shadow-xs">
            <span className="text-xs font-bold text-[#131b2e]">Activity History (Audit Trail)</span>
            <div className="space-y-2 text-[11px] text-[#475569]">
              <div className="flex items-center justify-between">
                <span>• Alex updated split ratio to 4 equal portions</span>
                <span className="text-[#64748b]">Nov 16, 21:10</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• OCR scan attached Japanese Kanji receipt</span>
                <span className="text-[#64748b]">Nov 16, 19:46</span>
              </div>
              <div className="flex items-center justify-between">
                <span>• Expense created by Alex Rivera</span>
                <span className="text-[#64748b]">Nov 16, 19:45</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-[#e2e8f0]/60 flex items-center gap-2">
          <button
            onClick={() => onShowToast('Receipt saved to trip ledger.')}
            className="flex-1 py-2.5 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            type="button"
          >
            Done
          </button>
          <button
            onClick={() => {
              onShowToast('Deleted expense.');
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#ffe4e6] text-[#f43f5e] text-xs font-bold hover:bg-[#fecdd3] active:scale-95 transition-all"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
