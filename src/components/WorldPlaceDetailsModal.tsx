import React, { useState, useEffect } from 'react';
import { WorldPlace, NearbyPlace, ItineraryActivity } from '../types';
import { InteractiveLeafletMap } from './InteractiveLeafletMap';
import {
  placeToItineraryActivity,
  toggleBookmarkedPlace,
  getBookmarkedPlaceIds,
} from '../utils/worldPlacesApi';
import { formatDistanceSummary, getCurrentGpsPosition } from '../utils/geoUtils';

interface WorldPlaceDetailsModalProps {
  place: WorldPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onAddActivity?: (act: ItineraryActivity) => void;
  onSelectAsActiveTrip?: (place: WorldPlace) => void;
}

type DetailTab = 'overview' | 'food' | 'transit' | 'safety' | 'near' | 'map';

export const WorldPlaceDetailsModal: React.FC<WorldPlaceDetailsModalProps> = ({
  place,
  isOpen,
  onClose,
  onShowToast,
  onAddActivity,
  onSelectAsActiveTrip,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [selectedNearby, setSelectedNearby] = useState<NearbyPlace | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => getBookmarkedPlaceIds());
  const [addedNearbyIds, setAddedNearbyIds] = useState<{ [id: string]: boolean }>({});
  const [nearCategoryFilter, setNearCategoryFilter] = useState<string>('All');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Read GPS coordinates on open if permitted
  useEffect(() => {
    if (isOpen) {
      getCurrentGpsPosition()
        .then((pos) => setUserCoords(pos))
        .catch(() => {
          // Default to New Delhi coordinates
          setUserCoords({ lat: 28.6139, lng: 77.209 });
        });
    }
  }, [isOpen]);

  if (!isOpen || !place) return null;

  const isBookmarked = bookmarkedIds.includes(place.id);

  const handleToggleBookmark = () => {
    const next = toggleBookmarkedPlace(place.id);
    setBookmarkedIds(next);
    onShowToast(
      next.includes(place.id)
        ? `Bookmarked ${place.name} to wishlist!`
        : `Removed ${place.name} from bookmarks.`
    );
  };

  const handleAddNearbyToItinerary = (nearby: NearbyPlace) => {
    setAddedNearbyIds((prev) => ({ ...prev, [nearby.id]: true }));
    if (onAddActivity) {
      const act = placeToItineraryActivity(nearby);
      onAddActivity(act);
      onShowToast(`✓ Added "${nearby.name}" (${nearby.distanceText}) to Day 3 itinerary!`);
    } else {
      onShowToast(`✓ "${nearby.name}" saved to your trip!`);
    }
  };

  const handleAddMainPlaceToItinerary = () => {
    if (onAddActivity) {
      const act = placeToItineraryActivity(place);
      onAddActivity(act);
      onShowToast(`✓ Added destination stop "${place.name}" to trip schedule!`);
    }
  };

  const handleShareLocation = () => {
    const shareText = `📍 ${place.name} (${place.city}, ${place.country})\nCoordinates: ${place.coordinates.lat}, ${place.coordinates.lng}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      onShowToast('✓ Location info & Google Maps link copied to clipboard!');
    } else {
      onShowToast(`Coordinates: ${place.coordinates.lat}, ${place.coordinates.lng}`);
    }
  };

  // Distance computation from user
  const distanceInfo = userCoords
    ? formatDistanceSummary(
        userCoords.lat,
        userCoords.lng,
        place.coordinates.lat,
        place.coordinates.lng
      )
    : null;

  const filteredNearby =
    nearCategoryFilter === 'All'
      ? place.nearbyPlaces
      : place.nearbyPlaces.filter((n) => n.category === nearCategoryFilter);

  const nearCategories = [
    'All',
    'Attraction',
    'Food & Dining',
    'Nature & Scenery',
    'Culture & Temple',
    'Day Trip',
  ];

  // Fallback defaults for rich fields if not explicitly specified
  const foodList = place.foodSpecialties || [
    'Artisanal Local Pastries & Coffee',
    'Regional Specialties & Stews',
    'Fresh Market Street Food',
    'Traditional Handcrafted Desserts',
  ];

  const transitInfo = place.transitGuide || {
    airportTransfer: `Major international airport located within 45–60 minutes of ${place.city}.`,
    metroBus: `Public bus routes and regional trains run frequently throughout ${place.city}.`,
    taxisRideshare: 'Licensed metered taxis, Uber, and local ride-hail apps are accessible.',
    walkabilityScore: '85/100 (Pedestrian promenades and historic plazas).',
  };

  const emergencyInfo = place.emergencyGuide || {
    police: '112 / 999 (Emergency Hotline)',
    ambulance: '112 / 911 (Medical Emergency)',
    touristHelpline: 'Local Tourist Assistance Available 24/7',
    safeZones: 'Central historic districts and monitored hotel corridors are well-patrolled and safe.',
  };

  const practicalInfo = place.practicalEssentials || {
    powerPlug: 'Type C / F (Standard 230V / 50Hz)',
    voltage: '230V',
    tapWaterSafe: true,
    tapWaterNote: 'Tap water meets regional standards; bottled water widely available.',
    tippingNorm: '10% in cafes and sit-down dining is customary.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-[92vh] sm:h-[88vh] flex flex-col bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        {/* Sticky Header with Hero Image */}
        <div className="relative h-60 w-full shrink-0 overflow-hidden bg-[#eaedff]">
          <img
            src={place.heroImage}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />

          {/* Top Controls */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-sm">
              <span>{place.flagEmoji}</span>
              <span>{place.country}</span>
              <span className="text-white/60">•</span>
              <span>{place.continent}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareLocation}
                title="Share Location"
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 border border-white/20 transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[19px]">share</span>
              </button>

              <button
                onClick={handleToggleBookmark}
                title="Bookmark Destination"
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 border border-white/20 transition-all active:scale-95"
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isBookmarked ? { fontVariationSettings: "'FILL' 1", color: '#f59e0b' } : undefined}
                >
                  {isBookmarked ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 border border-white/20 transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Bottom Title Bar inside Hero */}
          <div className="absolute bottom-3 inset-x-4 z-10 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-[#006194] text-white text-[10px] font-bold uppercase tracking-wider">
                {place.category}
              </span>
              <span className="flex items-center text-amber-300 text-xs font-bold">
                <span className="material-symbols-outlined text-[15px] mr-0.5 fill-current">star</span>
                {place.rating} ({place.reviewsCount} reviews)
              </span>
              {distanceInfo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-sky-200 font-semibold border border-white/20">
                  📍 {distanceInfo.text}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight tracking-tight drop-shadow-md">
              {place.name}
            </h1>
            <p className="text-white/85 text-xs mt-0.5 line-clamp-1">{place.tagline}</p>
          </div>
        </div>

        {/* 6 Tabs for "All Things" */}
        <div className="flex border-b border-[#e2e8f0] bg-[#faf8ff] px-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">info</span>
            <span>Story &amp; Sights</span>
          </button>

          <button
            onClick={() => setActiveTab('food')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'food'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">restaurant</span>
            <span>Food &amp; Dining</span>
          </button>

          <button
            onClick={() => setActiveTab('transit')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'transit'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">directions_subway</span>
            <span>Transit &amp; Getting Around</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'safety'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">shield</span>
            <span>Safety &amp; Essentials</span>
          </button>

          <button
            onClick={() => setActiveTab('near')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'near'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">explore_nearby</span>
            <span>Nearby ({place.nearbyPlaces.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1 border-b-2 transition-all shrink-0 ${
              activeTab === 'map'
                ? 'border-[#006194] text-[#006194]'
                : 'border-transparent text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">map</span>
            <span>Interactive Map</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8ff]">
          {/* TAB 1: OVERVIEW & STORY */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Travel Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#006194] mb-1">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">Daily Budget</span>
                  </div>
                  <p className="text-sm font-bold text-[#131b2e]">~${place.avgDailyCostUsd} / day</p>
                  <p className="text-[10px] text-[#64748b]">{place.currency}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">Best Season</span>
                  </div>
                  <p className="text-xs font-bold text-[#131b2e] leading-snug line-clamp-2">{place.bestTimeToVisit}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <span className="material-symbols-outlined text-[18px]">translate</span>
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">Language</span>
                  </div>
                  <p className="text-xs font-bold text-[#131b2e] truncate">{place.language}</p>
                  <p className="text-[10px] text-[#64748b] truncate">{place.timezone}</p>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs">
                  <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                    <span className="material-symbols-outlined text-[18px]">shield</span>
                    <span className="text-[10px] uppercase font-bold text-[#64748b]">Safety</span>
                  </div>
                  <p className="text-xs font-bold text-[#131b2e] truncate">{place.safetyRating.split('(')[0]}</p>
                  <p className="text-[10px] text-[#006c49] font-semibold">Verified</p>
                </div>
              </div>

              {/* Live Distance & Navigation Bar */}
              {distanceInfo && (
                <div className="p-3 rounded-2xl bg-[#e0f2fe] border border-[#bae6fd] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006194] text-[20px]">
                      near_me
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#006194]">
                        {distanceInfo.text}
                      </p>
                      <p className="text-[10px] text-[#0369a1]">
                        Coordinates: {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white text-[#006194] text-[11px] font-bold border border-[#bae6fd] shadow-2xs hover:bg-[#f0f9ff] flex items-center gap-1 shrink-0"
                  >
                    <span>Google Maps</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              )}

              {/* Overview & Cultural Description */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#006194] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>About &amp; Traveler Story</span>
                </h3>
                <p className="text-xs text-[#3f4850] leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {place.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full bg-[#f2f3ff] text-[#006194] text-[10px] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Top Highlights */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#006194] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>Why Visit — Standout Highlights</span>
                </h3>
                <div className="space-y-2">
                  {place.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#131b2e]">
                      <span className="w-5 h-5 rounded-full bg-[#e0f2fe] text-[#006194] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-snug">{hl}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Climate & Weather Advisory */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">partly_cloudy_day</span>
                  <span>Climate &amp; Weather Profile</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  {place.weatherSummary}
                </p>
                {place.liveWeather && (
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white/70">
                      <span className="text-[10px] text-[#64748b] block">Current</span>
                      <span className="font-bold text-[#131b2e]">{place.liveWeather.tempC}°C</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70">
                      <span className="text-[10px] text-[#64748b] block">Condition</span>
                      <span className="font-bold text-[#131b2e]">{place.liveWeather.condition}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70">
                      <span className="text-[10px] text-[#64748b] block">Rain Chance</span>
                      <span className="font-bold text-sky-700">{place.liveWeather.rainChancePct}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/70">
                      <span className="text-[10px] text-[#64748b] block">Sunrise / Set</span>
                      <span className="font-bold text-[#131b2e]">{place.liveWeather.sunriseTime}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Practical Insider Tips */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-2.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#006194] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">tips_and_updates</span>
                  <span>Must-Know Traveler Tips</span>
                </h3>
                <div className="space-y-2">
                  {place.practicalTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#475569]">
                      <span className="material-symbols-outlined text-[16px] text-[#006c49] shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <p className="leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FOOD & DINING */}
          {activeTab === 'food' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <span className="material-symbols-outlined text-[20px]">restaurant</span>
                  <span className="text-sm">Signature Culinary Dishes in {place.name}</span>
                </div>
                <p className="text-xs text-[#64748b]">
                  Authentic local dishes, street eats, and gourmet treats you must taste here:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {foodList.map((dish, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0] flex items-center gap-3"
                    >
                      <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                        🍽️
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#131b2e] block leading-snug">
                          {dish}
                        </span>
                        <span className="text-[10px] text-[#64748b]">Must-try specialty</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dining & Tipping Etiquette */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#006194]">receipt_long</span>
                  <span>Dining Customs &amp; Tipping</span>
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {practicalInfo.tippingNorm}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#006c49] font-medium pt-1">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Vegetarian, vegan, and dietary options are widely served in central cafes.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSIT & GETTING AROUND */}
          {activeTab === 'transit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="material-symbols-outlined text-[20px]">directions_bus</span>
                  <span className="text-sm">Transit &amp; Commuting Guide</span>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0] space-y-1">
                    <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">flight_land</span>
                      <span>Airport Connections</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed">{transitInfo.airportTransfer}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0] space-y-1">
                    <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">subway</span>
                      <span>Metro, Ferries &amp; Buses</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed">{transitInfo.metroBus}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0] space-y-1">
                    <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">local_taxi</span>
                      <span>Taxis &amp; Ride-Hailing</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed">{transitInfo.taxisRideshare}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#e2e8f0] space-y-1">
                    <span className="text-xs font-bold text-[#131b2e] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">directions_walk</span>
                      <span>Walkability Score</span>
                    </span>
                    <p className="text-xs text-[#475569] leading-relaxed">{transitInfo.walkabilityScore}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SAFETY, EMERGENCY & ESSENTIALS */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                  <span className="material-symbols-outlined text-[20px]">emergency</span>
                  <span className="text-sm">Safety Hotlines &amp; Emergency Protocols</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-[10px] font-bold text-red-800 uppercase block">Police Hotline</span>
                    <span className="text-base font-black text-red-900">{emergencyInfo.police}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <span className="text-[10px] font-bold text-red-800 uppercase block">Ambulance</span>
                    <span className="text-base font-black text-red-900">{emergencyInfo.ambulance}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-1">
                  <span className="font-bold text-[#131b2e]">Tourist Helpline &amp; Safe Corridors:</span>
                  <p className="text-[#475569] leading-relaxed">{emergencyInfo.safeZones}</p>
                </div>
              </div>

              {/* Practical Essentials Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#006194]">
                  Everyday Practical Essentials
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] block font-semibold">Electrical Socket</span>
                    <span className="font-bold text-[#131b2e]">{practicalInfo.powerPlug}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] block font-semibold">Tap Water</span>
                    <span className={`font-bold ${practicalInfo.tapWaterSafe ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {practicalInfo.tapWaterSafe ? 'Safe to Drink' : 'Bottled Recommended'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748b] italic">
                  💡 {practicalInfo.tapWaterNote}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: THINGS NEAR HERE */}
          {activeTab === 'near' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-[#131b2e] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#006194] text-[20px]">explore_nearby</span>
                    <span>Things Near {place.name} You Can Go</span>
                  </h2>
                  <p className="text-[11px] text-[#64748b]">
                    Attractions, food, viewpoints &amp; day trips sorted by distance
                  </p>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {nearCategories.map((cat) => {
                  const isActive = nearCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setNearCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? 'bg-[#006194] text-white shadow-xs'
                          : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:text-[#131b2e]'
                      }`}
                      type="button"
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* List of Nearby Spots */}
              <div className="space-y-3">
                {filteredNearby.map((spot) => {
                  const isAdded = addedNearbyIds[spot.id];
                  const isSelected = selectedNearby?.id === spot.id;

                  return (
                    <div
                      key={spot.id}
                      className={`p-3.5 rounded-2xl bg-white border transition-all shadow-2xs hover:shadow-md ${
                        isSelected
                          ? 'border-[#006194] ring-2 ring-[#006194]/20'
                          : 'border-[#e2e8f0]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-[#eaedff]">
                          <img
                            src={spot.image}
                            alt={spot.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold">
                            {spot.category}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-bold text-[#131b2e] leading-snug line-clamp-1">
                                {spot.name}
                              </h4>
                              <span className="text-[11px] font-bold text-amber-600 shrink-0 flex items-center">
                                ★ {spot.rating}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#006194] font-semibold mt-0.5">
                              📍 {spot.distanceText}
                            </p>
                            <p className="text-[11px] text-[#64748b] line-clamp-2 mt-1 leading-tight">
                              {spot.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] mt-2">
                            <span className="text-[10px] text-[#64748b] font-medium">
                              ⏱ {spot.estDuration} • {spot.estCost}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedNearby(spot);
                                  setActiveTab('map');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#f2f3ff] text-[#006194] text-[10px] font-bold hover:bg-[#e0f2fe] transition-all"
                                type="button"
                              >
                                View on Map
                              </button>

                              <button
                                onClick={() => handleAddNearbyToItinerary(spot)}
                                disabled={isAdded}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  isAdded
                                    ? 'bg-[#006c49]/15 text-[#006c49]'
                                    : 'bg-[#006194] text-white hover:bg-[#007bb9] active:scale-95 shadow-2xs'
                                }`}
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  {isAdded ? 'check' : 'add'}
                                </span>
                                <span>{isAdded ? 'Added' : 'Add to Plan'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: INTERACTIVE MAP */}
          {activeTab === 'map' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#006194]">
                    Interactive Map: {place.name} &amp; Hotspots
                  </h3>
                  <p className="text-[11px] text-[#64748b]">
                    Live pins connect destination to all nearby attractions with distance rings
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-white border border-[#e2e8f0] text-[10px] font-mono text-[#475569]">
                  {place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}
                </span>
              </div>

              <InteractiveLeafletMap
                place={place}
                selectedNearby={selectedNearby}
                onSelectNearby={(n) => setSelectedNearby(n)}
                onAddToItinerary={(n) => handleAddNearbyToItinerary(n as NearbyPlace)}
                height="440px"
              />

              {/* Map Legend */}
              <div className="p-3 rounded-xl bg-white border border-[#e2e8f0] text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#64748b] block">Map Pin Legend:</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006194]" /> Main Destination
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Attraction
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Food &amp; Dining
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Nature &amp; Views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Culture
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /> Day Trip
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Persistent Action Bar */}
        <div className="p-3 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleAddMainPlaceToItinerary}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs hover:bg-[#007bb9] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add to Itinerary</span>
          </button>

          {onSelectAsActiveTrip && (
            <button
              onClick={() => {
                onSelectAsActiveTrip(place);
                onShowToast(`🎯 Set active trip destination to ${place.name}!`);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-[#e0f2fe] text-[#006194] text-xs font-bold hover:bg-[#bae6fd] active:scale-95 transition-all flex items-center gap-1 shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">flight_takeoff</span>
              <span>Set as Active Trip</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
