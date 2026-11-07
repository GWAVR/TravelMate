import { WorldPlace, NearbyPlace, ItineraryActivity } from '../types';
import { WORLD_PLACES } from '../data/worldPlacesData';

const CACHE_PLACES_KEY = 'travelmate_cached_world_places';
const BOOKMARKS_KEY = 'travelmate_bookmarked_places';

// Get cached places or seed with WORLD_PLACES
export function getStoredWorldPlaces(): WorldPlace[] {
  try {
    const raw = localStorage.getItem(CACHE_PLACES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with curated places ensuring no duplicates
        const map = new Map<string, WorldPlace>();
        WORLD_PLACES.forEach((p) => map.set(p.id, p));
        parsed.forEach((p: WorldPlace) => map.set(p.id, p));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    console.warn('Error reading cached world places, using defaults:', err);
  }
  return WORLD_PLACES;
}

export function saveWorldPlaceToCache(place: WorldPlace): void {
  try {
    const current = getStoredWorldPlaces();
    const existingIndex = current.findIndex((p) => p.id === place.id || p.name.toLowerCase() === place.name.toLowerCase());
    if (existingIndex >= 0) {
      current[existingIndex] = place;
    } else {
      current.unshift(place);
    }
    localStorage.setItem(CACHE_PLACES_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Error caching world place:', err);
  }
}

export function getBookmarkedPlaceIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading bookmarks:', err);
  }
  return ['paris-france', 'agra-taj-mahal', 'kyoto-japan'];
}

export function toggleBookmarkedPlace(id: string): string[] {
  try {
    const current = getBookmarkedPlaceIds();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    return next;
  } catch (err) {
    console.warn('Error saving bookmark:', err);
    return [];
  }
}

