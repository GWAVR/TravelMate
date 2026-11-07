import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { NearbyPlace, WorldPlace, HotelLodging } from '../types';
import { MAHARASHTRA_PLACES } from '../data/maharashtraPlacesData';
import { MAHARASHTRA_HOTELS } from '../data/maharashtraHotelsData';

interface InteractiveLeafletMapProps {
  place?: WorldPlace;
  allPlaces?: WorldPlace[];
  allHotels?: HotelLodging[];
  statewideMode?: boolean;
  selectedNearby?: NearbyPlace | null;
  onSelectNearby?: (nearby: NearbyPlace) => void;
  onSelectPlace?: (place: WorldPlace) => void;
  onSelectHotel?: (hotel: HotelLodging) => void;
  onAddToItinerary?: (item: any) => void;
  height?: string;
  showAllLines?: boolean;
  activeFilter?: string;
}

export const InteractiveLeafletMap: React.FC<InteractiveLeafletMapProps> = ({
  place,
  allPlaces = MAHARASHTRA_PLACES,
  allHotels = MAHARASHTRA_HOTELS,
  statewideMode = false,
  selectedNearby,
  onSelectNearby,
  onSelectPlace,
  onSelectHotel,
  onAddToItinerary,
  height = '100%',
  showAllLines = true,
  activeFilter = 'All',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [, setMapLoaded] = useState(false);

  // Category color mapping
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Attraction':
      case 'Monuments':
      case 'Forts & Palaces':
        return '#f59e0b'; // Amber
      case 'Food & Dining':
        return '#10b981'; // Emerald
      case 'Nature & Scenery':
      case 'Beaches & Coastal':
        return '#0284c7'; // Sky
      case 'Culture & Temple':
      case 'Spiritual & Ghats':
        return '#8b5cf6'; // Violet
      case 'Wildlife & Hills':
        return '#15803d'; // Forest Green
      case 'Hotel':
      case 'MTDC Resort':
        return '#dc2626'; // Red / Hotel Pin
      default:
        return '#006194'; // Primary Blue
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const centerLat = place ? place.coordinates.lat : 19.7515;
      const centerLng = place ? place.coordinates.lng : 75.7139;
      const initialZoom = statewideMode ? 7 : (place ? 12 : 7);

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // OpenStreetMap high quality tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '© OpenStreetMap • Maharashtra',
        })
        .addTo(map);

      // Custom zoom control
      L.control
        .zoom({
          position: 'topright',
        })
        .addTo(map);

      polylineLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setMapLoaded(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center, markers, and route lines when place or nearby changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers and lines
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    if (polylineLayerRef.current) {
      polylineLayerRef.current.clearLayers();
    }

    if (statewideMode || !place) {
      // ==================== STATEWIDE ALL MAHARASHTRA MAP ====================
      const bounds = L.latLngBounds([[15.8, 72.6], [22.0, 80.8]]);

      // Filter places
      const filteredPlaces = allPlaces.filter((p) => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Hotels') return false;
        if (activeFilter === 'Forts') return p.category.includes('Fort') || p.category.includes('Monument');
        if (activeFilter === 'Caves') return p.category.includes('Caves') || p.name.includes('Cave') || p.tags.includes('Caves');
        if (activeFilter === 'Beaches') return p.category.includes('Beach') || p.tags.includes('Beach');
        if (activeFilter === 'Hills') return p.category.includes('Hill') || p.tags.includes('Hill Station');
        if (activeFilter === 'Wildlife') return p.category.includes('Wildlife') || p.tags.includes('Tiger');
        if (activeFilter === 'Temples') return p.category.includes('Spiritual') || p.tags.includes('Temple') || p.tags.includes('Jyotirlinga');
        return true;
      });

      // 1. Plot Maharashtra District Destinations
      filteredPlaces.forEach((p) => {
        const pLat = p.coordinates.lat;
        const pLng = p.coordinates.lng;
        bounds.extend([pLat, pLng]);

        const color = getCategoryColor(p.category);
        const iconHtml = `
          <div class="relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer">
            <div style="background-color: ${color};" class="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold">
              ★
            </div>
          </div>
        `;

        const divIcon = L.divIcon({
          className: `custom-mh-pin-${p.id}`,
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([pLat, pLng], { icon: divIcon }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.style.minWidth = '220px';
        popupContent.style.fontFamily = 'inherit';
        popupContent.className = 'text-xs p-1';
        popupContent.innerHTML = `
          <div style="border-radius: 8px; overflow: hidden; margin-bottom: 6px;">
            <img src="${p.heroImage}" alt="${p.name}" style="width: 100%; height: 80px; object-fit: cover;" />
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <strong style="color: #006194; font-size: 13px; font-weight: 700;">${p.name}</strong>
            <span style="font-weight: bold; color: #b45309; font-size: 11px;">★ ${p.rating}</span>
          </div>
          <p style="color: #64748b; font-size: 10px; margin: 0 0 4px 0;">
            📍 ${p.district || p.city}, Maharashtra • ${p.category}
          </p>
          <p style="color: #006c49; font-size: 11px; font-weight: 600; margin: 0 0 6px 0;">
            Entry / Exp: ₹${p.avgDailyCostUsd ? p.avgDailyCostUsd * 80 : 50} approx
          </p>
          <div style="display: flex; gap: 4px;">
            <button id="btn-add-mh-${p.id}" style="flex: 1; background: #006194; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">
              + Add to Itinerary
            </button>
            <button id="btn-view-mh-${p.id}" style="background: #e2e8f0; color: #1e293b; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">
              Focus
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const btnAdd = document.getElementById(`btn-add-mh-${p.id}`);
          if (btnAdd) {
            btnAdd.onclick = () => {
              if (onAddToItinerary) onAddToItinerary(p);
            };
          }
          const btnView = document.getElementById(`btn-view-mh-${p.id}`);
          if (btnView) {
            btnView.onclick = () => {
              if (onSelectPlace) onSelectPlace(p);
            };
          }
        });

        markersRef.current[p.id] = marker;
      });

      // 2. Plot Hotels & MTDC Resorts
      if (activeFilter === 'All' || activeFilter === 'Hotels') {
        allHotels.forEach((h) => {
          const hLat = h.coordinates.lat;
          const hLng = h.coordinates.lng;
          bounds.extend([hLat, hLng]);

          const hotelIconHtml = `
            <div class="relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer">
              <div class="w-6 h-6 rounded-full bg-[#dc2626] text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                🏨
              </div>
            </div>
          `;

          const hotelDivIcon = L.divIcon({
            className: `custom-hotel-pin-${h.id}`,
            html: hotelIconHtml,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            popupAnchor: [0, -14],
          });

          const hotelMarker = L.marker([hLat, hLng], { icon: hotelDivIcon }).addTo(map);

          const minRate = (h.roomTypes && h.roomTypes[0]?.pricePerNightInr) || h.pricePerNightInr || 2800;

          const hotelPopup = document.createElement('div');
          hotelPopup.style.minWidth = '220px';
          hotelPopup.style.fontFamily = 'inherit';
          hotelPopup.className = 'text-xs p-1';
          hotelPopup.innerHTML = `
            <div style="border-radius: 8px; overflow: hidden; margin-bottom: 6px;">
              <img src="${h.image}" alt="${h.name}" style="width: 100%; height: 75px; object-fit: cover;" />
            </div>
            <strong style="color: #dc2626; font-size: 12px; font-weight: 700; display: block; margin-bottom: 2px;">${h.name}</strong>
            <p style="color: #64748b; font-size: 10px; margin: 0 0 4px 0;">
              📍 ${h.city}, ${h.district} • ${h.mtdcCertified ? 'MTDC Certified' : h.type}
            </p>
            <p style="color: #006c49; font-size: 11px; font-weight: 700; margin: 0 0 6px 0;">
              From ₹${minRate.toLocaleString('en-IN')}/night
            </p>
            <button id="btn-hotel-${h.id}" style="width: 100%; background: #006194; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">
              Book Reservation
            </button>
          `;

          hotelMarker.bindPopup(hotelPopup);

          hotelMarker.on('popupopen', () => {
            const btn = document.getElementById(`btn-hotel-${h.id}`);
            if (btn) {
              btn.onclick = () => {
                if (onSelectHotel) onSelectHotel(h);
              };
            }
          });

          markersRef.current[`hotel-${h.id}`] = hotelMarker;
        });
      }

      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
      return;
    }

    // ==================== SINGLE PLACE + NEARBY SPOTS MODE ====================
    const { lat, lng } = place.coordinates;

    // 1. Destination Main Marker
    const mainIconHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-10 h-10 rounded-full bg-[#006194]/25 animate-ping"></span>
        <div class="w-8 h-8 rounded-full bg-[#006194] text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
          ★
        </div>
      </div>
    `;

    const mainDivIcon = L.divIcon({
      className: 'custom-main-pin',
      html: mainIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const mainMarker = L.marker([lat, lng], { icon: mainDivIcon }).addTo(map);
    mainMarker.bindPopup(`
      <div style="min-width: 180px; font-family: sans-serif; font-size: 12px; padding: 2px;">
        <strong style="color: #006194; font-size: 13px; display: block; margin-bottom: 2px;">${place.name}</strong>
        <p style="margin: 0 0 6px 0; color: #475569; font-size: 11px;">${place.city}, ${place.country}</p>
        <span style="display: inline-block; background: #e0f2fe; color: #006194; padding: 2px 6px; border-radius: 999px; font-size: 10px; font-weight: bold;">
          ${place.category}
        </span>
      </div>
    `);
    markersRef.current['main'] = mainMarker;

    // 2. Nearby markers and connecting lines
    const bounds = L.latLngBounds([[lat, lng]]);

    const filteredNearby =
      activeCategoryFilter === 'All'
        ? (place.nearbyPlaces || [])
        : (place.nearbyPlaces || []).filter((n) => n.category === activeCategoryFilter);

    filteredNearby.forEach((nearby) => {
      const nLat = nearby.coordinates.lat;
      const nLng = nearby.coordinates.lng;
      const color = getCategoryColor(nearby.category);

      bounds.extend([nLat, nLng]);

      if (showAllLines && polylineLayerRef.current) {
        const polyline = L.polyline(
          [
            [lat, lng],
            [nLat, nLng],
          ],
          {
            color: color,
            weight: 2,
            opacity: 0.6,
            dashArray: '4, 6',
          }
        );
        polylineLayerRef.current.addLayer(polyline);
      }

      const isSelected = selectedNearby?.id === nearby.id;
      const nearbyIconHtml = `
        <div class="relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
          isSelected ? 'scale-125' : ''
        }">
          <div style="background-color: ${color};" class="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white text-[10px] font-bold">
            •
          </div>
          ${
            isSelected
              ? `<span style="border-color: ${color}" class="absolute -inset-1 rounded-full border-2 animate-pulse"></span>`
              : ''
          }
        </div>
      `;

      const nearbyDivIcon = L.divIcon({
        className: `custom-nearby-pin-${nearby.id}`,
        html: nearbyIconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([nLat, nLng], { icon: nearbyDivIcon }).addTo(map);

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '200px';
      popupContent.style.fontFamily = 'inherit';
      popupContent.className = 'text-xs p-1';
      popupContent.innerHTML = `
        <div style="border-radius: 8px; overflow: hidden; margin-bottom: 6px;">
          <img src="${nearby.image}" alt="${nearby.name}" style="width: 100%; height: 75px; object-fit: cover;" />
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #131b2e; font-size: 12px; font-weight: 700; line-height: 1.2;">${nearby.name}</strong>
          <span style="font-weight: bold; color: ${color}; font-size: 10px; background: #f1f5f9; padding: 1px 6px; border-radius: 999px;">
            ★ ${nearby.rating}
          </span>
        </div>
        <p style="color: #64748b; font-size: 10px; margin: 0 0 6px 0; line-height: 1.3;">
          📍 ${nearby.distanceText} • ${nearby.estDuration}
        </p>
        <div style="display: flex; gap: 4px;">
          <button id="btn-add-${nearby.id}" style="flex: 1; background: #006194; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; font-weight: bold; cursor: pointer;">
            + Add to Itinerary
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-add-${nearby.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onAddToItinerary) onAddToItinerary(nearby);
          };
        }
        if (onSelectNearby) onSelectNearby(nearby);
      });

      marker.on('click', () => {
        if (onSelectNearby) onSelectNearby(nearby);
      });

      markersRef.current[nearby.id] = marker;
    });

    if (filteredNearby.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    } else {
      map.flyTo([lat, lng], 13);
    }
  }, [place, activeCategoryFilter, statewideMode, activeFilter]);

  // When selected nearby changes from outside, open its popup and center
  useEffect(() => {
    if (!selectedNearby || !mapInstanceRef.current) return;
    const marker = markersRef.current[selectedNearby.id];
    if (marker) {
      mapInstanceRef.current.flyTo(
        [selectedNearby.coordinates.lat, selectedNearby.coordinates.lng],
        15,
        { animate: true, duration: 0.8 }
      );
      marker.openPopup();
    }
  }, [selectedNearby]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (place) {
      mapInstanceRef.current.flyTo([place.coordinates.lat, place.coordinates.lng], 13, {
        animate: true,
        duration: 0.8,
      });
    } else {
      mapInstanceRef.current.flyTo([19.7515, 75.7139], 7, {
        animate: true,
        duration: 0.8,
      });
    }
  };

  const categories = ['All', 'Attraction', 'Food & Dining', 'Nature & Scenery', 'Culture & Temple', 'Day Trip'];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm bg-[#eaedff]">
      {/* Category Pills Overlay on Top of Map */}
      {!statewideMode && place && (
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-60px)] no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isActive = activeCategoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs backdrop-blur-md shrink-0 ${
                  isActive
                    ? 'bg-[#006194] text-white shadow-md scale-105'
                    : 'bg-white/90 text-[#131b2e] hover:bg-white border border-[#e2e8f0]'
                }`}
                type="button"
              >
                {cat === 'All' ? `All Spots (${place.nearbyPlaces?.length || 0})` : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        title="Center on Destination"
        className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-white/95 text-[#006194] text-xs font-bold shadow-md hover:bg-white border border-[#e2e8f0] flex items-center gap-1.5 active:scale-95 transition-all"
        type="button"
      >
        <span className="material-symbols-outlined text-[16px]">my_location</span>
        <span>{place ? `Center ${place.city}` : 'Center Maharashtra'}</span>
      </button>

      {/* Map Container */}
      <div ref={mapContainerRef} style={{ height }} className="w-full" />
    </div>
  );
};
