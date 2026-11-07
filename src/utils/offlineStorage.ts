import { Expense, ItineraryActivity, Member, UserProfile, TripDestination } from '../types';
import { INITIAL_EXPENSES, INITIAL_ACTIVITIES, INITIAL_MEMBERS, DEFAULT_USER, TRIP_DESTINATIONS, APP_ASSETS } from '../data/mockData';

const APP_MODE_KEY = 'travelmate_app_mode_v2';
const TRIPS_STORAGE_KEY = 'travelmate_cached_trips_v2';
const EXPENSES_STORAGE_KEY = 'travelmate_cached_expenses_v2';
const ITINERARY_STORAGE_KEY = 'travelmate_cached_itinerary_v2';
const MEMBERS_STORAGE_KEY = 'travelmate_cached_members_v3';
const USER_PROFILE_STORAGE_KEY = 'travelmate_cached_user_v4';
const OFFLINE_SETTINGS_KEY = 'travelmate_offline_settings_v2';
const LAST_SYNCED_KEY = 'travelmate_last_synced_v2';

export const FRESH_USER_MEMBER: Member = {
  id: DEFAULT_USER.id,
  name: `${DEFAULT_USER.name} (You)`,
  initials: 'AR',
  email: DEFAULT_USER.email,
  phone: DEFAULT_USER.phone || '+91 98765 43210',
  avatar: DEFAULT_USER.avatar,
  color: 'bg-[#006194]',
  netBalance: 0,
  subtext: 'You (Organizer)',
};

/**
 * Get current App Mode ('fresh' or 'demo').
 * New users default to 'fresh' so they start with a clean slate!
 */
export function getAppMode(): 'fresh' | 'demo' {
  if (typeof window === 'undefined' || !window.localStorage) return 'fresh';
  const mode = window.localStorage.getItem(APP_MODE_KEY);
  return mode === 'demo' ? 'demo' : 'fresh';
}

export function setAppMode(mode: 'fresh' | 'demo'): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(APP_MODE_KEY, mode);
}

/**
 * Safe helper to read from localStorage with fallback
 */
