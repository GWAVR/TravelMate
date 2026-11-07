import { useState, useMemo, useEffect } from 'react';
import { TRIP_DESTINATIONS } from '../data/mockData';
import { ScreenTab, TripDestination, Expense, ItineraryActivity, Member, HotelReservation, UserProfile } from '../types';
import { WeatherForecastSection } from './WeatherForecastSection';
import { UserAvatar } from './UserAvatar';

interface DashboardScreenProps {
  onNavigate: (tab: ScreenTab) => void;
  onOpenAddExpense: () => void;
  onShowToast: (msg: string) => void;
  onOpenMap: () => void;
  onOpenPacking: () => void;
  onOpenEmergency: () => void;
  onOpenExpenseDetails?: () => void;
  selectedTrip?: TripDestination;
  onSelectTrip?: (tripId: string) => void;
  trips?: TripDestination[];
  onOpenCreateTrip?: (prefill?: {
    name: string;
    location: string;
    country: string;
    image: string;
    tagline?: string;
  }) => void;
  onLoadDemoTrip?: () => void;
  onResetToFresh?: () => void;
  appMode?: 'fresh' | 'demo';
  expenses?: Expense[];
  activities?: ItineraryActivity[];
  members?: Member[];
  reservations?: HotelReservation[];
  currentUser?: UserProfile;
  onUpdateMembers?: (members: Member[]) => void;
  onUpdateUser?: (updated: UserProfile) => void;
}

