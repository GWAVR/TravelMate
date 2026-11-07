import { useState } from 'react';

interface PackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function PackingModal({ isOpen, onClose, onShowToast }: PackingModalProps) {
  const [items, setItems] = useState([
    { id: 1, label: 'Lightweight Packable Rain Jacket (Sunday 80% rain)', checked: true, category: 'Weather Essential' },
    { id: 2, label: 'Comfortable Walking Shoes / Sneakers (14k+ steps)', checked: true, category: 'Footwear' },
    { id: 3, label: 'Coin Purse for Shrine Donations (100¥ & 5¥ coins)', checked: true, category: 'Temples' },
    { id: 4, label: 'ICOCA / Suica Contactless Transit Card', checked: false, category: 'Transit' },
    { id: 5, label: 'Portable Power Bank (Anker 10,000mAh)', checked: false, category: 'Electronics' },
    { id: 6, label: 'Compact Folding Travel Umbrella', checked: false, category: 'Weather Essential' },
    { id: 7, label: 'Universal Outlet Adapter (Type A/Japan)', checked: true, category: 'Electronics' },
  ]);

  if (!isOpen) return null;

  const toggleItem = (id: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006194] text-[22px]">backpack</span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">AI Packing Checklist</h2>
              <span className="text-[10px] text-[#006c49] font-semibold">
                Kyoto Autumn Weather Dynamic Tips
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#131b2e] flex items-center justify-center hover:bg-[#e2e7ff]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
          <div className="p-3 rounded-2xl bg-[#e0f2fe] text-[#006194] text-xs flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] shrink-0">auto_awesome</span>
            <span>
              Synced with Kyoto 4-day forecast (15°C – 20°C, rainy Sunday). Pack moisture-wicking layers!
            </span>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0]/60 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      item.checked ? 'bg-[#006194] text-white' : 'border border-[#64748b]'
                    }`}
                  >
                    {item.checked && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-semibold ${
                        item.checked ? 'line-through text-[#64748b]' : 'text-[#131b2e]'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] text-[#64748b]">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0]/60 flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            {items.filter((i) => i.checked).length} of {items.length} packed
          </span>
          <button
            onClick={() => {
              onShowToast('Checklist saved!');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export function EmergencyModal({ isOpen, onClose, onShowToast }: EmergencyModalProps) {
  if (!isOpen) return null;

  const contacts = [
    { name: 'Japan Police (Incidents)', number: '110', note: 'Emergency dispatch in Japan' },
    { name: 'Ambulance & Fire Department', number: '119', note: 'Medical emergency & rescue' },
    { name: 'Japan Helpline (English 24/7)', number: '0570-000-911', note: 'Toll-free nationwide support' },
    { name: 'US Embassy Tokyo / Consular', number: '+81-3-3224-5000', note: 'Passport loss & citizen services' },
    { name: 'Kyoto Tourist Info Center', number: '+81-75-343-0548', note: 'Kyoto Station 2F (Multilingual)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]/60 bg-[#fff1f2]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#f43f5e] text-[22px]">
              emergency
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">Emergency &amp; Support</h2>
              <span className="text-[10px] text-[#f43f5e] font-semibold">Kyoto &amp; Japan 24/7 Contacts</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-[#131b2e] flex items-center justify-center shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
          <div className="p-3 rounded-2xl bg-[#ffe4e6] text-[#f43f5e] text-xs">
            In Japan, dialing <strong>110</strong> connects to the Police and <strong>119</strong> connects to Ambulance/Fire. No area code needed from any phone.
          </div>

          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0]/60"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#131b2e]">{c.name}</h4>
                  <span className="text-[10px] text-[#64748b]">{c.note}</span>
                </div>
                <button
                  onClick={() => onShowToast(`Dialing ${c.number}...`)}
                  className="px-3 py-1.5 rounded-lg bg-[#006194] text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  <span>{c.number}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#e2e8f0]/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#131b2e] text-white text-xs font-bold"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
