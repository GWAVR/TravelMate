import { useState } from 'react';
import { ItineraryActivity } from '../types';

interface AddActivityModalProps {
  isOpen: boolean;
  selectedDay: number;
  onClose: () => void;
  onSave: (activity: ItineraryActivity) => void;
  onShowToast: (msg: string) => void;
}

export function AddActivityModal({
  isOpen,
  selectedDay,
  onClose,
  onSave,
  onShowToast,
}: AddActivityModalProps) {
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState('15:00 - 16:30');
  const [category, setCategory] = useState('Sightseeing • Culture');
  const [location, setLocation] = useState('Kyoto, Japan');
  const [cost, setCost] = useState('¥1,500');
  const [splitInfo, setSplitInfo] = useState('Split 4 ways');
  const [day, setDay] = useState(selectedDay);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please enter an activity name');
      return;
    }

    const newActivity: ItineraryActivity = {
      id: `act-${Date.now()}`,
      day,
      timeSlot: timeSlot.trim() || 'Flexible Time',
      title: title.trim(),
      status: 'upcoming',
      category: category.trim() || 'Activity',
      location: location.trim() || 'Kyoto',
      cost: cost.trim() || 'Free',
      splitInfo: splitInfo.trim() || undefined,
    };

    onSave(newActivity);
    onShowToast(`✓ Added "${newActivity.title}" to Day ${day} Itinerary (Saved to Local Storage)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        <div className="px-5 py-4 bg-gradient-to-r from-[#006194] to-[#004f7a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
            <h3 className="font-bold text-sm">Add Itinerary Stop</h3>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-[#131b2e]">
          <div>
            <label className="block text-[11px] font-bold text-[#64748b] mb-1">
              Activity / Destination Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nijo Castle & Ninomaru Palace"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#64748b] mb-1">Trip Day</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd5e1] text-xs bg-white focus:ring-2 focus:ring-[#006194] focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <option key={d} value={d}>
                    Day {d} (Nov {11 + d})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#64748b] mb-1">Time Window</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="10:00 - 12:00"
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#64748b] mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Sightseeing • Culture"
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#64748b] mb-1">Est. Cost</label>
              <input
                type="text"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Free or $15.00"
                className="w-full px-3 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#64748b] mb-1">Location / Address</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Nakagyo Ward, Kyoto"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#64748b] mb-1">Expense Split Note</label>
            <input
              type="text"
              value={splitInfo}
              onChange={(e) => setSplitInfo(e.target.value)}
              placeholder="e.g. Split 4 ways ($5.00 ea)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] text-xs focus:ring-2 focus:ring-[#006194] focus:outline-none"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] text-[11px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Automatically cached in LocalStorage for full offline access.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006194] text-white hover:bg-[#004f7a] shadow-xs active:scale-95 transition-transform"
            >
              Save Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