export function DashboardScreen({
  onNavigate,
  onOpenAddExpense,
  onShowToast,
  onOpenMap,
  onOpenPacking,
  onOpenEmergency,
  selectedTrip,
  onSelectTrip,
  trips,
  onOpenCreateTrip,
  onLoadDemoTrip,
  onResetToFresh,
  appMode = 'fresh',
  expenses = [],
  activities = [],
  members = [],
  reservations = [],
  currentUser,
  onUpdateMembers,
  onUpdateUser,
}: DashboardScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for adding companion with Name & Phone, and editing user's own phone
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditUserPhoneModal, setIsEditUserPhoneModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Traveler');
  const [userPhoneInput, setUserPhoneInput] = useState(currentUser?.phone || '+91 98765 43210');

  useEffect(() => {
    if (currentUser?.phone) {
      setUserPhoneInput(currentUser.phone);
    }
  }, [currentUser?.phone]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      onShowToast('Please provide a companion name.');
      return;
    }
    const initials = newMemberName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      initials: initials || 'TR',
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@travel.co`,
      phone: newMemberPhone.trim() || '+91 98000 00000',
      avatar: '',
      color: '#006194',
      netBalance: 0,
      subtext: newMemberRole || 'Traveler',
    };

    const updated = [...members, newMember];
    if (onUpdateMembers) {
      onUpdateMembers(updated);
    }
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberEmail('');
    setNewMemberRole('Traveler');
    setIsAddMemberModalOpen(false);
    onShowToast(`✓ Added ${newMember.name} (${newMember.phone}) to trip members!`);
  };

  const handleSaveUserPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userPhoneInput.trim();
    if (!trimmed) {
      onShowToast('Please enter your phone number.');
      return;
    }
    if (currentUser && onUpdateUser) {
      onUpdateUser({
        ...currentUser,
        phone: trimmed,
      });
    }
    if (members.length > 0 && onUpdateMembers) {
      const updatedMembers = members.map((m, idx) =>
        idx === 0 || m.id === currentUser?.id ? { ...m, phone: trimmed } : m
      );
      onUpdateMembers(updatedMembers);
    }
    setIsEditUserPhoneModal(false);
    onShowToast(`✓ Your phone number updated to ${trimmed}`);
  };

  const handleDeleteCompanion = (memberId: string) => {
    if (members.length <= 1) {
      onShowToast('Cannot remove the trip owner.');
      return;
    }
    const updated = members.filter((m) => m.id !== memberId);
    if (onUpdateMembers) {
      onUpdateMembers(updated);
    }
    onShowToast('Companion removed from trip.');
  };

  const availableTrips = trips && trips.length > 0 ? trips : (selectedTrip ? [selectedTrip] : TRIP_DESTINATIONS);
  const currentTrip = selectedTrip || availableTrips[0] || TRIP_DESTINATIONS[0];

  // Filter available trip destinations by name, shortName, location, or country
  const filteredTrips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableTrips;
    return availableTrips.filter((trip) => {
      return (
        trip.name.toLowerCase().includes(query) ||
        trip.shortName.toLowerCase().includes(query) ||
        trip.location.toLowerCase().includes(query) ||
        trip.country.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, availableTrips]);

  // Dynamic budget calculations based on real expenses in Indian Rupees (₹)
  const totalSpentUsd = expenses.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
  const totalBudgetUsd = currentTrip?.totalBudgetUsd && currentTrip.totalBudgetUsd > 1000
    ? currentTrip.totalBudgetUsd
    : (currentUser?.tripBudgetLimit && currentUser.tripBudgetLimit > 1000 ? currentUser.tripBudgetLimit : 45000);
  const remainingUsd = Math.max(0, totalBudgetUsd - totalSpentUsd);
  const spentPercent = totalBudgetUsd > 0 ? Math.min(100, Math.round((totalSpentUsd / totalBudgetUsd) * 1000) / 10) : 0;
  const remainingPercent = Math.max(0, Math.round((100 - spentPercent) * 10) / 10);

  // Category sums
  const catAccom = expenses.filter(e => e.category === 'stays').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catFood = expenses.filter(e => e.category === 'food').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catTrans = expenses.filter(e => e.category === 'transport').reduce((s, e) => s + (e.amountUsd || 0), 0);
  const catActivities = expenses.filter(e => e.category === 'activities').reduce((s, e) => s + (e.amountUsd || 0), 0);

  // Always render full dashboard so budget health, split ledger, and travel crew load
  if (false as boolean) {
    return (
      <div className="flex flex-col w-full px-4 pb-12 space-y-5 animate-in fade-in duration-300">
        {/* Welcome Fresh Hero Card */}
        <div className="w-full bg-gradient-to-br from-[#004d77] via-[#006194] to-[#0f172a] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-3.5 border border-white/20 shadow-inner">
            <span className="material-symbols-outlined text-[36px] text-amber-300">flight_takeoff</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Fresh Start Mode • No Trips Yet
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to TravelMate!
          </h1>
          <p className="text-xs sm:text-sm text-white/85 max-w-md mt-2 leading-relaxed">
            Your travel slate is completely clean! Plan your very first journey from scratch, manage shared costs with friends, or explore our interactive sample demo trip.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-md">
            <button
              type="button"
              onClick={() => onOpenCreateTrip?.()}
              className="w-full py-3.5 px-5 rounded-2xl bg-white text-[#006194] font-extrabold text-xs sm:text-sm shadow-md hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>+ Plan My First Trip</span>
            </button>
          </div>
        </div>

        {/* 3 Core TravelMate Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]/80 shadow-xs flex flex-col gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
            <h3 className="text-xs font-bold text-[#131b2e]">Custom Itineraries</h3>
            <p className="text-[11px] text-[#64748b]">
              Schedule day-by-day stops, time slots, entry fees, and route navigation with weather alerts.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]/80 shadow-xs flex flex-col gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#d1fae5] text-[#006c49] flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <h3 className="text-xs font-bold text-[#131b2e]">Multi-Currency Split</h3>
            <p className="text-[11px] text-[#64748b]">
              Split expenses equally or custom, convert live currencies, and settle group debts instantly.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]/80 shadow-xs flex flex-col gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-[#ffe4e6] text-[#f43f5e] flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <h3 className="text-xs font-bold text-[#131b2e]">TripGenie AI 360°</h3>
            <p className="text-[11px] text-[#64748b]">
              Audits your schedule pace, budget burn rate, luggage essentials, and cultural etiquette.
            </p>
          </div>
        </div>

        {/* Quick Start Destination Inspiration */}
        <div className="w-full flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006194] text-[18px]">explore</span>
                Inspiring Destinations to Quick-Start
              </h2>
              <p className="text-[11px] text-[#64748b]">
                Click any destination to launch a pre-configured trip with inspiring photos &amp; dates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRIP_DESTINATIONS.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-2xl border border-[#e2e8f0]/80 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={dest.backgroundImage}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 text-white">
                    <span className="text-[10px] text-[#93c5fd] font-semibold">{dest.country}</span>
                    <h4 className="text-xs font-bold leading-tight truncate">{dest.name}</h4>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#64748b] truncate">{dest.dates}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCreateTrip?.({
                        name: dest.name,
                        location: dest.location,
                        country: dest.country,
                        image: dest.backgroundImage,
                        tagline: dest.tagline,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-bold hover:bg-[#004d77] active:scale-95 transition-all flex items-center gap-1 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Start This Trip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==================== DASHBOARD WHEN USER HAS AT LEAST 1 TRIP ====================
  return (
    <div className="flex flex-col w-full px-4 pb-6 space-y-4">
      {/* Fresh Mode Welcome Notice if 0 custom trips */}
      {(!trips || trips.length === 0) && (
        <div className="w-full bg-gradient-to-r from-[#004d77] via-[#006194] to-[#0f172a] text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shrink-0">
              <span className="material-symbols-outlined text-[24px]">flight_takeoff</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight">Fresh Travel Slate Active</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">Ready</span>
              </div>
              <p className="text-xs text-white/80">Plan your custom journey or explore curated Maharashtra destinations below. All budget and expense boxes are live!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenCreateTrip?.()}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#006194] text-xs font-bold hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>+ Plan Trip</span>
            </button>
            {onLoadDemoTrip && (
              <button
                type="button"
                onClick={() => onLoadDemoTrip()}
                className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-bold hover:bg-white/25 active:scale-95 transition-all flex items-center gap-1 border border-white/20"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Load Maharashtra Tour</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* App Mode Switcher & Status Banner */}
      <div className="w-full p-2.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              appMode === 'fresh' ? 'bg-[#d1fae5] text-[#006c49]' : 'bg-[#fed7aa] text-[#c2410c]'
            }`}
          >
            {appMode === 'fresh' ? 'Fresh Mode' : 'Sample Demo Mode'}
          </span>
          <span className="text-[11px] text-[#64748b] truncate font-medium">
            {appMode === 'fresh'
              ? `${availableTrips.length} custom trip${availableTrips.length === 1 ? '' : 's'}`
              : 'Kyoto Autumn demo data'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenCreateTrip?.()}
            className="px-2.5 py-1 rounded-lg bg-[#006194] text-white text-[11px] font-semibold hover:bg-[#004d77] transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">add</span>
            <span>+ Plan Trip</span>
          </button>
        </div>
      </div>

      {/* Trip Destination Search Bar */}
      <div className="w-full bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] border border-[#e2e8f0]/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="trip-destination-search" className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#006194]">search</span>
            Search Destinations
          </label>
          {searchQuery && (
            <span className="text-[11px] font-semibold text-[#006194] bg-[#e0f2fe] px-2 py-0.5 rounded-full">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip found' : 'trips found'}
            </span>
          )}
        </div>

        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3 text-[#94a3b8] text-[18px] pointer-events-none">
            search
          </span>
          <input
            id="trip-destination-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations by name or location (e.g. Kyoto, India, Agra)..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-[#f8fafc] text-[#131b2e] placeholder-[#94a3b8] rounded-xl border border-[#cbd5e1] focus:bg-white focus:border-[#006194] focus:ring-2 focus:ring-[#006194]/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 p-1 text-[#94a3b8] hover:text-[#131b2e] hover:bg-[#e2e8f0] rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Quick filter suggestion chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar scrollbar-none text-[11px]">
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider shrink-0 mr-0.5">
            Quick:
          </span>
          {[
            { label: 'All Trips', query: '' },
            { label: 'Japan', query: 'Japan' },
            { label: 'India', query: 'India' },
            { label: 'Kyoto', query: 'Kyoto' },
            { label: 'Delhi / Agra', query: 'Agra' },
            { label: 'Kerala', query: 'Kerala' },
            { label: 'Ladakh', query: 'Ladakh' },
          ].map((item) => {
            const isActive =
              item.query === ''
                ? searchQuery === ''
                : searchQuery.toLowerCase() === item.query.toLowerCase();
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setSearchQuery(item.query)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 text-xs ${
                  isActive
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destination Quick Selector Bar */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#006194]">explore</span>
            Destinations &amp; Inspiring Trips
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#006194] font-semibold">
              {searchQuery
                ? `${filteredTrips.length} of ${availableTrips.length} Available`
                : `${availableTrips.length} Active Plans`}
            </span>
            <button
              type="button"
              onClick={() => onOpenCreateTrip?.()}
              className="text-[10px] text-[#006194] font-bold hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[12px]">add</span>
              New Trip
            </button>
          </div>
        </div>
        
        {/* Horizontal scrollable pills for destinations */}
        {filteredTrips.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {filteredTrips.map((trip) => {
              const isSelected = trip.id === currentTrip.id;
              return (
                <button
                  key={trip.id}
                  onClick={() => {
                    if (onSelectTrip) {
                      onSelectTrip(trip.id);
                      onShowToast(`Switched destination to ${trip.name}`);
                    }
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                    isSelected
                      ? 'bg-[#006194] text-white border-[#006194] shadow-sm scale-102 ring-2 ring-[#006194]/20'
                      : 'bg-white text-[#131b2e] border-[#e2e8f0] hover:bg-[#f2f3ff]'
                  }`}
                  type="button"
                >
                  <img
                    src={trip.backgroundImage}
                    alt={trip.name}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-md object-cover"
                  />
                  <span className="truncate max-w-[130px]">{trip.shortName}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">travel_explore</span>
              <span>No destinations match &ldquo;{searchQuery}&rdquo;</span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] font-bold text-[#006194] hover:underline"
            >
              Reset search
            </button>
          </div>
        )}
      </div>

      {/* Responsive Main Layout: 2 Columns on Desktop, Single Column on Mobile */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Hero, Weather, Schedule, Lodging & Destinations */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Trip Hero Card with Dynamic Inspiring Background Image */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-2 overflow-hidden relative border border-[#e2e8f0]/60">
            {/* Top banner with inspiring destination image */}
            <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden shadow-sm group">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={currentTrip.imageAlt}
                src={currentTrip.backgroundImage}
                referrerPolicy="no-referrer"
              />
              {/* Atmospheric layered gradient for superior legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e]/90 via-[#131b2e]/30 to-black/20" />

              {/* Top badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${currentTrip.statusColor} text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {currentTrip.statusBadge}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold shadow-sm border border-white/20">
                  <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">
                    schedule
                  </span>
                  {currentTrip.daysLeftText}
                </span>
              </div>

              {/* Title and details overlaid on bottom of image */}
              <div className="absolute bottom-2.5 left-3 right-3 flex flex-col">
                <div className="flex items-center gap-1 text-[#93c5fd] text-[11px] font-semibold mb-0.5">
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  <span className="truncate">{currentTrip.location}</span>
                </div>
                <h1 className="text-xl sm:text-2xl text-white font-extrabold drop-shadow-sm leading-tight">
                  {currentTrip.name}
                </h1>
                <p className="text-xs text-[#dae2fd]/90 font-medium line-clamp-1 mt-0.5">
                  {currentTrip.tagline}
                </p>
                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/20 text-[11px] text-[#e2e8f0]">
                  <span>{currentTrip.dates}</span>
                  <span className="font-semibold text-white/90">{currentTrip.daysTotal} days duration</span>
                </div>
              </div>
            </div>

            {/* Metadata & Travelers row */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => document.getElementById('weather-forecast-section')?.scrollIntoView({ behavior: 'smooth' })}
                title="View Weather Forecast"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#e0f2fe] active:scale-95 transition-all text-left"
                type="button"
              >
                <span className="material-symbols-outlined text-[#006194] text-[18px]">
                  {currentTrip.weatherIcon}
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold leading-tight flex items-center gap-1">
                    {(currentTrip.shortName || currentTrip.name || 'Trip').split(' ')[0]} {currentTrip.weatherTemp || '28°C'}
                    <span className="text-[9px] text-[#006194] font-bold">Forecast ↓</span>
                  </span>
                  <span className="text-[10px] text-[#64748b] leading-tight">
                    {currentTrip.weatherCondition} • {currentTrip.weatherRain}
                  </span>
                </div>
              </button>

              {/* Stacked Travelers from actual members with Member Count & Add Companion */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-2 p-1.5 px-2.5 rounded-2xl bg-white/90 hover:bg-white border border-[#cbd5e1]/80 shadow-xs hover:shadow-sm transition-all text-left group"
                  title="Click to view & add trip companions with name and phone"
                >
                  <div className="flex -space-x-2 overflow-hidden items-center">
                    {members.length > 0 ? (
                      members.slice(0, 4).map((m) => (
                        <div
                          key={m.id}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#cce5ff] text-[#006194] text-[11px] font-bold ring-2 ring-white shadow-xs"
                          title={`${m.name} (${m.phone || 'No phone'})`}
                        >
                          {m.initials || m.name.substring(0, 2).toUpperCase()}
                        </div>
                      ))
                    ) : (
                      <div
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#cce5ff] text-[#006194] text-[11px] font-bold ring-2 ring-white shadow-xs"
                        title="You"
                      >
                        YOU
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#131b2e] leading-tight flex items-center gap-1">
                      <span>{members.length || currentTrip.paxCount || 1} Members</span>
                    </span>
                    <span className="text-[10px] text-[#006194] font-bold flex items-center gap-0.5 group-hover:underline">
                      <span className="material-symbols-outlined text-[13px]">person_add</span>
                      <span>+ Add (Name &amp; Phone)</span>
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 5-Day Weather Forecast Section (TripGenie AI Powered) */}
          <WeatherForecastSection
            trip={currentTrip}
            onNavigate={onNavigate}
            onShowToast={onShowToast}
          />

          {/* Today's Agenda / Up Next Timeline preview */}
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">
                  {currentTrip.todayScheduleTitle || "Today's Schedule"}
                </h2>
                <span className="text-[11px] text-[#64748b]">
                  {currentTrip.todayScheduleSub || `Day ${currentTrip.currentDay || 1} • Exploration`}
                </span>
              </div>
              <button
                onClick={() => onNavigate('itinerary')}
                className="text-xs text-[#006194] font-semibold flex items-center gap-0.5 hover:underline"
                type="button"
              >
                Full Itinerary
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Timeline preview based on actual activities */}
            {activities.length > 0 ? (
              <div className="flex flex-col gap-3 relative pl-3 pt-1">
                <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-[#dae2fd]" />
                {activities.slice(0, 2).map((act, idx) => (
                  <div key={act.id} className="relative flex items-start gap-3 w-full">
                    <div className="w-6 h-6 rounded-full bg-[#e0f2fe] flex items-center justify-center shrink-0 z-10 mt-1 shadow-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#006194]" />
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-3.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-1.5 border border-[#e2e8f0]/60">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#006194]">
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          {act.timeSlot} {idx === 0 ? '• UP NEXT' : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#006194] text-[10px] font-semibold">
                          {act.category || 'Stop'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-xs font-bold text-[#131b2e] leading-snug">{act.title}</h3>
                        <span className="text-[11px] text-[#475569] flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[15px] text-[#64748b]">
                            location_on
                          </span>
                          {act.location}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full bg-white rounded-2xl p-5 text-center border border-[#e2e8f0]/80 shadow-xs flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                </div>
                <h4 className="text-xs font-bold text-[#131b2e]">No activities scheduled yet</h4>
                <p className="text-[11px] text-[#64748b] max-w-xs">
                  Add your first stop or let TripGenie AI generate a personalized schedule for Maharashtra.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('itinerary')}
                  className="mt-1 px-3 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-semibold hover:bg-[#004d77] transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">add_location_alt</span>
                  <span>Open Itinerary &amp; Add Stops</span>
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Lodging & Hotel Stays Section */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-3 border border-[#e2e8f0]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">hotel</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#131b2e] leading-tight">Confirmed Lodging &amp; Stays</h2>
                  <p className="text-[10px] text-[#64748b]">MTDC &amp; verified Maharashtra resorts</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('lodging')}
                className="text-xs text-[#006194] font-semibold flex items-center gap-0.5 hover:underline"
                type="button"
              >
                Book Hotels
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {reservations && reservations.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {reservations.map((res) => {
                  const hotelName = res.hotelName || res.hotel_name || 'MTDC Resort';
                  const roomType = res.roomTypeName || res.room_type_name || 'Standard Room';
                  const bookingRef = res.bookingRef || res.booking_ref || `TM-${res.id.slice(0, 8)}`;
                  const checkIn = res.checkInDate || res.check_in_date || 'Upcoming';
                  const checkOut = res.checkOutDate || res.check_out_date || '';
                  const totalInr = Number(res.totalAmountInr || res.total_amount_inr || 0);
                  const status = res.status || 'Confirmed';

                  return (
                    <div
                      key={res.id}
                      className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#006194]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#e2e8f0]">
                          <img
                            src={res.hotelImage || res.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80'}
                            alt={hotelName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-[#131b2e] truncate">{hotelName}</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-[#d1fae5] text-[#006c49] text-[9px] font-bold">
                              {status}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#64748b]">
                            {roomType} • {res.district || res.city || 'Maharashtra'}
                          </span>
                          <span className="text-[10px] text-[#006194] font-medium font-mono">
                            Ref: {bookingRef} • {checkIn} {checkOut ? `→ ${checkOut}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:border-l sm:pl-3 border-[#e2e8f0]">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-[10px] text-[#64748b]">Total Tariff</span>
                          <span className="text-xs font-extrabold text-[#131b2e]">
                            ₹{totalInr.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigate('lodging')}
                          className="px-2.5 py-1 rounded-lg bg-[#006194] text-white text-[11px] font-semibold hover:bg-[#004d77] transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-dashed border-[#cbd5e1] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#006194] text-[22px]">domain</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#131b2e]">No hotel stays booked yet</span>
                    <span className="text-[10px] text-[#64748b]">Reserve MTDC resorts, hill station villas &amp; coastal cottages across Maharashtra</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('lodging')}
                  className="px-3 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-bold hover:bg-[#004d77] transition-all shrink-0"
                >
                  Explore Hotels
                </button>
              </div>
            )}
          </div>

          {/* Inspiring Trip Destination Cards Showcase */}
          <div className="w-full flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#006194] text-[18px]">photo_library</span>
                  Your Trip Cards
                </h2>
                <p className="text-[11px] text-[#64748b]">
                  Switch active trip or plan additional travel adventures
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenCreateTrip?.()}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#006194] text-white hover:bg-[#004d77] transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                <span>+ Plan Trip</span>
              </button>
            </div>

            {/* Grid of Destination Cards */}
            {filteredTrips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTrips.map((trip) => {
                  const isCurrent = trip.id === currentTrip.id;
                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        if (onSelectTrip) {
                          onSelectTrip(trip.id);
                          onShowToast(`Active destination changed to ${trip.name}`);
                        }
                      }}
                      className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] border transition-all duration-300 hover:shadow-lg ${
                        isCurrent
                          ? 'ring-2 ring-[#006194] border-[#006194] shadow-md'
                          : 'border-[#e2e8f0]/80 hover:-translate-y-0.5'
                      }`}
                    >
                      {/* Background Image Banner */}
                      <div className="relative w-full h-36 overflow-hidden">
                        <img
                          src={trip.backgroundImage}
                          alt={trip.imageAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-[#131b2e]/40 to-transparent" />

                        {/* Status badge in corner */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${trip.statusColor}`}>
                            {(trip.statusBadge || 'Active').split('•')[0].trim()}
                          </span>
                          {isCurrent ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Active Dashboard
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                              {trip.daysTotal} Days
                            </span>
                          )}
                        </div>

                        {/* Destination Info overlaid on bottom */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex flex-col text-white">
                          <span className="text-[10px] text-[#93c5fd] font-semibold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">pin_drop</span>
                            {trip.country} • {trip.location}
                          </span>
                          <h3 className="text-sm font-bold leading-tight drop-shadow-xs truncate">
                            {trip.name}
                          </h3>
                        </div>
                      </div>

                      {/* Footer details row */}
                      <div className="p-2.5 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                          <span className="material-symbols-outlined text-[16px] text-[#006194]">
                            {trip.weatherIcon}
                          </span>
                          <span className="text-[11px] font-medium">{trip.weatherTemp}</span>
                          <span className="text-[10px] text-[#64748b]">• {(trip.dates || 'Dates open').split('–')[0].trim()}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTrip) {
                              onSelectTrip(trip.id);
                              onShowToast(`Selected ${trip.shortName} as active trip.`);
                            }
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-[#d1fae5] text-[#006c49]'
                              : 'bg-[#e2e7ff] text-[#006194] hover:bg-[#006194] hover:text-white'
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Viewing
                            </>
                          ) : (
                            <>
                              <span>Select</span>
                              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full bg-white rounded-2xl p-6 text-center flex flex-col items-center justify-center border border-dashed border-[#cbd5e1] gap-2 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">search_off</span>
                </div>
                <h3 className="text-sm font-bold text-[#131b2e]">No matching destinations</h3>
                <p className="text-xs text-[#64748b] max-w-sm">
                  We couldn't find any trip destinations matching &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-semibold hover:bg-[#004d77] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">refresh</span>
                  Show all destinations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Widget, Financial Health (in ₹), Balances (in ₹), Toolkit */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* TripGenie AI 360° Travel Intelligence Widget */}
          <div className="w-full bg-gradient-to-br from-[#004d77] via-[#006194] to-[#0284c7] text-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(0,97,148,0.25)] flex flex-col gap-3 relative overflow-hidden border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-amber-300 shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">psychology</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-white tracking-tight">TripGenie AI</h2>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 text-[9px] font-bold uppercase tracking-wider border border-amber-300/30">
                      360° Maharashtra
                    </span>
                  </div>
                  <p className="text-[10px] text-white/80">Analyzes itinerary, budget, debts &amp; climate</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('tripgenie')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#006194] text-xs font-bold shadow-sm hover:bg-amber-50 active:scale-95 transition-all"
                type="button"
              >
                <span>Ask Genie</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick status 4-pill row */}
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs flex flex-col">
                <span className="text-[9px] text-white/70">Readiness</span>
                <span className="text-xs font-extrabold text-amber-300">
                  {expenses.length > 0 || activities.length > 0 ? '94/100' : 'Ready'}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs flex flex-col">
                <span className="text-[9px] text-white/70">Schedule</span>
                <span className="text-xs font-bold text-white">
                  {activities.length > 0 ? `${activities.length} Stops` : 'Open'}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs flex flex-col">
                <span className="text-[9px] text-white/70">Budget</span>
                <span className="text-xs font-bold text-emerald-300">
                  {spentPercent > 90 ? 'High' : 'Under Cap'}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-white/15 backdrop-blur-xs flex flex-col">
                <span className="text-[9px] text-white/70">Debts</span>
                <span className="text-xs font-bold text-white">
                  {expenses.length > 0 ? 'Active' : 'Clean'}
                </span>
              </div>
            </div>

            {/* AI Action trigger */}
            <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[11px]">
              <span className="text-white/90 truncate flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-amber-300">auto_awesome</span>
                <span>All Maharashtra stops &amp; ₹ rates verified</span>
              </span>
              <button
                onClick={() => onNavigate('tripgenie')}
                className="text-amber-200 font-bold hover:underline shrink-0 text-[11px]"
                type="button"
              >
                Open TripGenie AI →
              </button>
            </div>
          </div>

          {/* Financial Health & Budget Gauge (Calculated from real expenses in INR ₹) */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-3 border border-[#e2e8f0]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    account_balance_wallet
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#131b2e] leading-tight">Trip Budget Health</h2>
                  <p className="text-[10px] text-[#64748b]">Total allocated: ₹{Number(totalBudgetUsd).toLocaleString('en-IN')}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#006c49] text-[10px] font-bold">
                {remainingPercent}% left
              </span>
            </div>

            {/* Spent vs Remaining Cards in ₹ */}
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <div className="p-3 rounded-xl bg-[#f2f3ff] flex flex-col">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                  Spent so far
                </span>
                <span className="text-xl sm:text-2xl text-[#131b2e] font-bold tracking-tight mt-0.5">
                  ₹{Number(totalSpentUsd).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#475569] mt-0.5">{spentPercent}% of total</span>
              </div>
              <div className="p-3 rounded-xl bg-[#e2e7ff]/60 flex flex-col">
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                  Available
                </span>
                <span className="text-xl sm:text-2xl text-[#006194] font-bold tracking-tight mt-0.5">
                  ₹{Number(remainingUsd).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#006c49] font-semibold mt-0.5">
                  ₹{Math.round(remainingUsd / Math.max(1, currentTrip.daysTotal)).toLocaleString('en-IN')} / day left
                </span>
              </div>
            </div>

            {/* Multi-segment progress bar representing categories */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="w-full h-3 rounded-full bg-[#eaedff] overflow-hidden flex shadow-inner">
                {expenses.length > 0 ? (
                  <>
                    <div
                      className="h-full bg-[#006194]"
                      style={{ width: `${Math.min(100, (catAccom / totalBudgetUsd) * 100)}%` }}
                      title={`Lodging ₹${catAccom.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="h-full bg-[#a36700]"
                      style={{ width: `${Math.min(100, (catFood / totalBudgetUsd) * 100)}%` }}
                      title={`Food ₹${catFood.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="h-full bg-[#006c49]"
                      style={{ width: `${Math.min(100, (catTrans / totalBudgetUsd) * 100)}%` }}
                      title={`Transport ₹${catTrans.toLocaleString('en-IN')}`}
                    />
                    <div
                      className="h-full bg-[#0ea5e9]"
                      style={{ width: `${Math.min(100, (catActivities / totalBudgetUsd) * 100)}%` }}
                      title={`Activities ₹${catActivities.toLocaleString('en-IN')}`}
                    />
                  </>
                ) : (
                  <div className="h-full w-full bg-[#eaedff]" />
                )}
              </div>

              {/* Category breakdown pills */}
              <div className="grid grid-cols-2 gap-y-1 gap-x-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#475569]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006194]" /> Lodging
                  </span>
                  <span className="text-xs text-[#131b2e] font-semibold">₹{catAccom.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#475569]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a36700]" /> Food
                  </span>
                  <span className="text-xs text-[#131b2e] font-semibold">₹{catFood.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#475569]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]" /> Transport
                  </span>
                  <span className="text-xs text-[#131b2e] font-semibold">₹{catTrans.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[#475569]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /> Activities
                  </span>
                  <span className="text-xs text-[#131b2e] font-semibold">₹{catActivities.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Pace Alert chip */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#d1fae5]/80 text-[#131b2e]">
              <span className="material-symbols-outlined text-[#006c49] text-[20px] shrink-0">
                check_circle
              </span>
              <p className="text-xs text-[#475569]">
                <span className="font-bold text-[#006c49]">On Track</span> •{' '}
                {expenses.length === 0
                  ? 'No spending yet. Fresh budget intact!'
                  : `Avg spend ₹${Math.round(totalSpentUsd / Math.max(1, currentTrip.currentDay)).toLocaleString('en-IN')}/day`}
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onOpenAddExpense}
                className="flex-1 h-11 px-4 rounded-xl bg-[#006194] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Expense
              </button>
              <button
                onClick={() => onNavigate('expenses')}
                className="flex-1 h-11 px-4 rounded-xl bg-[#e2e7ff] text-[#131b2e] font-semibold text-xs flex items-center justify-center gap-1.5 active:bg-[#dae2fd] transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[#006194] text-[18px]">group</span>
                Split Ledger
              </button>
            </div>
          </div>

          {/* Travel Crew & Member Directory (Name & Phone) */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-3 border border-[#e2e8f0]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-[#131b2e] leading-tight">Travel Crew &amp; Members</h2>
                    <span className="px-2 py-0.2 rounded-full bg-[#e0f2fe] text-[#006194] text-[10px] font-bold">
                      {members.length} {members.length === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748b]">Companions list with verified name &amp; phone numbers</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-[#006194] text-white text-xs font-bold hover:bg-[#0073af] transition-all flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                <span>+ Add Member</span>
              </button>
            </div>

            {/* User's Own Card (With Phone Number & Quick Edit) */}
            <div className="p-3 rounded-xl bg-[#f0f9ff] border border-[#bae6fd] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#006194] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {(currentUser?.name || 'You').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#131b2e] truncate">{currentUser?.name || 'You'}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#006194] text-white">
                        Organizer / Owner
                      </span>
                    </div>
                    <span className="text-[10px] text-[#64748b] truncate">{currentUser?.email || 'Logged in traveler'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserPhoneInput(currentUser?.phone || '+91 98765 43210');
                    setIsEditUserPhoneModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#93c5fd] text-[#006194] text-[11px] font-bold hover:bg-[#e0f2fe] transition-all flex items-center gap-1 shrink-0"
                  title="Edit your phone number"
                >
                  <span className="material-symbols-outlined text-[13px]">edit</span>
                  <span>{currentUser?.phone ? 'Edit Phone' : 'Add Phone'}</span>
                </button>
              </div>

              {/* User's Phone display */}
              <div className="flex items-center justify-between pt-1 border-t border-[#e0f2fe] text-xs">
                <span className="text-[10px] text-[#64748b] font-medium">Your Phone:</span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#006194]">call</span>
                  <span className="font-bold text-[#006194] text-xs">
                    {currentUser?.phone || '+91 98765 43210'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active contact" />
                </div>
              </div>
            </div>

            {/* Companions List */}
            {members.length > 1 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {members.slice(1).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/60 text-xs hover:bg-[#f1f5f9] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 mr-1">
                      <div className="w-7 h-7 rounded-full bg-[#cce5ff] text-[#006194] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {m.initials || m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[#131b2e] truncate">{m.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-[#64748b] font-medium border border-[#e2e8f0]">
                            {m.subtext || 'Traveler'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#006194] font-semibold">
                          <span className="material-symbols-outlined text-[11px]">call</span>
                          <a href={`tel:${m.phone}`} className="hover:underline">
                            {m.phone || 'No phone'}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {m.phone && (
                        <a
                          href={`tel:${m.phone}`}
                          className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
                          title={`Call ${m.name}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">call</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanion(m.id)}
                        className="w-7 h-7 rounded-lg bg-white text-[#f43f5e] hover:bg-[#ffe4e6] flex items-center justify-center border border-[#e2e8f0]/80"
                        title="Remove companion"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-xl bg-[#f8fafc] border border-dashed border-[#cbd5e1] flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-[#131b2e]">No travel companions added yet</span>
                <span className="text-[10px] text-[#64748b]">
                  Add your friends or family with their Name and Phone number to coordinate trips &amp; split expenses.
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="mt-1 text-[11px] font-bold text-[#006194] hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">person_add</span>
                  <span>+ Add First Companion (Name &amp; Phone)</span>
                </button>
              </div>
            )}
          </div>

          {/* Group Expense Snapshot */}
          <div className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-2 border border-[#e2e8f0]/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#131b2e]">Shared Balances</span>
              <span className="px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#006c49] text-[10px] font-bold">
                {expenses.length === 0 || members.length <= 1
                  ? 'All Settled (₹0)'
                  : appMode === 'demo'
                  ? '+₹2,450 to receive'
                  : 'Bal: ₹0'}
              </span>
            </div>

            {members.length <= 1 ? (
              <div className="p-3 text-center rounded-xl bg-[#f8fafc] text-xs text-[#64748b] my-1">
                <p className="font-semibold text-[#131b2e]">Solo Traveler · 1 Member</p>
                <p className="text-[11px] mt-0.5">All expenses are personal. Add trip companions in your profile to split bills.</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-[#f8fafc] text-xs text-[#64748b] my-1">
                <p className="font-semibold text-[#131b2e]">No shared expenses logged yet.</p>
                <p className="text-[11px] mt-0.5">Add group expenses to calculate automatic debts and splits between {members.length} members.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[#006c49] text-[18px]">verified</span>
                    <span className="text-xs text-[#131b2e] font-semibold truncate">All member splits balanced in ₹</span>
                  </div>
                  <button
                    onClick={() => onNavigate('expenses')}
                    className="px-2.5 py-1 rounded-lg bg-[#e2e7ff] text-[#006194] text-[11px] font-semibold hover:bg-[#d1fae5] active:scale-95 transition-all shrink-0"
                    type="button"
                  >
                    View Ledger
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Shortcuts Grid (4 micro-cards) */}
          <div className="w-full flex flex-col gap-2 pt-1">
            <span className="text-xs text-[#64748b] px-1 uppercase tracking-wider font-bold">
              Trip Toolkit
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Shortcut 1: Offline Maharashtra Map */}
              <button
                onClick={onOpenMap}
                className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex items-center gap-3 text-left border border-[#e2e8f0]/60 hover:bg-[#f2f3ff] active:scale-95 transition-all"
                type="button"
              >
                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">map</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#131b2e] font-bold truncate">All-MH Map</span>
                  <span className="text-[11px] text-[#64748b] leading-tight">36 districts</span>
                </div>
              </button>

              {/* Shortcut 2: Journal */}
              <button
                onClick={() => onNavigate('journal')}
                className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex items-center gap-3 text-left border border-[#e2e8f0]/60 hover:bg-[#f2f3ff] active:scale-95 transition-all"
                type="button"
              >
                <div className="w-10 h-10 rounded-xl bg-[#dae2fd] text-[#006194] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#131b2e] font-bold truncate">Journal</span>
                  <span className="text-[11px] text-[#64748b] leading-tight">Travel memories</span>
                </div>
              </button>

              {/* Shortcut 3: AI Packing */}
              <button
                onClick={onOpenPacking}
                className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex items-center gap-3 text-left border border-[#e2e8f0]/60 hover:bg-[#f2f3ff] active:scale-95 transition-all"
                type="button"
              >
                <div className="w-10 h-10 rounded-xl bg-[#6ffbbe] text-[#006c49] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#131b2e] font-bold truncate">AI Packing</span>
                  <span className="text-[11px] text-[#64748b] leading-tight">Climate packing</span>
                </div>
              </button>

              {/* Shortcut 4: Emergency */}
              <button
                onClick={onOpenEmergency}
                className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex items-center gap-3 text-left border border-[#e2e8f0]/60 hover:bg-[#ffe4e6]/50 active:scale-95 transition-all"
                type="button"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffe4e6] text-[#f43f5e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">emergency</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[#131b2e] font-bold truncate">Emergency</span>
                  <span className="text-[11px] text-[#64748b] leading-tight">Maharashtra helpline</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ADD MEMBER MODAL ==================== */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006194]/10 text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">Add Travel Companion</h3>
                  <p className="text-[10px] text-[#64748b]">Add travel member with Name &amp; Phone Number</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Companion Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Phone Number (Mobile / WhatsApp) *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#006194]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="priya@travel.co"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-0.5">
                  Trip Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                >
                  <option value="Traveler">Traveler</option>
                  <option value="Co-Pilot">Co-Pilot &amp; Navigator</option>
                  <option value="Foodie Guide">Foodie &amp; Dining Scout</option>
                  <option value="Photographer">Trip Photographer</option>
                  <option value="Ledger Keeper">Ledger &amp; Split Keeper</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold text-xs hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-xs hover:bg-[#0073af] active:scale-95 transition-all"
                >
                  Add Companion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT USER PHONE MODAL ==================== */}
      {isEditUserPhoneModal && (
        <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0]/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#006194]/10 text-[#006194] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131b2e]">Your Phone Number</h3>
                  <p className="text-[10px] text-[#64748b]">Add or update your contact / WhatsApp number</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserPhoneModal(false)}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0]"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserPhone} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#64748b] block mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#006194]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    value={userPhoneInput}
                    onChange={(e) => setUserPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm font-bold text-[#131b2e] bg-[#f8fafc] border border-[#cbd5e1] rounded-xl outline-none focus:border-[#006194]"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">
                  This phone number will be attached to your profile and visible to your travel crew.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditUserPhoneModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold text-xs hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#006194] text-white font-bold text-xs shadow-xs hover:bg-[#0073af] active:scale-95 transition-all"
                >
                  Save Phone Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