function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      // Seed initial data into localStorage
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to read ${key} from localStorage, using fallback:`, err);
    return fallback;
  }
}

/**
 * Safe helper to write to localStorage
 */
function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(LAST_SYNCED_KEY, new Date().toISOString());
    return true;
  } catch (err) {
    console.error(`[OfflineStorage] Failed to write ${key} to localStorage:`, err);
    return false;
  }
}

// ==================== TRIPS CACHING ====================

export function getCachedTrips(): TripDestination[] {
  const mode = getAppMode();
  if (mode === 'demo') {
    return readStorage<TripDestination[]>(TRIPS_STORAGE_KEY, TRIP_DESTINATIONS);
  }
  // Fresh mode starts with 0 trips until user creates one!
  return readStorage<TripDestination[]>(TRIPS_STORAGE_KEY, []);
}

export function saveCachedTrips(trips: TripDestination[]): void {
  writeStorage(TRIPS_STORAGE_KEY, trips);
}

export function addCachedTrip(newTrip: TripDestination): TripDestination[] {
  const current = getCachedTrips();
  const updated = [newTrip, ...current];
  saveCachedTrips(updated);
  return updated;
}

export function deleteCachedTrip(id: string): TripDestination[] {
  const current = getCachedTrips();
  const updated = current.filter((t) => t.id !== id);
  saveCachedTrips(updated);
  return updated;
}

// ==================== EXPENSE CACHING ====================

export function getCachedExpenses(): Expense[] {
  const mode = getAppMode();
  if (mode === 'demo') {
    return readStorage<Expense[]>(EXPENSES_STORAGE_KEY, INITIAL_EXPENSES);
  }
  // Fresh mode starts with 0 expenses
  return readStorage<Expense[]>(EXPENSES_STORAGE_KEY, []);
}

export function saveCachedExpenses(expenses: Expense[]): void {
  writeStorage(EXPENSES_STORAGE_KEY, expenses);
}

export function addCachedExpense(newExpense: Expense): Expense[] {
  const current = getCachedExpenses();
  const updated = [newExpense, ...current];
  saveCachedExpenses(updated);
  return updated;
}

export function deleteCachedExpense(id: string): Expense[] {
  const current = getCachedExpenses();
  const updated = current.filter((e) => e.id !== id);
  saveCachedExpenses(updated);
  return updated;
}

// ==================== ITINERARY CACHING ====================

export function getCachedActivities(): ItineraryActivity[] {
  const mode = getAppMode();
  if (mode === 'demo') {
    return readStorage<ItineraryActivity[]>(ITINERARY_STORAGE_KEY, INITIAL_ACTIVITIES);
  }
  // Fresh mode starts with 0 activities
  return readStorage<ItineraryActivity[]>(ITINERARY_STORAGE_KEY, []);
}

export function saveCachedActivities(activities: ItineraryActivity[]): void {
  writeStorage(ITINERARY_STORAGE_KEY, activities);
}

export function addCachedActivity(activity: ItineraryActivity): ItineraryActivity[] {
  const current = getCachedActivities();
  const updated = [...current, activity];
  saveCachedActivities(updated);
  return updated;
}

export function deleteCachedActivity(id: string): ItineraryActivity[] {
  const current = getCachedActivities();
  const updated = current.filter((a) => a.id !== id);
  saveCachedActivities(updated);
  return updated;
}

// ==================== MEMBERS CACHING ====================

export function getCachedMembers(): Member[] {
  const mode = getAppMode();
  if (mode === 'demo') {
    return readStorage<Member[]>(MEMBERS_STORAGE_KEY, INITIAL_MEMBERS);
  }
  // Fresh mode starts with only the user themselves
  return readStorage<Member[]>(MEMBERS_STORAGE_KEY, [FRESH_USER_MEMBER]);
}

export function saveCachedMembers(members: Member[]): void {
  writeStorage(MEMBERS_STORAGE_KEY, members);
}

// ==================== USER PROFILE CACHING ====================

const ADMIN_EMAILS = ['abhijeetraoavr@gmail.com', 'lokeshramkor650@gmail.com'];

export function getCachedUserProfile(): UserProfile {
  const cached = readStorage<UserProfile>(USER_PROFILE_STORAGE_KEY, DEFAULT_USER);
  // Strictly enforce NO auto-login: user must explicitly sign in or sign up
  const isSessionActive = typeof window !== 'undefined' && window.sessionStorage?.getItem('travelmate_session_active') === 'true';
  const merged: UserProfile = {
    ...DEFAULT_USER,
    ...cached,
    isLoggedIn: Boolean(isSessionActive && cached.isLoggedIn),
  };
  const emailLower = (merged.email || '').trim().toLowerCase();
  if (ADMIN_EMAILS.includes(emailLower) || merged.role === 'ADMIN') {
    merged.role = 'ADMIN';
  }
  return merged;
}

export function saveCachedUserProfile(user: UserProfile): void {
  const emailLower = (user.email || '').trim().toLowerCase();
  const userToSave: UserProfile = {
    ...user,
    role: (ADMIN_EMAILS.includes(emailLower) || user.role === 'ADMIN') ? 'ADMIN' : (user.role || 'USER'),
  };
  writeStorage(USER_PROFILE_STORAGE_KEY, userToSave);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    if (user.isLoggedIn) {
      window.sessionStorage.setItem('travelmate_session_active', 'true');
    } else {
      window.sessionStorage.removeItem('travelmate_session_active');
    }
  }
}

export function clearSessionAuth(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage?.removeItem('travelmate_session_active');
    window.localStorage?.removeItem('travelmate_token');
    const cached = readStorage<UserProfile>(USER_PROFILE_STORAGE_KEY, DEFAULT_USER);
    writeStorage(USER_PROFILE_STORAGE_KEY, { ...cached, isLoggedIn: false });
  }
}

// ==================== MODE SWITCHING: FRESH VS DEMO ====================

export function resetToFreshApp(): {
  trips: TripDestination[];
  expenses: Expense[];
  activities: ItineraryActivity[];
  members: Member[];
} {
  setAppMode('fresh');
  saveCachedTrips([]);
  saveCachedExpenses([]);
  saveCachedActivities([]);
  saveCachedMembers([FRESH_USER_MEMBER]);
  return {
    trips: [],
    expenses: [],
    activities: [],
    members: [FRESH_USER_MEMBER],
  };
}

export function loadDemoTrip(): {
  trips: TripDestination[];
  expenses: Expense[];
  activities: ItineraryActivity[];
  members: Member[];
} {
  setAppMode('demo');
  saveCachedTrips(TRIP_DESTINATIONS);
  saveCachedExpenses(INITIAL_EXPENSES);
  saveCachedActivities(INITIAL_ACTIVITIES);
  saveCachedMembers(INITIAL_MEMBERS);
  return {
    trips: TRIP_DESTINATIONS,
    expenses: INITIAL_EXPENSES,
    activities: INITIAL_ACTIVITIES,
    members: INITIAL_MEMBERS,
  };
}

// ==================== CACHE DIAGNOSTICS & SYNC ====================

export interface CacheDiagnostics {
  expenseCount: number;
  activityCount: number;
  totalExpenseUsd: number;
  lastSaved: string;
  storageBytesEstimate: number;
  isAvailable: boolean;
}

export function getCacheDiagnostics(): CacheDiagnostics {
  const expenses = getCachedExpenses();
  const activities = getCachedActivities();
  const lastSaved = typeof window !== 'undefined' && window.localStorage
    ? window.localStorage.getItem(LAST_SYNCED_KEY) || 'Just now'
    : 'Not available';

  const totalExpenseUsd = expenses.reduce((sum, item) => sum + (item.amountUsd || 0), 0);

  let storageBytesEstimate = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      storageBytesEstimate = (
        (window.localStorage.getItem(EXPENSES_STORAGE_KEY)?.length || 0) +
        (window.localStorage.getItem(ITINERARY_STORAGE_KEY)?.length || 0) +
        (window.localStorage.getItem(MEMBERS_STORAGE_KEY)?.length || 0)
      ) * 2; // rough UTF-16 byte estimation
    } catch {
      storageBytesEstimate = 0;
    }
  }

  return {
    expenseCount: expenses.length,
    activityCount: activities.length,
    totalExpenseUsd,
    lastSaved,
    storageBytesEstimate,
    isAvailable: typeof window !== 'undefined' && !!window.localStorage,
  };
}

export function resetCacheToDefaults(): { expenses: Expense[]; activities: ItineraryActivity[] } {
  saveCachedExpenses(INITIAL_EXPENSES);
  saveCachedActivities(INITIAL_ACTIVITIES);
  saveCachedMembers(INITIAL_MEMBERS);
  return {
    expenses: INITIAL_EXPENSES,
    activities: INITIAL_ACTIVITIES,
  };
}

// ==================== OFFLINE SIMULATION SETTINGS ====================

export function getSimulatedOffline(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(OFFLINE_SETTINGS_KEY) === 'true';
}

export function setSimulatedOffline(value: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(OFFLINE_SETTINGS_KEY, value ? 'true' : 'false');
  // Dispatch custom event to notify any listeners immediately
  window.dispatchEvent(new CustomEvent('travelmate_offline_toggle', { detail: { isOffline: value } }));
}