// Search and resolve any world place: first local, then server endpoint with AI
export async function searchAndResolvePlace(query: string): Promise<WorldPlace> {
  const clean = query.trim().toLowerCase();
  const allPlaces = getStoredWorldPlaces();

  // 1. Exact or high-match local check
  const localMatch = allPlaces.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      p.city.toLowerCase() === clean ||
      p.country.toLowerCase() === clean ||
      p.tags.some((t) => t.toLowerCase() === clean)
  );

  if (localMatch) {
    return localMatch;
  }

  // 2. Fetch from server endpoint for dynamic place discovery
  try {
    const res = await fetch('/api/places/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeQuery: query }),
    });

    if (res.ok) {
      const data: WorldPlace = await res.json();
      saveWorldPlaceToCache(data);
      return data;
    }
  } catch (apiErr) {
    console.warn('Online place lookup failed, creating local place:', apiErr);
  }

  // 3. Resilient fallback generator if network fails
  const words = query.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const fallbackPlace: WorldPlace = {
    id: `place-${Date.now()}-${clean.replace(/\s+/g, '-')}`,
    name: words,
    city: words.split(',')[0].trim(),
    country: words.includes(',') ? words.split(',')[1].trim() : 'Global Destination',
    countryCode: 'INT',
    continent: 'Europe',
    flagEmoji: '🌍',
    category: 'Must-See Wonder',
    rating: 4.8,
    reviewsCount: '24,000',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    tagline: `Experience the remarkable culture, beauty, and cuisine of ${words}`,
    description: `${words} is a celebrated destination known worldwide for its striking landmarks, cultural heritage, and warm hospitality. Explore its storied streets, visit historic monuments, and taste authentic local specialties.`,
    highlights: [
      `Historic center and iconic architecture of ${words}`,
      'Spectacular scenic viewpoints and photography spots',
      'Authentic local dining and artisan food markets',
      'Guided cultural walking tours through landmark districts',
    ],
    vibe: 'Scenic, vibrant, culturally enriching, and historic',
    bestTimeToVisit: 'Spring & Autumn for pleasant touring weather',
    currency: 'USD / EUR equivalent',
    currencySymbol: '$',
    language: 'English & Local Language',
    timezone: 'UTC+1',
    avgDailyCostUsd: 110,
    safetyRating: 'High (Standard city awareness recommended)',
    weatherSummary: 'Temperate and pleasant (18°C–24°C)',
    practicalTips: [
      'Book key attraction tickets in advance online to beat lines',
      'Use local public transit or walking to discover hidden gems',
      'Carry local currency for street vendors and small cafes',
    ],
    tags: [words, 'World Travel', 'Sightseeing', 'Culture', 'Photography'],
    nearbyPlaces: [
      {
        id: `near-${Date.now()}-1`,
        name: `${words} Historic Old Town Plaza`,
        category: 'Attraction',
        distanceKm: 0.6,
        distanceText: '0.6 km • 8 min walk',
        travelTime: '8 min walk',
        coordinates: { lat: 48.861, lng: 2.356 },
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
        description: 'Vibrant pedestrian square bordered by historic architecture, street performers, and outdoor terrace cafes.',
        highlights: ['Historic monuments', 'Street performers', 'Outdoor cafes'],
        rating: 4.8,
        estDuration: '1.5 - 2 hrs',
        estCost: 'Free stroll',
        openHours: 'Open 24/7',
        tags: ['Plaza', 'Historic', 'Walkable'],
      },
      {
        id: `near-${Date.now()}-2`,
        name: `${words} Local Food Market & Cafes`,
        category: 'Food & Dining',
        distanceKm: 1.2,
        distanceText: '1.2 km • 15 min walk',
        travelTime: '15 min walk',
        coordinates: { lat: 48.852, lng: 2.348 },
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        description: 'Bustling covered market offering regional delicacies, artisan pastries, fresh espresso, and authentic street food.',
        highlights: ['Local specialties', 'Fresh coffee', 'Artisan produce'],
        rating: 4.7,
        estDuration: '1.5 hrs',
        estCost: '$15 - $30',
        openHours: '08:30 - 20:00',
        tags: ['Foodie', 'Market', 'Local'],
      },
      {
        id: `near-${Date.now()}-3`,
        name: `${words} Panoramic City Viewpoint`,
        category: 'Nature & Scenery',
        distanceKm: 2.4,
        distanceText: '2.4 km • 10 min transit / cab',
        travelTime: '10 min',
        coordinates: { lat: 48.868, lng: 2.365 },
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        description: 'Scenic high-ground vantage point overlooking the entire cityscape, rivers, and horizon.',
        highlights: ['Golden hour sunset', 'Panoramic photography', 'Peaceful gardens'],
        rating: 4.9,
        estDuration: '1 - 2 hrs',
        estCost: 'Free entry',
        openHours: 'Best at sunset',
        tags: ['Views', 'Sunset', 'Scenic'],
      },
    ],
  };

  saveWorldPlaceToCache(fallbackPlace);
  return fallbackPlace;
}

// Convert a NearbyPlace or WorldPlace into an ItineraryActivity
export function placeToItineraryActivity(place: WorldPlace | NearbyPlace, day: number = 3): ItineraryActivity {
  const isWorldPlace = 'country' in place;
  const location = isWorldPlace ? `${place.city}, ${place.country}` : `${place.name} (${place.distanceText})`;
  const cost = isWorldPlace ? `$${place.avgDailyCostUsd}/day` : place.estCost || 'Free Entry';
  const category = isWorldPlace ? 'Sightseeing • Destination' : `${place.category}`;

  return {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    day,
    timeSlot: '11:00 - 13:00',
    title: place.name,
    status: 'upcoming',
    category,
    location,
    cost,
    image: isWorldPlace ? place.heroImage : place.image,
    tags: place.tags || ['Explore', 'Sightseeing'],
    transitInfo: isWorldPlace ? `Destination: ${place.name}` : place.distanceText || 'Walking distance',
    advisory: isWorldPlace ? place.practicalTips?.[0] : place.description,
  };
}
