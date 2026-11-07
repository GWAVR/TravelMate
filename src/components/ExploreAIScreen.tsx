import { useState, useMemo } from 'react';
import { WorldPlace, NearbyPlace, ItineraryActivity, Continent, IndianPlace } from '../types';
import { WORLD_PLACES } from '../data/worldPlacesData';
import { INDIAN_PLACES } from '../data/mockData';
import { searchAndResolvePlace, placeToItineraryActivity, getStoredWorldPlaces } from '../utils/worldPlacesApi';
import { WorldPlaceDetailsModal } from './WorldPlaceDetailsModal';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';
import { useLanguage } from '../context/LanguageContext';

interface ExploreAIScreenProps {
  onShowToast: (msg: string) => void;
  onOpenMap: (place?: WorldPlace) => void;
  onOpenPacking?: () => void;
  onAddActivity?: (activity: ItineraryActivity) => void;
  onSelectTripDestination?: (place: WorldPlace) => void;
  onOpenAddLocation?: () => void;
}

export function ExploreAIScreen({
  onShowToast,
  onOpenMap,
  onOpenPacking,
  onAddActivity,
  onSelectTripDestination,
  onOpenAddLocation,
}: ExploreAIScreenProps) {
  const { t } = useLanguage();
  // Explorer section mode: 'world' | 'india'
  const [explorerMode, setExplorerMode] = useState<'world' | 'india'>('world');

  // Search & Filters for World Places
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<Continent>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewLayout, setViewLayout] = useState<'cards' | 'map'>('cards');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  // Selected Place for Full Details Modal
  const [selectedPlace, setSelectedPlace] = useState<WorldPlace | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Quick added tracking
  const [addedPlaces, setAddedPlaces] = useState<{ [id: string]: boolean }>({});

  // Dynamic places state (local + newly resolved places)
  const [worldPlacesList, setWorldPlacesList] = useState<WorldPlace[]>(() => getStoredWorldPlaces());

  // India Legacy State
  const [indianCategory, setIndianCategory] = useState<string>('All');
  const [indianRegion, setIndianRegion] = useState<string>('All');

  // Continents / Maharashtra Divisions list
  const continents: { id: Continent; label: string; icon: string }[] = [
    { id: 'All', label: 'All Maharashtra', icon: 'public' },
    { id: 'Asia', label: 'Konkan Division', icon: 'waves' },
    { id: 'Europe', label: 'Pune Division', icon: 'castle' },
    { id: 'North America', label: 'Nashik Division', icon: 'temple_buddhist' },
    { id: 'South America', label: 'Chhatrapati Sambhaji Nagar', icon: 'landscape' },
    { id: 'Africa', label: 'Vidarbha & Nagpur', icon: 'wb_sunny' },
    { id: 'Oceania', label: 'Amravati Division', icon: 'nature' },
  ];

  const categories = [
    'All',
    'Must-See Wonder',
    'Historic City',
    'Beach & Coastal',
    'Mountain & Nature',
    'Metropolis',
  ];

  const popularSearches = [
    { label: '🏛️ Ajanta & Ellora', query: 'Ajanta' },
    { label: '🚩 Raigad Fort', query: 'Raigad' },
    { label: '🌊 Gateway of India', query: 'Gateway' },
    { label: '🐅 Tadoba Tiger Safari', query: 'Tadoba' },
    { label: '🍓 Mahabaleshwar', query: 'Mahabaleshwar' },
    { label: '🕉️ Shirdi Sai Mandir', query: 'Shirdi' },
    { label: '🏖️ Ganpatipule Beach', query: 'Ganpatipule' },
    { label: '☄️ Lonar Meteorite Crater', query: 'Lonar' },
    { label: '🏰 Sinhagad Fort Pune', query: 'Sinhagad' },
    { label: '🤿 Tarkarli Scuba', query: 'Tarkarli' },
  ];

  // Filtered World Places
  const filteredWorldPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return worldPlacesList.filter((place) => {
      const matchContinent = selectedContinent === 'All' || place.continent === selectedContinent;
      const matchCategory = selectedCategory === 'All' || place.category === selectedCategory;
      const matchSearch =
        q === '' ||
        place.name.toLowerCase().includes(q) ||
        place.city.toLowerCase().includes(q) ||
        place.country.toLowerCase().includes(q) ||
        place.continent.toLowerCase().includes(q) ||
        place.description.toLowerCase().includes(q) ||
        place.tagline.toLowerCase().includes(q) ||
        place.tags.some((t) => t.toLowerCase().includes(q)) ||
        place.nearbyPlaces.some(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q) ||
            n.description.toLowerCase().includes(q)
        );

      return matchContinent && matchCategory && matchSearch;
    });
  }, [worldPlacesList, searchQuery, selectedContinent, selectedCategory]);

  // Handle dynamic AI search when user presses Enter or clicks "Search Any World Place"
  const handlePerformUniversalSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) return;

    // Check if we already have it in the local list
    const found = worldPlacesList.find(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.city.toLowerCase() === q.toLowerCase() ||
        p.country.toLowerCase() === q.toLowerCase()
    );

    if (found) {
      setSelectedPlace(found);
      setIsDetailsModalOpen(true);
      onShowToast(`Found full details & nearby places for ${found.name}!`);
      return;
    }

    // Otherwise, resolve via server AI endpoint
    setIsSearchingOnline(true);
    onShowToast(`🔍 Searching world database & TripGenie AI for "${q}"...`);

    try {
      const newPlace = await searchAndResolvePlace(q);
      setWorldPlacesList((prev) => {
        if (prev.some((p) => p.id === newPlace.id)) return prev;
        return [newPlace, ...prev];
      });
      setSelectedPlace(newPlace);
      setIsDetailsModalOpen(true);
      onShowToast(`✓ Full details & ${newPlace.nearbyPlaces.length} nearby places generated for "${newPlace.name}"!`);
    } catch (err) {
      console.error('Universal place resolution failed:', err);
      onShowToast(`Loaded travel guide for ${q}.`);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleOpenPlaceDetails = (place: WorldPlace) => {
    setSelectedPlace(place);
    setIsDetailsModalOpen(true);
  };

  const handleAddPlaceToItinerary = (place: WorldPlace, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddedPlaces((prev) => ({ ...prev, [place.id]: true }));
    if (onAddActivity) {
      const act = placeToItineraryActivity(place);
      onAddActivity(act);
      onShowToast(`✓ Added "${place.name}" (${place.city}, ${place.country}) to trip itinerary!`);
    } else {
      onShowToast(`✓ Added "${place.name}" to trip schedule!`);
    }
  };

  const handleAddNearbyToItinerary = (nearby: NearbyPlace, placeName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddedPlaces((prev) => ({ ...prev, [nearby.id]: true }));
    if (onAddActivity) {
      const act = placeToItineraryActivity(nearby);
      onAddActivity(act);
      onShowToast(`✓ Added nearby spot "${nearby.name}" (${nearby.distanceText}) to Day 3 itinerary!`);
    } else {
      onShowToast(`✓ Added "${nearby.name}" to trip schedule!`);
    }
  };

  // Indian places filter
  const filteredIndianPlaces = INDIAN_PLACES.filter((place) => {
    const matchesCategory = indianCategory === 'All' || place.category === indianCategory;
    const matchesRegion = indianRegion === 'All' || place.region === indianRegion;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      place.name.toLowerCase().includes(q) ||
      place.city.toLowerCase().includes(q) ||
      place.state.toLowerCase().includes(q) ||
      place.description.toLowerCase().includes(q);
    return matchesCategory && matchesRegion && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* Top Header & Mode Switcher */}
      <div className="px-4 pt-1 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006194] text-[24px]">location_on</span>
              <h1 className="text-xl font-black text-[#131b2e] tracking-tight">
                Maharashtra Places & 36 Districts Guide
              </h1>
            </div>
            <p className="text-xs text-[#64748b]">
              Explore all 36 districts of Maharashtra with famous monuments, UNESCO caves, Sahyadri hill forts, tiger reserves, and nearby attractions.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenAddLocation && (
              <button
                onClick={onOpenAddLocation}
                className="px-2.5 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-2xs hover:bg-[#007bb9] active:scale-95 transition-all flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[17px]">add_location_alt</span>
                <span className="hidden min-[400px]:inline">+ Add Location</span>
              </button>
            )}

            {/* Map Modal Trigger */}
            <button
              onClick={() => onOpenMap(filteredWorldPlaces[0] || WORLD_PLACES[0])}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-[#e2e8f0] text-[#006194] text-xs font-bold shadow-2xs hover:bg-[#f2f3ff] active:scale-95 transition-all flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">map</span>
              <span className="hidden sm:inline">Maharashtra Map</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#eaedff] rounded-2xl">
          <button
            onClick={() => {
              setExplorerMode('world');
              setSearchQuery('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              explorerMode === 'world'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">location_city</span>
            <span>All Maharashtra Places ({worldPlacesList.length})</span>
          </button>

          <button
            onClick={() => {
              setExplorerMode('india');
              setSearchQuery('');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              explorerMode === 'india'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">castle</span>
            <span>Forts & Heritage ({INDIAN_PLACES.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* WORLD PLACES SECTION (Universal Search & All World Places) */}
      {/* ======================================================== */}
      {explorerMode === 'world' && (
        <div className="space-y-4">
          {/* Universal Search Bar */}
          <div className="px-4 space-y-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#006194] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePerformUniversalSearch();
                  }
                }}
                placeholder={t('explore.searchPlaceholder')}
                className="w-full pl-10 pr-24 py-3 rounded-2xl bg-white border border-[#e2e8f0] text-xs font-medium text-[#131b2e] placeholder-[#94a3b8] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#006194]/25 focus:border-[#006194] transition-all"
              />

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-6 h-6 rounded-full text-[#64748b] hover:bg-[#f1f5f9] flex items-center justify-center"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}

                <button
                  onClick={() => handlePerformUniversalSearch()}
                  disabled={isSearchingOnline || !searchQuery.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#006194] text-white text-[11px] font-bold shadow-xs hover:bg-[#007bb9] active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
                  type="button"
                >
                  {isSearchingOnline ? (
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                  )}
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Popular Search Suggestions */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] uppercase font-bold text-[#64748b] shrink-0">Popular:</span>
              {popularSearches.map((item) => (
                <button
                  key={item.query}
                  onClick={() => {
                    setSearchQuery(item.query);
                    handlePerformUniversalSearch(item.query);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#e2e8f0] text-[10px] font-semibold text-[#131b2e] hover:bg-[#f2f3ff] hover:text-[#006194] transition-all shrink-0"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continents Filter Bar */}
          <div className="px-4">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {continents.map((cont) => {
                const isActive = selectedContinent === cont.id;
                return (
                  <button
                    key={cont.id}
                    onClick={() => setSelectedContinent(cont.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-[#006194] text-white shadow-xs'
                        : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#131b2e]'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">{cont.icon}</span>
                    <span>{cont.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Filter & View Mode Toggle */}
          <div className="px-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                      isActive
                        ? 'bg-[#e0f2fe] text-[#006194] font-bold'
                        : 'text-[#64748b] hover:bg-[#f1f5f9]'
                    }`}
                    type="button"
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Layout Toggle: Cards vs Map */}
            <div className="flex items-center bg-white border border-[#e2e8f0] p-0.5 rounded-xl shrink-0">
              <button
                onClick={() => setViewLayout('cards')}
                title="Grid Cards View"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewLayout === 'cards' ? 'bg-[#006194] text-white' : 'text-[#64748b]'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewLayout('map')}
                title="Interactive Map View"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewLayout === 'map' ? 'bg-[#006194] text-white' : 'text-[#64748b]'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">map</span>
              </button>
            </div>
          </div>

          {/* MAP VIEW */}
          {viewLayout === 'map' && filteredWorldPlaces.length > 0 && (
            <div className="px-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>
                  Showing <strong>{filteredWorldPlaces.length} destinations</strong> on interactive map
                </span>
                <span className="text-[10px] text-[#006c49] font-semibold">● OpenStreetMap Tile Layer</span>
              </div>
              <InteractiveLeafletMap
                place={filteredWorldPlaces[0]}
                height="450px"
                onSelectNearby={(n) => {
                  onShowToast(`Selected nearby spot: ${n.name} (${n.distanceText})`);
                }}
                onAddToItinerary={(n) => {
                  const act = placeToItineraryActivity(n as NearbyPlace);
                  if (onAddActivity) onAddActivity(act);
                  onShowToast(`✓ Added "${n.name}" to trip schedule!`);
                }}
              />
            </div>
          )}

          {/* CARDS VIEW: All World Places with Nearby Attractions */}
          {viewLayout === 'cards' && (
            <div className="px-4 space-y-4">
              {filteredWorldPlaces.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#e2e8f0] space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#e0f2fe] text-[#006194] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">travel_explore</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#131b2e]">
                      No preloaded destination found for "{searchQuery}"
                    </h3>
                    <p className="text-xs text-[#64748b] max-w-sm mx-auto mt-1">
                      Our universal AI geographer can fetch full details and all nearby places for ANY location worldwide!
                    </p>
                  </div>
                  <button
                    onClick={() => handlePerformUniversalSearch()}
                    disabled={isSearchingOnline}
                    className="px-4 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs hover:bg-[#007bb9] active:scale-95 transition-all inline-flex items-center gap-1.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    <span>Generate Full Guide for "{searchQuery}"</span>
                  </button>
                </div>
              ) : (
                filteredWorldPlaces.map((place) => {
                  const isAdded = addedPlaces[place.id];

                  return (
                    <div
                      key={place.id}
                      onClick={() => handleOpenPlaceDetails(place)}
                      className="group bg-white rounded-3xl border border-[#e2e8f0] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-3 pb-3"
                    >
                      {/* Hero Image Container */}
                      <div className="relative h-48 w-full overflow-hidden bg-[#eaedff]">
                        <img
                          src={place.heroImage}
                          alt={place.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />

                        {/* Badges on Hero */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
                            <span>{place.flagEmoji}</span>
                            <span>{place.country}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#006194] text-white text-[10px] font-bold">
                            {place.continent}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold border border-white/20 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                            <span>{place.rating}</span>
                          </span>
                        </div>

                        {/* Title and tagline on image */}
                        <div className="absolute bottom-3 inset-x-3 text-white">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                            {place.category}
                          </span>
                          <h3 className="text-lg font-black leading-tight drop-shadow-sm">
                            {place.name}
                          </h3>
                          <p className="text-white/80 text-[11px] line-clamp-1 mt-0.5">{place.tagline}</p>
                        </div>
                      </div>

                      {/* Travel Highlights & Quick Stats */}
                      <div className="px-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-[#64748b]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[#006194]">payments</span>
                            <span>~${place.avgDailyCostUsd} / day</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-amber-600">calendar_month</span>
                            <span className="truncate max-w-[150px]">{place.bestTimeToVisit.split('(')[0]}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-purple-600">near_me</span>
                            <span className="font-bold text-[#006194]">
                              {place.nearbyPlaces.length} Nearby Spots
                            </span>
                          </span>
                        </div>

                        {/* "ALL THINGS NEAR THAT PLACE USER CAN GO" PREVIEW STRIP */}
                        <div className="p-2.5 rounded-2xl bg-[#faf8ff] border border-[#e2e8f0]/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#006194] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[15px]">explore_nearby</span>
                              <span>Things Near {place.city} You Can Go:</span>
                            </span>
                            <span className="text-[10px] font-bold text-[#64748b] hover:text-[#006194]">
                              View all ({place.nearbyPlaces.length}) →
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {place.nearbyPlaces.slice(0, 2).map((near) => (
                              <div
                                key={near.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlace(place);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="p-2 rounded-xl bg-white border border-[#e2e8f0] flex items-center gap-2 hover:border-[#006194] transition-all"
                              >
                                <img
                                  src={near.image}
                                  alt={near.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-bold text-[#131b2e] truncate">
                                    {near.name}
                                  </p>
                                  <p className="text-[10px] text-[#006194] font-semibold truncate">
                                    📍 {near.distanceText}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPlaceDetails(place);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#f2f3ff] text-[#006194] text-xs font-bold hover:bg-[#e0f2fe] transition-all flex items-center justify-center gap-1"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>Full Details & Nearby Spots</span>
                          </button>

                          <button
                            onClick={(e) => handleAddPlaceToItinerary(place, e)}
                            disabled={isAdded}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              isAdded
                                ? 'bg-[#006c49]/15 text-[#006c49]'
                                : 'bg-[#006194] text-white hover:bg-[#007bb9] active:scale-95 shadow-2xs'
                            }`}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isAdded ? 'check' : 'add'}
                            </span>
                            <span>{isAdded ? 'Added' : '+ Itinerary'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* INDIA HERITAGE PLACES SECTION */}
      {/* ======================================================== */}
      {explorerMode === 'india' && (
        <div className="space-y-4 px-4">
          {/* Indian Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['All', 'Monuments', 'Forts & Palaces', 'Spiritual & Ghats', 'Nature & Backwaters', 'Beaches & Coastal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setIndianCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  indianCategory === cat
                    ? 'bg-[#006194] text-white shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0]'
                }`}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Indian Place Cards */}
          <div className="space-y-3">
            {filteredIndianPlaces.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs flex gap-3 hover:shadow-md transition-all"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-24 h-24 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-[#131b2e] leading-snug truncate">
                        {p.name}
                      </h4>
                      <span className="text-[11px] font-bold text-amber-600 shrink-0">
                        ★ {p.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#006194] font-semibold mt-0.5">
                      📍 {p.city}, {p.state}
                    </p>
                    <p className="text-[11px] text-[#64748b] line-clamp-2 mt-1 leading-tight">
                      {p.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] mt-2">
                    <span className="text-[10px] text-[#64748b]">
                      ⏱ {p.duration} • {p.entryFee}
                    </span>
                    <button
                      onClick={() => {
                        const act: ItineraryActivity = {
                          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                          day: 3,
                          timeSlot: '10:00 - 12:00',
                          title: p.name,
                          status: 'upcoming',
                          category: p.category,
                          location: `${p.city}, ${p.state}`,
                          cost: p.entryFee,
                          image: p.image,
                          tags: p.tags,
                          advisory: p.highlight,
                        };
                        if (onAddActivity) onAddActivity(act);
                        onShowToast(`✓ Added "${p.name}" to trip schedule!`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#006194] text-white text-[10px] font-bold shadow-2xs hover:bg-[#007bb9]"
                      type="button"
                    >
                      + Add to Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* FULL DETAILS MODAL FOR WORLD PLACE & NEARBY SPOTS */}
      {/* ======================================================== */}
      <WorldPlaceDetailsModal
        place={selectedPlace}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onShowToast={onShowToast}
        onAddActivity={onAddActivity}
        onSelectAsActiveTrip={onSelectTripDestination}
      />
    </div>
  );
}
