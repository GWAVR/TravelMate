import { useState } from 'react';
import { WorldPlace, NearbyPlace, ItineraryActivity } from '../types';

type PlaceContinent =
  | 'Europe'
  | 'Asia'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Middle East'
  | 'Oceania';

import {
  getCurrentGpsPosition,
  reverseGeocodeCoordinates,
  worldPlaceToTripDestination,
} from '../utils/geoUtils';
import { saveWorldPlaceToCache, placeToItineraryActivity } from '../utils/worldPlacesApi';
import { addCachedTrip } from '../utils/offlineStorage';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onLocationAdded?: (place: WorldPlace) => void;
  onSelectAsActiveTrip?: (place: WorldPlace) => void;
  onAddActivities?: (activities: ItineraryActivity[]) => void;
}

// Preset photo options from top travel collections
const PHOTO_PRESETS = [
  {
    label: '🌊 Coastal / Azure Sea',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: '🏔️ Alpine / Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: '🏛️ Historic / Architecture',
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: '🌴 Tropical / Paradise',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: '🌆 Modern Metropolis',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: '🕌 Heritage / Cultural',
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  },
];

// Curated Wonder Templates for 1-click loading
const WONDER_TEMPLATES: Partial<WorldPlace>[] = [
  {
    name: 'Amalfi Coast & Positano',
    city: 'Positano',
    country: 'Italy',
    countryCode: 'IT',
    continent: 'Europe',
    flagEmoji: '🇮🇹',
    category: 'Beach & Coastal',
    rating: 4.9,
    reviewsCount: '48,000',
    coordinates: { lat: 40.6281, lng: 14.485 },
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Sun-drenched pastel cliffside villages, azure Tyrrhenian waters & lemon groves',
    description:
      'The Amalfi Coast is a 50-kilometer stretch of coastline along the southern edge of Italy’s Sorrentine Peninsula. Renowned for its dramatic cliffs, pastel-hued towns perched above the sea, terraced lemon orchards, and sparkling coves, it embodies Mediterranean glamour and coastal romance.',
    highlights: [
      'Climb the picturesque pastel streets of Positano down to Spiaggia Grande',
      'Hike the breathtaking Path of the Gods (Sentiero degli Dei) high above the sea',
      'Private wooden boat tour around Capri and the illuminated Blue Grotto',
      'Visit the 9th-century Duomo di Amalfi in historic Piazza del Duomo',
    ],
    vibe: 'Glamorous, romantic, sun-kissed cliffside luxury',
    bestTimeToVisit: 'May to October (warm swimming & vibrant coastal ferries)',
    currency: 'Euro (EUR, €)',
    currencySymbol: '€',
    language: 'Italian',
    timezone: 'CET (UTC+1)',
    avgDailyCostUsd: 195,
    safetyRating: 'Very High (Safe and peaceful resort towns)',
    weatherSummary: 'Sunny Mediterranean climate with daytime temperatures of 26°C–29°C in summer and refreshing sea breezes.',
    foodSpecialties: ['Limoncello di Sorrento', 'Scialatielli ai Frutti di Mare', 'Caprese Salad', 'Delizia al Limone'],
    transitGuide: {
      airportTransfer: 'Naples Capodichino Airport (NAP) is ~60 km away; take the Curreri shuttle or private water transfer.',
      metroBus: 'SITA buses link all coastal villages along SS163; scenic passenger ferries connect Salerno, Amalfi, and Positano.',
      taxisRideshare: 'Local metered taxis and water taxis; ride-hailing is limited on narrow cliff roads.',
      walkabilityScore: '92/100 (Vertical town with pedestrian stairways and seaside promenades).',
    },
    emergencyGuide: {
      police: '112 (European Emergency)',
      ambulance: '118 (Medical Emergency)',
      touristHelpline: '+39 089 874514 (Amalfi Tourist Police)',
      safeZones: 'All cliffside districts and harbor areas are extremely safe; wear sturdy grip sandals on stone steps.',
    },
    practicalEssentials: {
      powerPlug: 'Type C / F / L (230V / 50Hz)',
      voltage: '230V',
      tapWaterSafe: true,
      tapWaterNote: 'Tap water is clean and safe across the region.',
      tippingNorm: 'Service charge (coperto) is usually included; leaving 5-10% for exceptional hospitality is customary.',
      simAdvice: 'TIM or Vodafone Italy provides seamless 5G coverage throughout the coast and offshore.',
      languagePhrases: [
        { phrase: 'Buongiorno', translation: 'Good morning', pronunciation: 'bwon-JOR-noh' },
        { phrase: 'Grazie mille', translation: 'Thank you very much', pronunciation: 'GRAHT-syeh MEE-leh' },
        { phrase: 'Il conto, per favore', translation: 'The bill, please', pronunciation: 'eel KOHN-toh pehr fah-VOH-reh' },
      ],
    },
    tags: ['Amalfi', 'Positano', 'Italy', 'Mediterranean', 'Cliffs', 'Beaches', 'Romantic'],
  },
  {
    name: 'Santorini & Oia Caldera',
    city: 'Oia',
    country: 'Greece',
    countryCode: 'GR',
    continent: 'Europe',
    flagEmoji: '🇬🇷',
    category: 'Must-See Wonder',
    rating: 4.9,
    reviewsCount: '62,000',
    coordinates: { lat: 36.4618, lng: 25.3753 },
    heroImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Whitewashed cubiform villas, blue-domed chapels & legendary Aegean sunsets',
    description:
      'Santorini is the precious gem of the Aegean Sea, formed by one of the largest volcanic eruptions in recorded history. Its cliff-clinging towns of Fira and Oia overlook a submerged caldera, famous for iconic whitewashed architecture and world-renowned sunsets.',
    highlights: [
      'Sunset watch from the ruins of Byzantine Castle in Oia',
      'Caldera rim rim hike from Fira to Oia overlooking sparkling waters',
      'Wine tasting crisp Assyrtiko at clifftop Santo Wines vineyard',
      'Catamaran cruise to the Red Beach and volcanic hot springs',
    ],
    vibe: 'Scenic, whitewashed elegance, romantic cycladic paradise',
    bestTimeToVisit: 'April to November (Long sunny days and warm sea temperatures)',
    currency: 'Euro (EUR, €)',
    currencySymbol: '€',
    language: 'Greek & English',
    timezone: 'EET (UTC+2)',
    avgDailyCostUsd: 180,
    safetyRating: 'Very High (Island community with negligible crime)',
    weatherSummary: 'Warm sunny summers (28°C–32°C) with dry Aegean Meltemi breezes keeping evening air crisp.',
    foodSpecialties: ['Fava Santorinis', 'Tomatokeftedes (Tomato Fritters)', 'Fresh Grilled Octopus', 'Santorini Assyrtiko Wine'],
    transitGuide: {
      airportTransfer: 'Santorini National Airport (JTR) is 15 min by taxi or public KTEL bus.',
      metroBus: 'KTEL island buses run regularly between Fira, Oia, Kamari, and Perissa.',
      taxisRideshare: 'Taxis, quad bikes (ATVs), and scooters are widely rented.',
      walkabilityScore: '88/100 (Pedestrian cobblestone pathways with cliff stairs).',
    },
    emergencyGuide: {
      police: '100 / 112',
      ambulance: '166',
      touristHelpline: '+30 22860 22649 (Santorini Tourist Police)',
      safeZones: 'Extremely safe throughout day and night.',
    },
    practicalEssentials: {
      powerPlug: 'Type C / F (230V / 50Hz)',
      voltage: '230V',
      tapWaterSafe: false,
      tapWaterNote: 'Tap water is desalinated and brackish; drink bottled or filtered water.',
      tippingNorm: '5-10% in sit-down tavernas is welcomed.',
      simAdvice: 'Cosmote has the highest speed coverage across Cyclades islands.',
    },
    tags: ['Santorini', 'Oia', 'Greece', 'Caldera', 'Sunsets', 'Islands', 'Romantic'],
  },
  {
    name: 'Swiss Alps & Zermatt Matterhorn',
    city: 'Zermatt',
    country: 'Switzerland',
    countryCode: 'CH',
    continent: 'Europe',
    flagEmoji: '🇨🇭',
    category: 'Mountain & Nature',
    rating: 4.9,
    reviewsCount: '39,000',
    coordinates: { lat: 45.9765, lng: 7.7491 },
    heroImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Pyramidal alpine peaks, car-free mountain serenity & world-class trails',
    description:
      'Zermatt lies at the foot of the Matterhorn, the world’s most iconic pyramid-shaped mountain. A car-free mountain resort renowned for crystalline glacial lakes, world-class skiing, scenic cogwheel railways, and warm chalet hospitality.',
    highlights: [
      'Ride the Gornergrat cogwheel train for panoramic views of 29 peaks over 4,000m',
      'Hike the Five Lakes Walk (5-Seenweg) reflecting the Matterhorn in still waters',
      'Glacier Paradise cable car ascent to highest mountain station in Europe (3,883m)',
      'Traditional alpine raclette and cheese fondue dinner in a rustic timber chalet',
    ],
    vibe: 'Pure alpine air, pristine mountain luxury & outdoor wonder',
    bestTimeToVisit: 'June to September (Wildflower hiking) or Dec to April (Skiing)',
    currency: 'Swiss Franc (CHF)',
    currencySymbol: 'CHF',
    language: 'German, French, English',
    timezone: 'CET (UTC+1)',
    avgDailyCostUsd: 220,
    safetyRating: 'Maximum (One of the safest destinations in the world)',
    weatherSummary: 'Alpine climate: cool crisp summers (18°C–23°C) and snowy winter wonderlands (-5°C to 2°C).',
    foodSpecialties: ['Swiss Cheese Fondue', 'Valaisanne Dried Beef & Raclette', 'Rösti with Fried Egg', 'Swiss Alpine Chocolate'],
    transitGuide: {
      airportTransfer: 'Fly to Zurich (ZRH) or Geneva (GVA); seamless Swiss Federal Rail (SBB) connections direct to Zermatt.',
      metroBus: 'Zermatt is 100% car-free; electric e-buses and horse-drawn carriages provide local transit.',
      taxisRideshare: 'Compact electric hotel shuttles and e-taxis operate 24/7.',
      walkabilityScore: '98/100 (Completely walkable, zero exhaust fumes).',
    },
    emergencyGuide: {
      police: '117',
      ambulance: '144',
      touristHelpline: '1414 (Air Zermatt Alpine Rescue)',
      safeZones: 'Unconditionally safe everywhere in town and on marked trails.',
    },
    practicalEssentials: {
      powerPlug: 'Type J (Swiss 3-pin) and Type C (230V / 50Hz)',
      voltage: '230V',
      tapWaterSafe: true,
      tapWaterNote: 'Crystal clear, direct glacial spring water from every tap and village fountain.',
      tippingNorm: 'Service is legally included in all prices; rounding up to nearest 5 or 10 CHF is polite.',
      simAdvice: 'Swisscom provides ultra-fast 5G even at high mountain peaks.',
    },
    tags: ['Switzerland', 'Matterhorn', 'Zermatt', 'Alps', 'Hiking', 'Skiing', 'Fondue'],
  },
  {
    name: 'Bali & Ubud Sacred Forests',
    city: 'Ubud',
    country: 'Indonesia',
    countryCode: 'ID',
    continent: 'Asia',
    flagEmoji: '🇮🇩',
    category: 'Mountain & Nature',
    rating: 4.8,
    reviewsCount: '55,000',
    coordinates: { lat: -8.5069, lng: 115.2625 },
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Emerald terraced rice paddies, ancient Hindu water temples & tropical tranquility',
    description:
      'Ubud is the cultural and spiritual heart of Bali, nestled among mist-covered ravines and terraced rice paddies. Renowned for traditional crafts, sacred monkey sanctuaries, ancient stone temples, and holistic wellness.',
    highlights: [
      'Walk through the dramatic stepped emerald slopes of Tegallalang Rice Terrace',
      'Encounter long-tailed macaques in the Sacred Monkey Forest Sanctuary',
      'Purification bathing ritual at Tirta Empul holy spring water temple',
      'Sunrise hike up Mount Batur volcano followed by natural volcanic hot springs',
    ],
    vibe: 'Spiritual, lush tropical greenery, artistic serenity',
    bestTimeToVisit: 'April to October (Dry season with low humidity and clear skies)',
    currency: 'Indonesian Rupiah (IDR, Rp)',
    currencySymbol: 'Rp',
    language: 'Indonesian & Balinese (English widely spoken)',
    timezone: 'WITA (UTC+8)',
    avgDailyCostUsd: 65,
    safetyRating: 'High (Warm, welcoming, community-oriented culture)',
    weatherSummary: 'Tropical warm climate year-round (27°C–31°C) with occasional refreshing afternoon tropical rains.',
    foodSpecialties: ['Nasi Campur Bali', 'Babi Guling', 'Bebek Betutu (Slow-cooked Duck)', 'Fresh Coconut & Acai Bowls'],
    transitGuide: {
      airportTransfer: 'Ngurah Rai International Airport (DPS) in Denpasar is ~75 min drive by private car.',
      metroBus: 'Grab and Gojek apps provide convenient rideshare; private day drivers are very affordable ($40/day).',
      taxisRideshare: 'Scooter rentals are popular; rideshare pick-ups operate in designated central zones.',
      walkabilityScore: '75/100 (Central Ubud is walkable; outer rice trails require scooters or drivers).',
    },
    emergencyGuide: {
      police: '110',
      ambulance: '118',
      touristHelpline: '+62 361 975313 (Ubud Tourist Police)',
      safeZones: 'Safe and peaceful; respect temple dress codes (sarong required).',
    },
    practicalEssentials: {
      powerPlug: 'Type C / F (230V / 50Hz)',
      voltage: '230V',
      tapWaterSafe: false,
      tapWaterNote: 'Do not drink tap water; use bottled or filtered water provided by hotels/cafes.',
      tippingNorm: 'Tipping 5-10% is deeply appreciated by drivers and servers.',
      simAdvice: 'Telkomsel offers the strongest nationwide network across Bali.',
    },
    tags: ['Bali', 'Ubud', 'Indonesia', 'Rice Terrace', 'Temples', 'Nature', 'Wellness'],
  },
  {
    name: 'Dubai & Burj Khalifa Metropolis',
    city: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    continent: 'Middle East',
    flagEmoji: '🇦🇪',
    category: 'Metropolis',
    rating: 4.8,
    reviewsCount: '78,000',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    tagline: 'Futuristic skylines, desert dunes, gold souks & world record architectural wonders',
    description:
      'Dubai is a dazzling desert metropolis that blends futuristic ambition with rich Arabian heritage. From the world’s tallest tower to traditional abra boats crossing Dubai Creek, luxury shopping, and golden desert safaris.',
    highlights: [
      'Ascend to the 148th floor observatory of Burj Khalifa for panoramic skyline vistas',
      'Spectacular evening Dubai Fountain choreography set to music and lights',
      'Desert dune bashing, camel safari & Bedouin dinner under desert stars',
      'Stroll the historic Al Fahidi neighborhood and gold/spice souks along the Creek',
    ],
    vibe: 'Ultra-modern, luxurious, futuristic, culturally rich',
    bestTimeToVisit: 'November to March (Pleasantly warm winter sunshine 24°C–28°C)',
    currency: 'UAE Dirham (AED)',
    currencySymbol: 'AED',
    language: 'Arabic & English (Universal)',
    timezone: 'GST (UTC+4)',
    avgDailyCostUsd: 185,
    safetyRating: 'Maximum (One of the safest, lowest-crime cities on Earth)',
    weatherSummary: 'Sunny desert climate: delightfully warm in winter (25°C), hot in summer (40°C+ with air-conditioned spaces).',
    foodSpecialties: ['Shawarma & Mixed Grill', 'Al Harees', 'Luqaimat with Date Syrup', 'Emirati Karak Chai'],
    transitGuide: {
      airportTransfer: 'Dubai International (DXB) is connected via the driverless Red Metro line.',
      metroBus: 'Dubai Metro is fully air-conditioned, world-class, clean and fast with contactless Nol card.',
      taxisRideshare: 'Dubai Taxi Corporation (DTC), Careem, and Uber are omnipresent and reliable.',
      walkabilityScore: '80/100 (Downtown, Dubai Marina, and Creek are pedestrian-friendly).',
    },
    emergencyGuide: {
      police: '999',
      ambulance: '998',
      touristHelpline: '800 4888 (Dubai Police Tourist Security)',
      safeZones: '100% safe across all neighborhoods, malls, and public transit at any hour.',
    },
    practicalEssentials: {
      powerPlug: 'Type G (UK 3-pin standard, 230V / 50Hz)',
      voltage: '230V',
      tapWaterSafe: true,
      tapWaterNote: 'Tap water is safe for boiling/cooking; bottled water is standard for direct drinking.',
      tippingNorm: '10-15% is standard for good service.',
      simAdvice: 'Du or Etisalat provide 5G tourist eSIMs directly at DXB airport arrival.',
    },
    tags: ['Dubai', 'Burj Khalifa', 'UAE', 'Skyline', 'Desert', 'Luxury', 'Shopping'],
  },
];

