import { WorldPlace, NearbyPlace, TripDestination } from '../types';

/**
 * Calculates great-circle distance between two points in km (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates compass bearing from point 1 to point 2
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return directions[Math.round(brng / 45)];
}

/**
 * Returns user-friendly distance and flight/transit estimate
 */
export function formatDistanceSummary(
  userLat: number,
  userLng: number,
  destLat: number,
  destLng: number
): { distanceKm: number; text: string; transitEstimate: string } {
  const distanceKm = calculateDistanceKm(userLat, userLng, destLat, destLng);
  const bearing = calculateBearing(userLat, userLng, destLat, destLng);

  let transitEstimate = '';
  if (distanceKm < 2) {
    transitEstimate = `${Math.round(distanceKm * 12)} min walk`;
  } else if (distanceKm < 15) {
    transitEstimate = `${Math.round(distanceKm * 3)} min drive / taxi`;
  } else if (distanceKm < 300) {
    transitEstimate = `${Math.round(distanceKm / 75)}h train / drive`;
  } else {
    const flightHrs = Math.max(1, Math.round(distanceKm / 750));
    transitEstimate = `~${flightHrs}h direct flight`;
  }

  const text = `${distanceKm.toLocaleString()} km ${bearing} • ${transitEstimate}`;
  return { distanceKm, text, transitEstimate };
}

/**
 * Safely request browser GPS coordinates
 */
export function getCurrentGpsPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude.toFixed(5)),
          lng: Number(position.coords.longitude.toFixed(5)),
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Reverse geocode coordinates using OpenStreetMap Nominatim with resilient fallback
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number
): Promise<{ city: string; state?: string; country: string; countryCode: string; displayName: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        'Current City';
      const country = addr.country || 'Global';
      const countryCode = (addr.country_code || 'int').toUpperCase();
      const state = addr.state || addr.region || '';
      const displayName = data.display_name || `${city}, ${country}`;

      return { city, state, country, countryCode, displayName };
    }
  } catch (err) {
    console.warn('Reverse geocoding network call failed, using heuristic:', err);
  }

  return {
    city: 'Local Area',
    country: 'Current Location',
    countryCode: 'LOC',
    displayName: `Coordinates (${lat}, ${lng})`,
  };
}

/**
 * Converts a WorldPlace into a TripDestination for the App's active trip state
 */
export function worldPlaceToTripDestination(place: WorldPlace): TripDestination {
  return {
    id: `trip-${place.id}`,
    name: place.name,
    shortName: place.city || place.name.split('&')[0].trim(),
    location: `${place.city}, ${place.country}`,
    country: place.country,
    coordinates: place.coordinates,
    continent: place.continent,
    flagEmoji: place.flagEmoji,
    worldPlaceId: place.id,
    dates: 'Today – Next 7 Days',
    daysTotal: 7,
    currentDay: 1,
    statusBadge: 'Active Destination',
    statusColor: 'bg-[#d1fae5] text-[#006c49]',
    daysLeftText: '7 days left',
    weatherTemp: `${place.liveWeather?.tempC || 22}°C`,
    weatherCondition: place.liveWeather?.condition || 'Pleasant & Clear',
    weatherRain: `${place.liveWeather?.rainChancePct || 10}% rain`,
    weatherIcon: place.liveWeather?.icon || 'wb_sunny',
    backgroundImage: place.heroImage,
    imageAlt: `${place.name} in ${place.country} panoramic scenic view`,
    tagline: place.tagline,
    totalBudgetUsd: place.avgDailyCostUsd * 7 + 500,
    budgetLimitUsd: place.avgDailyCostUsd * 7 + 500,
    spentUsd: 0,
    todayScheduleTitle: `${place.city} Exploration`,
    todayScheduleSub: `Day 1 • ${place.highlights[0] || 'Orientation & Sights'}`,
    paxCount: 2,
  };
}
