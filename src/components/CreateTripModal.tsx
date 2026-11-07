import React, { useState } from 'react';
import { TripDestination } from '../types';
import { APP_ASSETS } from '../data/mockData';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (newTrip: TripDestination) => void;
  onShowToast: (msg: string) => void;
  prefillDestination?: {
    name: string;
    location: string;
    country: string;
    image: string;
    tagline?: string;
  };
}

const PRESET_COVERS = [
  {
    id: 'sahyadri',
    label: 'Sahyadri Hills & Forts',
    url: 'https://images.unsplash.com/photo-1626014303757-6466336e3532?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'konkan',
    label: 'Konkan Coastline',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'caves',
    label: 'Ajanta & Ellora Caves',
    url: 'https://images.unsplash.com/photo-1600100397608-f010f443a99f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'hills',
    label: 'Mahabaleshwar & Panchgani',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'mumbai',
    label: 'Mumbai Gateway & Skyline',
    url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tadoba',
    label: 'Tadoba Forest Reserve',
    url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
  },
];

export function CreateTripModal({
  isOpen,
  onClose,
  onCreateTrip,
  onShowToast,
  prefillDestination,
}: CreateTripModalProps) {
  const [name, setName] = useState(prefillDestination?.name || '');
  const [shortName, setShortName] = useState(prefillDestination?.name || '');
  const [location, setLocation] = useState(prefillDestination?.location || '');
  const [country, setCountry] = useState(prefillDestination?.country || 'Maharashtra, India');
  const [dates, setDates] = useState('Nov 15 – Nov 22, 2026');
  const [daysTotal, setDaysTotal] = useState(7);
  const [totalBudgetUsd, setTotalBudgetUsd] = useState(45000);
  const [tagline, setTagline] = useState(prefillDestination?.tagline || 'Exciting Maharashtra journey & memorable discoveries');
  const [selectedCover, setSelectedCover] = useState(prefillDestination?.image || PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [paxCount, setPaxCount] = useState(2);

  // Sync when prefill changes
  React.useEffect(() => {
    if (prefillDestination) {
      setName(prefillDestination.name);
      setShortName(prefillDestination.name.split(' ')[0] || prefillDestination.name);
      setLocation(prefillDestination.location);
      setCountry(prefillDestination.country);
      if (prefillDestination.image) setSelectedCover(prefillDestination.image);
      if (prefillDestination.tagline) setTagline(prefillDestination.tagline);
    }
  }, [prefillDestination]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('Please enter a trip name.');
      return;
    }
    if (!location.trim()) {
      onShowToast('Please enter trip location or destination.');
      return;
    }

    const tripId = `trip-${Date.now()}`;
    const finalCover = customCoverUrl.trim() || selectedCover;

    const newTrip: TripDestination = {
      id: tripId,
      name: name.trim(),
      shortName: shortName.trim() || name.trim(),
      location: location.trim(),
      country: country.trim() || location.trim().split(',').pop()?.trim() || 'Worldwide',
      dates: dates.trim(),
      daysTotal: Number(daysTotal) || 7,
      currentDay: 1,
      statusBadge: 'Upcoming • Freshly Planned',
      statusColor: 'bg-[#d1fae5] text-[#006c49]',
      daysLeftText: 'Starts soon',
      weatherTemp: '24°C',
      weatherCondition: 'Clear & Sunny',
      weatherRain: '0% rain',
      weatherIcon: 'wb_sunny',
      backgroundImage: finalCover,
      imageAlt: `Inspiring travel scenic cover for ${name}`,
      tagline: tagline.trim(),
      totalBudgetUsd: Number(totalBudgetUsd) || 45000,
      spentUsd: 0,
      todayScheduleTitle: "Day 1 Schedule",
      todayScheduleSub: `Day 1 • Arrival & settling in ${shortName.trim() || name.trim()}`,
      paxCount: Number(paxCount) || 1,
    };

    onCreateTrip(newTrip);
    onShowToast(`🎉 Created trip: ${newTrip.name}!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg my-auto bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#faf8ff] to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#006194] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">add_location_alt</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#131b2e]">Plan a New Trip</h2>
              <p className="text-[11px] text-[#64748b]">Create your customized itinerary &amp; budget ledger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f1f5f9] text-[#64748b] hover:text-[#131b2e] hover:bg-[#e2e8f0] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Trip Name & Short Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Trip Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!shortName || shortName === name) {
                    setShortName(e.target.value);
                  }
                }}
                placeholder="e.g. Goa Beach Vacation"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Short Name / Label
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. Goa Trip"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Location & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Destination Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-[#94a3b8] text-[16px]">
                  location_on
                </span>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. South Goa, India"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Dates & Duration & Travelers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Trip Dates
              </label>
              <input
                type="text"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="Nov 15 – Nov 22, 2026"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={daysTotal}
                onChange={(e) => setDaysTotal(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Travelers (Pax)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={paxCount}
                onChange={(e) => setPaxCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Budget Limit & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Total Budget (₹ INR)
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-[#006194] text-[16px]">
                  currency_rupee
                </span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={totalBudgetUsd}
                  onChange={(e) => setTotalBudgetUsd(Number(e.target.value))}
                  placeholder="45000"
                  className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#131b2e] block mb-1">
                Tagline / Vibe
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Sahyadri forts & coastal seafood trails"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Cover Image Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#131b2e] block">
              Trip Cover Image
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COVERS.map((preset) => {
                const isSelected = selectedCover === preset.url && !customCoverUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedCover(preset.url);
                      setCustomCoverUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all group ${
                      isSelected
                        ? 'border-[#006194] ring-2 ring-[#006194]/30 scale-102'
                        : 'border-transparent hover:opacity-90 opacity-70'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white truncate drop-shadow-xs">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#006194] text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[11px]">check</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Image URL input */}
            <div className="pt-1">
              <input
                type="url"
                value={customCoverUrl}
                onChange={(e) => setCustomCoverUrl(e.target.value)}
                placeholder="Or paste custom image URL (https://...)"
                className="w-full px-3 py-1.5 text-xs bg-[#f8fafc] text-[#131b2e] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-[#475569] font-bold text-xs hover:bg-[#e2e8f0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-md hover:bg-[#004d77] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              <span>Launch Trip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
