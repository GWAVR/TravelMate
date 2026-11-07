export type ScreenTab = 'dashboard' | 'itinerary' | 'expenses' | 'tripgenie' | 'explore-ai' | 'lodging' | 'journal' | 'profile' | 'auth' | 'admin';

export interface TripGenieQuickFix {
  id: string;
  title: string;
  category: 'itinerary' | 'budget' | 'group' | 'packing';
  impact: string;
  description: string;
  applied?: boolean;
}

export interface TripGenieAnalysis {
  readinessScore: number; // 0 - 100
  status: 'optimal' | 'attention' | 'warning';
  summary: string;
  analyzedAt: string;

  // Itinerary & Timing
  itinerary: {
    score: number;
    pacingAssessment: string;
    highlights: string[];
    clashes: string[];
    transitGaps: string[];
    suggestions: string[];
  };

  // Budget & Financials
  budget: {
    score: number;
    totalSpentUsd: number;
    budgetLimitUsd: number;
    burnRateDailyUsd: number;
    projectedTotalUsd: number;
    overBudgetRisk: 'low' | 'moderate' | 'high';
    topExpenseCategory: string;
    savingsOpportunities: string[];
  };

  // Group Dynamics & Debts
  group: {
    score: number;
    fairnessIndex: string;
    topCreditor: string;
    topDebtor: string;
    settlementAdvice: string[];
  };

  // Climate & Packing
  packing: {
    score: number;
    weatherReadiness: string;
    missingEssentials: string[];
    culturalEtiquette: string[];
  };

  quickFixes: TripGenieQuickFix[];
}

export interface TripGenieChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedQuestions?: string[];
}

export interface WeatherForecastDay {
  id: string;
  dayLabel: string; // e.g. "Today", "Day 2 (Wed)", "Day 3 (Thu)"
  dateStr: string; // e.g. "Nov 14"
  condition: string; // e.g. "Sunny & Clear", "Partly Cloudy", "Showers"
  weatherType: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'thunderstorm' | 'snowy' | 'windy';
  icon: string; // Material symbol name e.g. "wb_sunny", "partly_cloudy_day", "rainy", "cloud", "thunderstorm", "ac_unit"
  tempHighC: number;
  tempLowC: number;
  rainChancePct: number;
  humidityPct?: number;
  windSpeedKmH?: number;
  tripGenieTip: string;
  recommendation: 'outdoor_favorable' | 'good' | 'rain_prep' | 'indoor_ideal';
}

export interface TripGenieWeatherForecast {
  destinationId: string;
  destinationName: string;
  location: string;
  days: WeatherForecastDay[];
  summaryAdvisory: string;
  bestOutdoorDay: string;
  cautionDay?: string;
  fetchedAt: string;
}

export type Currency =
  | 'USD'
  | 'INR'
  | 'JPY'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SGD'
  | 'THB'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'KRW'
  | 'NZD'
  | 'MYR'
  | 'SAR'
  | 'TRY'
  | 'BRL'
  | 'ZAR'
  | string;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
  role?: 'ADMIN' | 'USER';
  token?: string;
  memberSince?: string;
  activeTripId?: string;
  username?: string;
  phone?: string;
  bio?: string;
  homeCity?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  // Persona & Preferences
  pace?: 'Relaxed' | 'Balanced' | 'Fast-Paced';
  interests?: string[];
  dietary?: string;
  walkingGoalSteps?: number;
  preferredCurrency?: string;
  preferredLanguage?: string;
  defaultSplitMode?: 'equal' | 'percent' | 'exact';
  settlementMethod?: string;
  tripBudgetLimit?: number;
  dynamicWeather?: boolean;
  pushAlerts?: boolean;
  faceId?: boolean;
  offlineMapPack?: boolean;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  avatar?: string;
  bio?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardTrip {
  id: string;
  userId: string;
  ownerName?: string;
  ownerEmail?: string;
  name: string;
  location: string;
  country: string;
  dates?: string;
  daysTotal?: number;
  budgetLimitUsd: number;
  spentUsd: number;
  status: string;
  isArchived?: boolean;
  createdAt: string;
}

export interface AdminExpenseRecord {
  id: string;
  tripId: string;
  title: string;
  amountUsd: number;
  currency: string;
  category: string;
  payerName?: string;
  date?: string;
  createdAt: string;
}

export interface AdminDestinationRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  continent: string;
  category: string;
  rating: number;
  tripsCount: number;
  heroImage?: string;
}

export interface AdminAiLogEntry {
  id: string;
  endpoint: string;
  feature: string;
  status: 'success' | 'error';
  latency_ms: number;
  tokens_estimated?: number;
  error_message?: string;
  ip_address?: string;
  created_at: string;
}

export interface AdminAiMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatencyMs: number;
  featureBreakdown: Record<string, number>;
  recentLogs: AdminAiLogEntry[];
}

