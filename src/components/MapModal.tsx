import React, { useState } from 'react';
import { WorldPlace, NearbyPlace, ItineraryActivity, HotelLodging } from '../types';
import { MAHARASHTRA_PLACES, MAHARASHTRA_DISTRICTS } from '../data/maharashtraPlacesData';
import { MAHARASHTRA_HOTELS } from '../data/maharashtraHotelsData';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  initialPlace?: WorldPlace | null;
  onAddActivity?: (activity: ItineraryActivity) => void;
  onOpenHotelBooking?: (hotel: HotelLodging) => void;
}

export function MapModal({
  isOpen,
  onClose,
  onShowToast,
  initialPlace,
  onAddActivity,
  onOpenHotelBooking,
}: MapModalProps) {
  const [isStatewideMode, setIsStatewideMode] = useState<boolean>(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    initialPlace?.id || MAHARASHTRA_PLACES[0]?.id || 'mumbai-gateway'
  );
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedNearby, setSelectedNearby] = useState<NearbyPlace | null>(null);

  if (!isOpen) return null;

  const activePlace =
    MAHARASHTRA_PLACES.find((p) => p.id === selectedPlaceId) ||
    initialPlace ||
    MAHARASHTRA_PLACES[0];

  const handleSelectNearby = (nearby: NearbyPlace) => {
    setSelectedNearby(nearby);
  };

  const handleAddActivity = (item: any) => {
    if (onAddActivity) {
      const isPlace = 'city' in item && 'coordinates' in item;
      const act: ItineraryActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        day: 2,
        timeSlot: '11:00 - 13:30',
        title: item.name,
        status: 'upcoming',
        category: item.category || 'Sightseeing',
        location: isPlace ? `${item.district || item.city}, Maharashtra` : item.name,
        cost: item.entryFee || '₹50 - ₹120 approx',
        image: item.heroImage || item.image,
        tags: item.tags || ['Maharashtra'],
        transitInfo: isPlace ? item.name : item.distanceText || 'Scenic Route',
      };
      onAddActivity(act);
      onShowToast(`✓ Added "${item.name}" to trip itinerary!`);
    } else {
      onShowToast(`✓ Added "${item.name}" to trip schedule!`);
    }
  };

  const handleSelectHotel = (hotel: HotelLodging) => {
    if (onOpenHotelBooking) {
      onOpenHotelBooking(hotel);
    } else {
      onShowToast(`🏨 Selected ${hotel.name}. Visit the Lodging tab to complete booking.`);
    }
  };

  const filterChips = [
    { id: 'All', label: 'All 36 Districts' },
    { id: 'Forts', label: 'Sahyadri Forts' },
    { id: 'Caves', label: 'UNESCO Caves' },
    { id: 'Beaches', label: 'Konkan Beaches' },
    { id: 'Hills', label: 'Hill Stations' },
    { id: 'Wildlife', label: 'Tiger Safaris' },
    { id: 'Temples', label: 'Jyotirlinga & Shrines' },
    { id: 'Hotels', label: 'MTDC Resorts & Hotels' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-[#faf8ff] border-b border-[#e2e8f0] flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#006194] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">map</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#131b2e]">
                    Maharashtra State Interactive Map
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#006c49]/15 text-[#006c49] font-bold">
                    36 Districts • OpenStreetMap
                  </span>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  {isStatewideMode
                    ? `Displaying destinations, forts, UNESCO caves & MTDC stays across Maharashtra`
                    : `${activePlace.name} (${activePlace.district || activePlace.city})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Statewide vs Focus Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsStatewideMode(!isStatewideMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                  isStatewideMode
                    ? 'bg-[#006194] text-white border-[#006194]'
                    : 'bg-white text-[#006194] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isStatewideMode ? 'public' : 'location_searching'}
                </span>
                <span className="hidden sm:inline">
                  {isStatewideMode ? 'Statewide View' : 'Focus Mode'}
                </span>
              </button>

              {/* District Dropdown Selector */}
              <select
                value={selectedPlaceId}
                onChange={(e) => {
                  setSelectedPlaceId(e.target.value);
                  setIsStatewideMode(false);
                  setSelectedNearby(null);
                  onShowToast(`Zoomed into ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="text-xs py-1.5 px-2.5 rounded-xl bg-white border border-[#e2e8f0] text-[#131b2e] font-bold focus:outline-none focus:ring-2 focus:ring-[#006194]/20 max-w-[160px] sm:max-w-[220px]"
              >
                {MAHARASHTRA_PLACES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.district || p.city}: {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white shadow-xs text-[#131b2e] flex items-center justify-center hover:bg-[#f2f3ff] transition-all"
                type="button"
                aria-label="Close Map"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {filterChips.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setActiveFilter(chip.id);
                    setIsStatewideMode(true);
                  }}
                  type="button"
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs ${
                    isActive
                      ? 'bg-[#006194] text-white shadow-xs'
                      : 'bg-white text-[#475569] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Interactive Leaflet Map */}
        <div className="flex-1 relative overflow-hidden bg-[#eaedff]">
          <InteractiveLeafletMap
            place={isStatewideMode ? undefined : activePlace}
            allPlaces={MAHARASHTRA_PLACES}
            allHotels={MAHARASHTRA_HOTELS}
            statewideMode={isStatewideMode}
            activeFilter={activeFilter}
            selectedNearby={selectedNearby}
            onSelectNearby={handleSelectNearby}
            onSelectPlace={(place) => {
              setSelectedPlaceId(place.id);
              setIsStatewideMode(false);
              onShowToast(`📍 Focused on ${place.name} (${place.district || place.city})`);
            }}
            onSelectHotel={handleSelectHotel}
            onAddToItinerary={handleAddActivity}
            height="100%"
          />

          {/* Quick Route / Selected Nearby Card overlay */}
          {selectedNearby && (
            <div className="absolute bottom-4 inset-x-4 max-w-md mx-auto p-3.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-[#e2e8f0] space-y-2.5 z-10 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedNearby.image}
                    alt={selectedNearby.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-[#131b2e] truncate">
                      {selectedNearby.name}
                    </h4>
                    <p className="text-[10px] text-[#006194] font-semibold truncate">
                      📍 {selectedNearby.distanceText} • {selectedNearby.category}
                    </p>
                    <p className="text-[10px] text-[#006c49] font-bold">
                      Est. {selectedNearby.estCost}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAddActivity(selectedNearby)}
                    className="px-3 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Add to Plan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