export function AddLocationModal({
  isOpen,
  onClose,
  onShowToast,
  onLocationAdded,
  onSelectAsActiveTrip,
  onAddActivities,
}: AddLocationModalProps) {
  // Mode: 'gps' | 'search' | 'custom'
  const [activeMode, setActiveMode] = useState<'gps' | 'preset' | 'custom'>('preset');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('Amalfi Coast & Positano');
  const [city, setCity] = useState('Positano');
  const [country, setCountry] = useState('Italy');
  const [countryCode, setCountryCode] = useState('IT');
  const [continent, setContinent] = useState<PlaceContinent>('Europe');
  const [flagEmoji, setFlagEmoji] = useState('🇮🇹');
  const [category, setCategory] = useState<string>('Beach & Coastal');
  const [lat, setLat] = useState<number>(40.6281);
  const [lng, setLng] = useState<number>(14.485);
  const [heroImage, setHeroImage] = useState<string>(
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80'
  );
  const [tagline, setTagline] = useState('Sun-drenched pastel cliffside villages, azure waters & lemon groves');
  const [description, setDescription] = useState(
    'A breathtaking Mediterranean destination perched on rugged coastal cliffs, offering vibrant historic avenues, seaside trattorias, and sparkling coves.'
  );
  const [highlightsText, setHighlightsText] = useState(
    'Stroll picturesque pastel streets down to the beach, Hike Path of the Gods, Private boat cruise around sea grottos, Savor artisan limoncello at sunset'
  );
  const [vibe, setVibe] = useState('Glamorous, romantic, scenic cliffside luxury');
  const [bestTime, setBestTime] = useState('May to October (warm sunshine & refreshing sea)');
  const [dailyBudget, setDailyBudget] = useState<number>(195);
  const [currency, setCurrency] = useState('EUR (€)');
  const [language, setLanguage] = useState('Italian');
  const [foodText, setFoodText] = useState('Limoncello di Sorrento, Fresh Seafood Pasta, Caprese Salad, Artisanal Gelato');
  const [metroBus, setMetroBus] = useState('Scenic ferries & regional coastal buses connect all village harbors');
  const [taxisRideshare, setTaxisRideshare] = useState('Local metered taxis and private water transfers');
  const [policeNum, setPoliceNum] = useState('112');
  const [ambulanceNum, setAmbulanceNum] = useState('118');
  const [powerPlug, setPowerPlug] = useState('Type C / F (230V)');
  const [tapWaterSafe, setTapWaterSafe] = useState(true);
  const [tippingNorm, setTippingNorm] = useState('5-10% customary for attentive table service');

  // Checkbox actions
  const [setAsActiveTripNow, setSetAsActiveTripNow] = useState(true);
  const [addTopHighlightsToItinerary, setAddTopHighlightsToItinerary] = useState(true);

  if (!isOpen) return null;

  // Apply a wonder template
  const handleApplyTemplate = (tpl: Partial<WorldPlace>) => {
    if (tpl.name) setName(tpl.name);
    if (tpl.city) setCity(tpl.city);
    if (tpl.country) setCountry(tpl.country);
    if (tpl.countryCode) setCountryCode(tpl.countryCode);
    if (tpl.continent) setContinent(tpl.continent);
    if (tpl.flagEmoji) setFlagEmoji(tpl.flagEmoji);
    if (tpl.category) setCategory(tpl.category);
    if (tpl.coordinates) {
      setLat(tpl.coordinates.lat);
      setLng(tpl.coordinates.lng);
    }
    if (tpl.heroImage) setHeroImage(tpl.heroImage);
    if (tpl.tagline) setTagline(tpl.tagline);
    if (tpl.description) setDescription(tpl.description);
    if (tpl.highlights) setHighlightsText(tpl.highlights.join(', '));
    if (tpl.vibe) setVibe(tpl.vibe);
    if (tpl.bestTimeToVisit) setBestTime(tpl.bestTimeToVisit);
    if (tpl.avgDailyCostUsd) setDailyBudget(tpl.avgDailyCostUsd);
    if (tpl.currency) setCurrency(tpl.currency);
    if (tpl.language) setLanguage(tpl.language);
    if (tpl.foodSpecialties) setFoodText(tpl.foodSpecialties.join(', '));
    if (tpl.transitGuide?.metroBus) setMetroBus(tpl.transitGuide.metroBus);
    if (tpl.transitGuide?.taxisRideshare) setTaxisRideshare(tpl.transitGuide.taxisRideshare);
    if (tpl.emergencyGuide?.police) setPoliceNum(tpl.emergencyGuide.police);
    if (tpl.emergencyGuide?.ambulance) setAmbulanceNum(tpl.emergencyGuide.ambulance);
    if (tpl.practicalEssentials?.powerPlug) setPowerPlug(tpl.practicalEssentials.powerPlug);
    if (tpl.practicalEssentials?.tapWaterSafe !== undefined) setTapWaterSafe(tpl.practicalEssentials.tapWaterSafe);
    if (tpl.practicalEssentials?.tippingNorm) setTippingNorm(tpl.practicalEssentials.tippingNorm);

    onShowToast(`Loaded "${tpl.name}" template with all details!`);
  };

  // Detect GPS Location
  const handleDetectGps = async () => {
    setIsDetectingGps(true);
    setGpsStatus('Requesting GPS location from browser...');

    try {
      const coords = await getCurrentGpsPosition();
      setLat(coords.lat);
      setLng(coords.lng);
      setGpsStatus(`Coordinates acquired: ${coords.lat}, ${coords.lng}. Resolving address...`);

      const geo = await reverseGeocodeCoordinates(coords.lat, coords.lng);
      setCity(geo.city);
      setCountry(geo.country);
      setCountryCode(geo.countryCode);
      setName(`${geo.city} & Local Highlights`);
      setTagline(`Explore authentic attractions, cuisine & vibrant culture in ${geo.city}`);
      setDescription(
        `A welcoming destination in ${geo.country} centered around ${geo.city}. Filled with authentic neighborhood streets, scenic viewpoints, regional food markets, and rich local life.`
      );
      setVibe('Authentic, lively, culturally grounded');
      setBestTime('Year-round local exploration');
      setHighlightsText(
        `Historic district walk in ${geo.city}, Regional food market tasting, Sunset viewpoint over the skyline, Cultural museum visit`
      );
      setFoodText(`Local specialties of ${geo.city}, Street food delicacies, Fresh seasonal produce`);
      setMetroBus(`City public transit & local buses across ${geo.city}`);
      setTaxisRideshare('Local metered cabs, Uber / ride-hailing apps');
      setFlagEmoji('📍');
      setGpsStatus(`✓ Successfully located: ${geo.city}, ${geo.country}`);
      onShowToast(`📍 Location detected: ${geo.city}, ${geo.country}!`);
    } catch (err: any) {
      console.warn('GPS detection error:', err);
      setGpsStatus(`GPS error: ${err.message || 'Permission denied or timed out'}. Using current values.`);
      onShowToast('Could not access GPS. Please check browser permissions or select a template.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Save the new location
  const handleSaveLocation = () => {
    if (!name.trim()) {
      onShowToast('Please enter a location name');
      return;
    }

    const highlights = highlightsText
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    const foodSpecialties = foodText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const id = `place-${Date.now()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    // Auto-generate 4 comprehensive nearby spots around these coordinates
    const nearbyPlaces: NearbyPlace[] = [
      {
        id: `near-${Date.now()}-1`,
        name: `${city} Historic Old Town & Plaza`,
        category: 'Attraction',
        distanceKm: 0.8,
        distanceText: '0.8 km • 10 min walk',
        travelTime: '10 min walk',
        coordinates: { lat: Number((lat + 0.005).toFixed(4)), lng: Number((lng + 0.005).toFixed(4)) },
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
        description: `Charming cobblestone square bordered by landmark architecture, street musicians, and open-air cafes.`,
        highlights: ['Historic monuments', 'Open-air terraces', 'Photography'],
        rating: 4.8,
        estDuration: '1.5 - 2 hrs',
        estCost: 'Free stroll',
        openHours: 'Open 24/7',
        tags: ['Old Town', 'Plaza', 'Walkable'],
      },
      {
        id: `near-${Date.now()}-2`,
        name: `${city} Artisan Food Market & Bistros`,
        category: 'Food & Dining',
        distanceKm: 1.4,
        distanceText: '1.4 km • 15 min walk or 5 min taxi',
        travelTime: '15 min walk',
        coordinates: { lat: Number((lat - 0.006).toFixed(4)), lng: Number((lng + 0.008).toFixed(4)) },
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        description: `Bustling local food market featuring regional specialties, warm bakeries, fresh espresso, and authentic street fare.`,
        highlights: [foodSpecialties[0] || 'Local specialties', 'Artisan treats', 'Coffee roasters'],
        rating: 4.9,
        estDuration: '1 - 2 hrs',
        estCost: '$15 - $35',
        openHours: '08:00 - 21:00',
        tags: ['Foodie', 'Market', 'Specialties'],
      },
      {
        id: `near-${Date.now()}-3`,
        name: `${city} Panoramic Viewpoint & Gardens`,
        category: 'Nature & Scenery',
        distanceKm: 2.5,
        distanceText: '2.5 km • 10 min transit / cab',
        travelTime: '10 min transit',
        coordinates: { lat: Number((lat + 0.012).toFixed(4)), lng: Number((lng - 0.009).toFixed(4)) },
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        description: `Scenic high-ground vantage point overlooking ${city}, with manicured gardens and stunning golden hour light.`,
        highlights: ['Panoramic vista', 'Sunset viewpoint', 'Botanical gardens'],
        rating: 4.9,
        estDuration: '1.5 hrs',
        estCost: 'Free entry',
        openHours: 'Best at sunset',
        tags: ['Views', 'Sunset', 'Nature'],
      },
      {
        id: `near-${Date.now()}-4`,
        name: `${city} Heritage Cultural Temple & Museum`,
        category: 'Culture & Temple',
        distanceKm: 3.1,
        distanceText: '3.1 km • 15 min bus / metro',
        travelTime: '15 min bus',
        coordinates: { lat: Number((lat - 0.014).toFixed(4)), lng: Number((lng - 0.007).toFixed(4)) },
        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80',
        description: `Iconic heritage site featuring historical artifacts, sacred architecture, and guided cultural tours.`,
        highlights: ['Ancient architecture', 'Guided tours', 'Artisan crafts'],
        rating: 4.7,
        estDuration: '2 hrs',
        estCost: '$12 entry',
        openHours: '09:00 - 18:00',
        tags: ['Culture', 'Heritage', 'History'],
      },
    ];

    const newPlace: WorldPlace = {
      id,
      name,
      city,
      country,
      countryCode,
      continent,
      flagEmoji,
      category,
      rating: 4.9,
      reviewsCount: '12,400',
      coordinates: { lat, lng },
      heroImage,
      galleryImages: [heroImage],
      tagline,
      description,
      highlights: highlights.length > 0 ? highlights : ['Historic landmarks', 'Scenic vistas', 'Artisan cuisine'],
      vibe,
      bestTimeToVisit: bestTime,
      currency,
      currencySymbol: currency.includes('$') ? '$' : currency.includes('€') ? '€' : currency.includes('£') ? '£' : '$',
      language,
      timezone: 'Local Time',
      avgDailyCostUsd: dailyBudget,
      safetyRating: 'High (Verified peaceful & welcoming destination)',
      weatherSummary: `Pleasant temperate touring weather (19°C–25°C) with clear skies and calm breezes.`,
      practicalTips: [
        `Book key entry permits and reservations in advance for ${name}`,
        `Use public transit or walking for the most authentic experience`,
        `Carry small local currency denominations for markets and cafes`,
      ],
      nearbyPlaces,
      tags: [name, city, country, category, 'Perfect Location', 'TravelMate'],
      foodSpecialties,
      transitGuide: {
        metroBus,
        taxisRideshare,
        walkabilityScore: '90/100 (Highly walkable neighborhood paths)',
      },
      emergencyGuide: {
        police: policeNum,
        ambulance: ambulanceNum,
        touristHelpline: `${policeNum} (Local Emergency Dispatch)`,
        safeZones: 'Safe everywhere in designated tourist zones and central corridors.',
      },
      practicalEssentials: {
        powerPlug,
        voltage: '230V',
        tapWaterSafe,
        tapWaterNote: tapWaterSafe ? 'Safe and clean tap water.' : 'Bottled or filtered water recommended.',
        tippingNorm,
      },
      liveWeather: {
        tempC: 22,
        feelsLikeC: 22,
        condition: 'Sunny & Pleasant',
        icon: 'wb_sunny',
        humidityPct: 52,
        uvIndex: 'Moderate (5)',
        rainChancePct: 10,
        sunriseTime: '06:20 AM',
        sunsetTime: '06:45 PM',
      },
      customAdded: true,
    };

    // Save to world places cache
    saveWorldPlaceToCache(newPlace);

    // If user wants to set as active trip destination
    if (setAsActiveTripNow) {
      const tripDest = worldPlaceToTripDestination(newPlace);
      addCachedTrip(tripDest);
      if (onSelectAsActiveTrip) {
        onSelectAsActiveTrip(newPlace);
      }
    }

    // If user wants to add top highlights to itinerary
    if (addTopHighlightsToItinerary && onAddActivities) {
      const acts: ItineraryActivity[] = nearbyPlaces.slice(0, 3).map((spot, idx) =>
        placeToItineraryActivity(spot, idx + 1)
      );
      onAddActivities(acts);
    }

    if (onLocationAdded) {
      onLocationAdded(newPlace);
    }

    onShowToast(`🎉 Added "${newPlace.name}" with all things to your destinations!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="p-4 bg-[#faf8ff] border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#006194] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">add_location_alt</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold text-[#131b2e] leading-tight">
                  Add Perfect Location
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#006c49]/15 text-[#006c49] font-bold">
                  With All Things
                </span>
              </div>
              <p className="text-xs text-[#64748b]">
                GPS auto-detect, world templates, or custom dossier
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white shadow-xs text-[#131b2e] flex items-center justify-center hover:bg-[#f2f3ff] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-2 bg-[#f2f3ff] gap-1.5 border-b border-[#e2e8f0] shrink-0">
          <button
            onClick={() => setActiveMode('preset')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'preset'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>Wonder Presets</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('gps');
              handleDetectGps();
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'gps'
                ? 'bg-[#006194] text-white shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            <span>GPS Auto-Detect</span>
          </button>

          <button
            onClick={() => setActiveMode('custom')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'custom'
                ? 'bg-white text-[#006194] shadow-xs'
                : 'text-[#64748b] hover:text-[#131b2e]'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">edit_location</span>
            <span>Custom Editor</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8ff]">
          {/* Preset templates carousel if in preset mode */}
          {activeMode === 'preset' && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block">
                Choose a World Wonder Template (1-Tap Auto-Fills All Things):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WONDER_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="p-2.5 rounded-xl bg-white border border-[#e2e8f0] text-left hover:border-[#006194] hover:shadow-xs transition-all flex flex-col gap-1 active:scale-98"
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{tpl.flagEmoji}</span>
                      <span className="text-[10px] text-[#006194] font-bold">Select →</span>
                    </div>
                    <span className="text-xs font-bold text-[#131b2e] leading-snug line-clamp-1">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] text-[#64748b]">
                      {tpl.city}, {tpl.country}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GPS status banner */}
          {activeMode === 'gps' && (
            <div className="p-3.5 rounded-2xl bg-[#e0f2fe] border border-[#bae6fd] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#006194] font-bold">
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isDetectingGps ? 'animate-spin' : ''
                  }`}
                >
                  {isDetectingGps ? 'progress_activity' : 'check_circle'}
                </span>
                <span>{isDetectingGps ? 'Pinpointing GPS Location...' : 'GPS Coordinates Locked!'}</span>
              </div>
              <p className="text-xs text-[#0369a1]">{gpsStatus || 'GPS coordinates ready.'}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDetectGps}
                  disabled={isDetectingGps}
                  className="px-3 py-1.5 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Refresh GPS</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Fields: Basic Information */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#006194] font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
              <span>1. Destination Identity & Coordinates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amalfi Coast & Positano"
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold focus:outline-none focus:ring-2 focus:ring-[#006194]/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  City & Country *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City (e.g. Positano)"
                    className="flex-1 text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold focus:outline-none focus:ring-2 focus:ring-[#006194]/20"
                  />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country (e.g. Italy)"
                    className="flex-1 text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold focus:outline-none focus:ring-2 focus:ring-[#006194]/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Continent
                </label>
                <select
                  value={continent}
                  onChange={(e) => setContinent(e.target.value as PlaceContinent)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold focus:outline-none"
                >
                  <option value="Europe">Europe</option>
                  <option value="Asia">Asia</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                  <option value="Africa">Africa</option>
                  <option value="Middle East">Middle East</option>
                  <option value="Oceania">Oceania</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Flag / Icon
                </label>
                <input
                  type="text"
                  value={flagEmoji}
                  onChange={(e) => setFlagEmoji(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] text-center font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Latitude (°N)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-mono text-center font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Longitude (°E)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-mono text-center font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold focus:outline-none"
              >
                <option value="Must-See Wonder">Must-See Wonder</option>
                <option value="Beach & Coastal">Beach & Coastal</option>
                <option value="Mountain & Nature">Mountain & Nature</option>
                <option value="Historic City">Historic City</option>
                <option value="Metropolis">Metropolis</option>
                <option value="Food Capital">Food Capital</option>
              </select>
            </div>
          </div>

          {/* Photo & Aesthetics */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#006194] font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>2. Inspiring Imagery & Vibe</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Hero Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] focus:outline-none truncate font-mono"
                />
                <img
                  src={heroImage}
                  alt="Preview"
                  className="w-10 h-10 rounded-xl object-cover border border-[#e2e8f0] shrink-0"
                />
              </div>

              {/* Quick photo presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
                {PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setHeroImage(p.url)}
                    className="px-2 py-1 rounded-lg bg-[#f2f3ff] text-[10px] font-semibold text-[#006194] shrink-0 hover:bg-[#e0f2fe]"
                    type="button"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Evocative Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Traveler Story & Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
              />
            </div>
          </div>

          {/* Highlights & Best Season */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#006194] font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">stars</span>
              <span>3. Highlights, Weather & Season</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Top Highlights (comma-separated)
              </label>
              <textarea
                rows={2}
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Best Time / Season to Visit
                </label>
                <input
                  type="text"
                  value={bestTime}
                  onChange={(e) => setBestTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Atmospheric Vibe
                </label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>
            </div>
          </div>

          {/* Food, Dining & Signature Dishes */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">restaurant</span>
              <span>4. Signature Food & Gastronomy</span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                Must-Try Dishes & Local Specialties (comma-separated)
              </label>
              <input
                type="text"
                value={foodText}
                onChange={(e) => setFoodText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
              />
            </div>
          </div>

          {/* Transit & Getting Around */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">directions_bus</span>
              <span>5. Transit & Getting Around</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Metro, Ferries & Buses
                </label>
                <input
                  type="text"
                  value={metroBus}
                  onChange={(e) => setMetroBus(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Taxis & Ride-Hailing
                </label>
                <input
                  type="text"
                  value={taxisRideshare}
                  onChange={(e) => setTaxisRideshare(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>
            </div>
          </div>

          {/* Safety, Emergency & Practical Essentials */}
          <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>6. Safety, Money & Practical Essentials</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Daily Budget ($)
                </label>
                <input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(parseInt(e.target.value) || 100)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Police Hot-line
                </label>
                <input
                  type="text"
                  value={policeNum}
                  onChange={(e) => setPoliceNum(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-bold text-center"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Ambulance
                </label>
                <input
                  type="text"
                  value={ambulanceNum}
                  onChange={(e) => setAmbulanceNum(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0] font-bold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Power Plug Socket
                </label>
                <input
                  type="text"
                  value={powerPlug}
                  onChange={(e) => setPowerPlug(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#64748b] block mb-1">
                  Tipping Norm
                </label>
                <input
                  type="text"
                  value={tippingNorm}
                  onChange={(e) => setTippingNorm(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8ff] border border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006194] text-[18px]">
                  water_bottle
                </span>
                <span className="text-xs font-semibold text-[#131b2e]">
                  Tap water is safe for direct drinking?
                </span>
              </div>
              <button
                onClick={() => setTapWaterSafe(!tapWaterSafe)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  tapWaterSafe
                    ? 'bg-[#006c49] text-white shadow-2xs'
                    : 'bg-amber-100 text-amber-800'
                }`}
                type="button"
              >
                {tapWaterSafe ? '✓ Safe to Drink' : '⚠️ Bottled Recommended'}
              </button>
            </div>
          </div>

          {/* Action Checkboxes */}
          <div className="p-3.5 rounded-2xl bg-[#e2e7ff]/70 border border-[#dae2fd] space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#131b2e]">
              <input
                type="checkbox"
                checked={setAsActiveTripNow}
                onChange={(e) => setSetAsActiveTripNow(e.target.checked)}
                className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194]"
              />
              <span>Set immediately as Active Trip Destination in Dashboard &amp; Header</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#131b2e]">
              <input
                type="checkbox"
                checked={addTopHighlightsToItinerary}
                onChange={(e) => setAddTopHighlightsToItinerary(e.target.checked)}
                className="w-4 h-4 rounded text-[#006194] focus:ring-[#006194]"
              />
              <span>Auto-populate Day 1–3 trip schedule with nearby highlights</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-[#e2e8f0] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white border border-[#e2e8f0] text-xs font-bold text-[#64748b] hover:bg-[#f2f3ff] transition-all"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveLocation}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-md hover:bg-[#007bb9] active:scale-95 transition-all flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Save Perfect Location (with All Things)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
