import { useState } from 'react';
import { TRIP_DESTINATIONS } from '../data/mockData';
import { UserProfile, TripDestination, ScreenTab } from '../types';
import { TravelMateLogo } from './TravelMateLogo';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  onOpenProfile: () => void;
  activeTripName?: string;
  activeTripDates?: string;
  onSelectTrip?: (tripId: string) => void;
  onOpenJournal?: () => void;
  onOpenOfflineModal?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'admin') => void;
  onOpenTripGenie?: () => void;
  currentUser?: UserProfile;
  isOffline?: boolean;
  trips?: TripDestination[];
  onOpenCreateTrip?: () => void;
  onLoadDemoTrip?: () => void;
  appMode?: 'fresh' | 'demo';
  onOpenAdmin?: () => void;
  activeTab?: ScreenTab;
  onNavigate?: (tab: ScreenTab) => void;
}

export function Header({
  onOpenProfile,
  activeTripName = 'Sahyadri & Konkan',
  activeTripDates = 'Nov 14 - 21',
  onSelectTrip,
  onOpenOfflineModal,
  onOpenAuth,
  onOpenTripGenie,
  currentUser,
  isOffline = false,
  trips,
  onOpenCreateTrip,
  onLoadDemoTrip,
  appMode,
  onOpenAdmin,
  activeTab = 'dashboard',
  onNavigate,
}: HeaderProps) {
  const [showTripMenu, setShowTripMenu] = useState(false);

  const availableTrips = trips && trips.length > 0 ? trips : (appMode === 'demo' ? TRIP_DESTINATIONS : []);

  const navLinks: { id: ScreenTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'itinerary', label: 'Itinerary', icon: 'calendar_month' },
    { id: 'expenses', label: 'Expenses (₹)', icon: 'account_balance_wallet' },
    { id: 'tripgenie', label: 'TripGenie AI', icon: 'auto_awesome' },
    { id: 'explore-ai', label: 'Explore MH', icon: 'travel_explore' },
    { id: 'lodging', label: 'Hotels', icon: 'hotel' },
    { id: 'journal', label: 'Journal', icon: 'photo_library' },
    { id: 'profile', label: 'My Profile', icon: 'account_circle' },
    { id: 'admin', label: 'Admin Console', icon: 'shield_person' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#faf8ff]/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e2e8f0]/80">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Logo and Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <TravelMateLogo size={34} />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg text-[#006194] leading-tight tracking-tight">
                TravelMate
              </span>
              <span className="text-[9px] font-bold text-[#006c49] tracking-wider uppercase hidden sm:inline">
                Maharashtra Edition
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Website Navigation Tabs (Auto adapts on tablet/desktop) */}
        {onNavigate && (
          <nav className="hidden lg:flex items-center gap-1 bg-white/70 p-1 rounded-2xl border border-[#e2e8f0] shadow-2xs">
            {navLinks.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#006194] text-white shadow-xs'
                      : 'text-[#475569] hover:text-[#006194] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Trip Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTripMenu(!showTripMenu)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2e7ff]/70 hover:bg-[#e2e7ff] active:bg-[#dae2fd] text-left transition-colors min-h-[44px]"
            type="button"
            aria-expanded={showTripMenu}
          >
            <div className="flex flex-col text-left">
              <span className="text-xs text-[#131b2e] leading-tight font-semibold truncate max-w-[130px]">
                {availableTrips.length === 0 ? 'Plan First Trip' : activeTripName}
              </span>
              <span className="text-[10px] text-[#64748b] leading-tight">
                {availableTrips.length === 0 ? 'Fresh App' : activeTripDates}
              </span>
            </div>
            <span className={`material-symbols-outlined text-[#006194] text-[18px] transition-transform duration-200 ${showTripMenu ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {/* Trip Dropdown Menu */}
          {showTripMenu && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                onClick={() => setShowTripMenu(false)}
              />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-68 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                  <span>Your Journeys</span>
                  <span className="text-[10px] text-[#006194] font-semibold">
                    {availableTrips.length} {availableTrips.length === 1 ? 'Trip' : 'Trips'}
                  </span>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {availableTrips.length > 0 ? (
                    availableTrips.map((trip) => (
                      <button
                        key={trip.id}
                        onClick={() => {
                          if (onSelectTrip) onSelectTrip(trip.id);
                          setShowTripMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${
                          trip.name === activeTripName || trip.shortName === activeTripName
                            ? 'bg-[#e0f2fe] text-[#006194]'
                            : 'hover:bg-[#f2f3ff] text-[#131b2e]'
                        }`}
                      >
                        <img
                          src={trip.backgroundImage}
                          alt={trip.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-2xs"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold leading-snug truncate">{trip.shortName}</span>
                          <span className="text-[10px] text-[#64748b] truncate">{trip.dates}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-white/80 shrink-0">
                          {(trip.statusBadge || 'Active').split('•')[0].trim()}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-[#64748b] bg-[#f8fafc] rounded-xl my-1">
                      <p className="font-medium">No trips planned yet.</p>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">Start fresh or load demo data.</p>
                    </div>
                  )}
                </div>

                {/* Dropdown Action Buttons */}
                <div className="pt-2 mt-1 border-t border-[#e2e8f0] space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTripMenu(false);
                      if (onOpenCreateTrip) onOpenCreateTrip();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#006194] text-white text-xs font-bold hover:bg-[#004d77] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>+ Plan New Trip</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Offline Status & Profile / Auth */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          {onOpenTripGenie && (
            <button
              onClick={onOpenTripGenie}
              title="TripGenie AI 360° Travel Auditor"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all bg-gradient-to-r from-[#006194] to-[#0284c7] text-white hover:brightness-110 active:scale-95 shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-300">
                psychology
              </span>
              <span className="text-[10px] font-extrabold tracking-tight">Genie AI</span>
            </button>
          )}

          {onOpenOfflineModal && (
            <button
              onClick={onOpenOfflineModal}
              title={isOffline ? "Offline Mode: Using cached data" : "Online: Offline data cached"}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                isOffline
                  ? 'bg-[#fed7aa] text-[#c2410c] hover:bg-[#fdba74]'
                  : 'bg-[#e0f2fe] text-[#006194] hover:bg-[#bae6fd]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isOffline ? 'cloud_off' : 'cloud_done'}
              </span>
              <span className="hidden min-[420px]:inline text-[10px]">
                {isOffline ? 'Offline' : 'Cached'}
              </span>
            </button>
          )}

          {/* Admin Console / Portal shortcut */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title={currentUser?.role === 'ADMIN' ? "Open Super Administrator Console" : "Open Administrator Sign In Portal"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 ${
                currentUser?.role === 'ADMIN'
                  ? 'bg-[#0c1e33] text-[#fde047] border border-amber-400/60 hover:bg-[#162e4c]'
                  : 'bg-[#0f172a] text-amber-200 border border-amber-500/40 hover:bg-[#1e293b]'
              }`}
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] ${currentUser?.role === 'ADMIN' ? 'text-amber-400' : 'text-amber-300'}`}>
                shield_person
              </span>
              <span className="text-[11px] font-extrabold tracking-tight">
                {currentUser?.role === 'ADMIN' ? 'Admin Console' : 'Admin'}
              </span>
            </button>
          )}

          {/* Quick Sign In / Sign Up / Switch User buttons */}
          {onOpenAuth && (
            currentUser?.isLoggedIn ? (
              <button
                onClick={() => onOpenAuth('signin')}
                title={`Signed in as ${currentUser.name} • Click to switch accounts`}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0]"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">switch_account</span>
                <span className="text-[10px]">Switch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenAuth('signin')}
                  title="Log in with existing traveler or admin account"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs bg-[#006194] text-white hover:bg-[#004f7a] active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">login</span>
                  <span className="text-[11px]">Log In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  title="Create a new TravelMate account"
                  className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">person_add</span>
                  <span className="text-[11px]">Sign Up</span>
                </button>
              </div>
            )
          )}

          <button
            onClick={onOpenProfile}
            aria-label="User Profile & Settings"
            title={`${currentUser?.name || 'User'} • Click to view Profile & Settings`}
            className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200/80 shadow-2xs"
            type="button"
          >
            <UserAvatar
              name={currentUser?.name || 'You'}
              avatar={currentUser?.avatar}
              size="sm"
              showStatusBadge
              isOnline={currentUser?.isLoggedIn ?? true}
            />
            <span className="hidden sm:inline text-[11px] font-bold text-slate-700 max-w-[85px] truncate">
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