export interface SuperAdminDashboardData {
  overview: {
    totalUsers: number;
    totalAdmins: number;
    activeUsers: number;
    suspendedUsers: number;
    totalTrips: number;
    activeTrips: number;
    plannedTrips: number;
    completedTrips: number;
    archivedTrips: number;
    totalExpensesUsd: number;
    totalDestinations: number;
    totalReservations?: number;
    totalAiRequests: number;
    aiSuccessRate: number;
    aiAvgLatencyMs: number;
  };
  charts: {
    tripStatusCounts: Record<string, number>;
    registrationsByMonth: Record<string, number>;
    expensesByCurrency: Record<string, number>;
  };
  database: {
    type: string;
    status: 'connected' | 'local_fallback' | 'degraded';
    message: string;
    tablesCount: number;
  };
  recentUsers: AdminUserRecord[];
  recentTrips: AdminDashboardTrip[];
  recentReservations?: HotelReservation[];
  aiMetrics: AdminAiMetrics;
  auditLogs: {
    id: string;
    admin_email: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: string;
    ip_address?: string;
    created_at: string;
  }[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalTrips: number;
  totalExpensesUsd: number;
  totalReservations?: number;
  databaseType: string;
  databaseStatus: 'connected' | 'local_fallback' | 'degraded';
  databaseMessage: string;
  recentUsers: AdminUserRecord[];
  recentTrips: AdminDashboardTrip[];
  recentReservations?: HotelReservation[];
  auditLogs: {
    id: string;
    admin_email: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    details?: string;
    ip_address?: string;
    created_at: string;
  }[];
}

export interface IndianPlace {
  id: string;
  name: string;
  city: string;
  district?: string;
  division?: string;
  state: string;
  region?: 'North' | 'South' | 'West' | 'East & Northeast' | 'Central' | 'Himalayas' | 'Islands';
  category:
    | 'Monuments'
    | 'Forts & Palaces'
    | 'Spiritual & Ghats'
    | 'Street Food & Bazaars'
    | 'Nature & Backwaters'
    | 'Wildlife & Hills'
    | 'Beaches & Coastal'
    | string;
  rating: number;
  reviewsCount: string;
  duration: string;
  entryFee: string;
  image: string;
  description: string;
  highlight: string;
  bestTime: string;
  tags: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type Continent =
  | 'All'
  | 'Europe'
  | 'Asia'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Middle East'
  | 'Oceania';

export interface NearbyPlace {
  id: string;
  name: string;
  category:
    | 'Attraction'
    | 'Food & Dining'
    | 'Nature & Scenery'
    | 'Culture & Temple'
    | 'Shopping & Bazaar'
    | 'Day Trip'
    | 'Nightlife & View'
    | 'Beach & Coastal'
    | string;
  distanceKm: number;
  distanceText: string; // e.g. "0.8 km • 10 min walk"
  travelTime?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  description: string;
  highlights: string[];
  rating: number;
  reviewsCount?: string;
  estDuration: string; // e.g. "1.5 - 2 hrs"
  estCost: string; // e.g. "$15 entry" or "Free"
  openHours?: string;
  tags: string[];
}

export interface WorldPlace {
  id: string;
  name: string;
  city: string;
  district?: string;
  division?: string;
  country: string;
  countryCode: string;
  continent: 'Europe' | 'Asia' | 'North America' | 'South America' | 'Africa' | 'Middle East' | 'Oceania';
  flagEmoji: string;
  category:
    | 'Must-See Wonder'
    | 'Historic City'
    | 'Beach & Coastal'
    | 'Mountain & Nature'
    | 'Food Capital'
    | 'Metropolis'
    | string;
  rating: number;
  reviewsCount: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  heroImage: string;
  galleryImages: string[];
  tagline: string;
  description: string;
  highlights: string[];
  vibe: string;
  bestTimeToVisit: string;
  currency: string;
  currencySymbol?: string;
  language: string;
  timezone: string;
  avgDailyCostUsd: number;
  safetyRating: string;
  weatherSummary: string;
  practicalTips: string[];
  nearbyPlaces: NearbyPlace[];
  tags: string[];

  // All things enhancements
  foodSpecialties?: string[];
  topRestaurants?: { name: string; cuisine: string; priceLevel: string; signatureDish: string }[];
  transitGuide?: {
    airportTransfer?: string;
    metroBus?: string;
    taxisRideshare?: string;
    walkabilityScore?: string;
  };
  emergencyGuide?: {
    police?: string;
    ambulance?: string;
    touristHelpline?: string;
    emergencyNotes?: string;
    safeZones?: string;
  };
  practicalEssentials?: {
    powerPlug?: string;
    voltage?: string;
    tapWaterSafe?: boolean;
    tapWaterNote?: string;
    tippingNorm?: string;
    simAdvice?: string;
    languagePhrases?: { phrase: string; translation: string; pronunciation?: string }[];
  };
  liveWeather?: {
    tempC: number;
    feelsLikeC: number;
    condition: string;
    icon: string;
    humidityPct: number;
    uvIndex: string;
    rainChancePct: number;
    sunriseTime: string;
    sunsetTime: string;
  };
  customAdded?: boolean;
}

export interface TripDestination {
  id: string;
  name: string;
  shortName: string;
  location: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  continent?: string;
  flagEmoji?: string;
  worldPlaceId?: string;
  dates: string;
  daysTotal: number;
  currentDay: number;
  statusBadge: string;
  statusColor: string;
  daysLeftText: string;
  weatherTemp: string;
  weatherCondition: string;
  weatherRain: string;
  weatherIcon: string;
  backgroundImage: string;
  imageAlt: string;
  tagline: string;
  totalBudgetUsd: number;
  budgetLimitUsd?: number;
  spentUsd: number;
  todayScheduleTitle: string;
  todayScheduleSub: string;
  paxCount: number;
}

export interface Member {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  avatar: string;
  color: string;
  netBalance: number; // positive = owes you, negative = you owe them
  subtext?: string;
  settled?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  category: 'food' | 'transport' | 'stays' | 'activities' | 'shopping' | 'other';
  categoryLabel: string;
  amountUsd: number;
  date: string;
  time?: string;
  payerId: string;
  payerName: string;
  splitType: 'equal' | 'custom' | 'percent' | 'by-item';
  splitDetails: string;
  personalShareUsd: number;
  isPersonal?: boolean;
  linkedStop?: string;
  receiptImage?: string;
  ocrVerified?: boolean;
  notes?: string;
}

export interface ItineraryActivity {
  id: string;
  day: number;
  timeSlot: string;
  title: string;
  status: 'completed' | 'up-next' | 'reserved' | 'upcoming';
  category: string;
  location: string;
  cost?: string;
  image?: string;
  tags?: string[];
  transitInfo?: string;
  advisory?: string;
  splitInfo?: string;
  bookingRef?: string;
  costPerPerson?: string;
}

export interface JournalEntry {
  id: string;
  day: number;
  time: string;
  title: string;
  location: string;
  rating: number;
  tags: string[];
  notes: string;
  companions: string;
  heroImage: string;
  subImages?: string[];
  audioTitle?: string;
  audioDuration?: string;
  likes: number;
  stopRef?: string;
  weatherSnippet?: string;
}

export interface HotelRoomType {
  id: string;
  name: string;
  bedType: string;
  maxGuests?: number;
  capacity?: string;
  priceInr?: number;
  priceUsd?: number;
  pricePerNightInr?: number;
  pricePerNightUsd?: number;
  description?: string;
  amenities?: string[];
  image?: string;
}

export interface HotelLodging {
  id: string;
  name: string;
  district: string;
  division: 'Konkan' | 'Pune' | 'Nashik' | 'Chhatrapati Sambhaji Nagar' | 'Amravati' | 'Nagpur' | string;
  city: string;
  type: string;
  rating: number;
  reviewsCount: string;
  pricePerNightInr: number;
  pricePerNightUsd: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  galleryImages?: string[];
  tagline: string;
  description: string;
  amenities: string[];
  roomTypes: HotelRoomType[];
  nearbyPlaceId?: string;
  nearbyPlaceName?: string;
  address?: string;
  phone?: string;
  mtdcCertified?: boolean;
}

export interface HotelReservation {
  id: string;
  bookingRef?: string;
  booking_ref?: string;
  userId?: string;
  user_id?: string;
  tripId?: string;
  trip_id?: string;
  hotelId?: string;
  hotel_id?: string;
  hotelName?: string;
  hotel_name?: string;
  hotelImage?: string;
  hotel_image?: string;
  district: string;
  city: string;
  roomTypeId?: string;
  room_type_id?: string;
  roomTypeName?: string;
  room_type_name?: string;
  checkInDate?: string;
  check_in_date?: string;
  checkOutDate?: string;
  check_out_date?: string;
  nightsCount?: number;
  nights_count?: number;
  guestsCount?: number;
  guests_count?: number;
  guestName?: string;
  guest_name?: string;
  guestEmail?: string;
  guest_email?: string;
  guestPhone?: string;
  guest_phone?: string;
  specialRequests?: string;
  special_requests?: string;
  roomRatePerNightInr?: number;
  room_rate_per_night_inr?: number;
  totalAmountInr?: number;
  total_amount_inr?: number;
  totalAmountUsd?: number;
  total_amount_usd?: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Paid' | 'Pay at Hotel';
  payment_status?: 'Paid' | 'Pay at Hotel';
  createdAt?: string;
  created_at?: string;
}
