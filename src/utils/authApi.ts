import {
  UserProfile,
  AdminUserRecord,
  AdminDashboardTrip,
  AdminExpenseRecord,
  AdminDestinationRecord,
  AdminAiMetrics,
  SuperAdminDashboardData,
  AdminDashboardStats,
  HotelLodging,
  HotelReservation,
} from '../types';

const TOKEN_KEY = 'travelmate_auth_jwt_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export async function loginWithApi(
  email: string,
  password: string,
  requestedRole?: 'ADMIN' | 'USER'
): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, requestedRole }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed. Please check your credentials.');
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return {
    user: {
      ...data.user,
      isLoggedIn: true,
      token: data.token,
    },
    token: data.token,
  };
}

export async function adminLoginWithApi(
  email: string,
  password: string
): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Admin authentication failed. Please check administrator credentials.');
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return {
    user: {
      ...data.user,
      isLoggedIn: true,
      role: 'ADMIN',
      token: data.token,
    },
    token: data.token,
  };
}

export async function registerWithApi(
  name: string,
  email: string,
  password: string
): Promise<{ user: UserProfile; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed. Please check your details.');
  }

  if (data.token) {
    setStoredToken(data.token);
  }

  return {
    user: {
      ...data.user,
      isLoggedIn: true,
      token: data.token,
    },
    token: data.token,
  };
}

export async function fetchCurrentProfile(token?: string): Promise<UserProfile | null> {
  const activeToken = token || getStoredToken();
  if (!activeToken) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    if (!res.ok) {
      removeStoredToken();
      return null;
    }
    const data = await res.json();
    return {
      ...data,
      isLoggedIn: true,
      token: activeToken,
    };
  } catch {
    return null;
  }
}

export async function updateUserProfileApi(
  updates: { name?: string; bio?: string; avatar?: string },
  token?: string
): Promise<UserProfile> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('You must be signed in to update your profile.');

  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeToken}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
  return data.user;
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
  token?: string
): Promise<void> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('You must be signed in to change your password.');

  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${activeToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password.');
}

// ==========================================
// Super Admin Specific API Endpoints
// ==========================================

export async function fetchSuperAdminDashboard(token?: string): Promise<SuperAdminDashboardData> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const res = await fetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin dashboard statistics from database.');
  }

  return data.stats;
}

export async function fetchAdminDashboardStats(token?: string): Promise<AdminDashboardStats> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const res = await fetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin dashboard statistics from database.');
  }

  const s = data.stats as SuperAdminDashboardData;
  return {
    totalUsers: s.overview.totalUsers,
    totalAdmins: s.overview.totalAdmins,
    totalTrips: s.overview.totalTrips,
    totalExpensesUsd: s.overview.totalExpensesUsd,
    databaseType: s.database.type,
    databaseStatus: s.database.status,
    databaseMessage: s.database.message,
    recentUsers: s.recentUsers,
    recentTrips: s.recentTrips,
    auditLogs: s.auditLogs,
  };
}

export async function fetchAdminUsers(
  token?: string,
  filters?: { search?: string; role?: string; status?: string }
): Promise<AdminUserRecord[]> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.role) params.set('role', filters.role);
  if (filters?.status) params.set('status', filters.status);

  const res = await fetch(`/api/admin/users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch users.');
  return data.users;
}

export async function createAdminUser(
  token: string,
  userData: { name: string; email: string; password: string; role: 'ADMIN' | 'USER' }
): Promise<AdminUserRecord> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user in database.');
  return data.user;
}

export async function updateUserStatusApi(
  token: string,
  userId: string,
  status: 'ACTIVE' | 'SUSPENDED'
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user account status.');
}

export async function resetUserPasswordApi(
  token: string,
  userId: string,
  newPasswordPlain: string
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: newPasswordPlain }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset user password.');
}

export async function deleteAdminUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
}

export async function fetchAdminTrips(
  token?: string,
  filters?: { search?: string; status?: string }
): Promise<AdminDashboardTrip[]> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status) params.set('status', filters.status);

  const res = await fetch(`/api/admin/trips?${params.toString()}`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch trips from database.');
  return data.trips;
}

export async function archiveTripApi(token: string, tripId: string, isArchived: boolean): Promise<void> {
  const res = await fetch(`/api/admin/trips/${tripId}/archive`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isArchived }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle trip archive state.');
}

export async function fetchAdminExpenses(
  token?: string,
  filters?: { search?: string; category?: string; currency?: string }
): Promise<{ expenses: AdminExpenseRecord[]; analytics: any }> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.currency) params.set('currency', filters.currency);

  const res = await fetch(`/api/admin/expenses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch expenses from database.');
  return data;
}

export async function fetchAdminDestinations(token?: string): Promise<AdminDestinationRecord[]> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const res = await fetch('/api/admin/destinations', {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch destinations.');
  return data.destinations;
}

export async function fetchAdminAiMetrics(token?: string): Promise<AdminAiMetrics> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const res = await fetch('/api/admin/ai-metrics', {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch AI usage metrics.');
  return data.aiMetrics;
}

export async function fetchAdminAuditLogs(token?: string, actionFilter?: string): Promise<any[]> {
  const activeToken = token || getStoredToken();
  if (!activeToken) throw new Error('Missing admin authorization token.');

  const url = actionFilter && actionFilter !== 'ALL'
    ? `/api/admin/audit-logs?action=${encodeURIComponent(actionFilter)}`
    : '/api/admin/audit-logs';

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${activeToken}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs.');
  return data.auditLogs;
}

export async function changeAdminPasswordApi(
  token: string,
  currentPasswordPlain: string,
  newPasswordPlain: string
): Promise<void> {
  const res = await fetch('/api/admin/settings/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword: currentPasswordPlain, newPassword: newPasswordPlain }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change admin password.');
}

export async function updateAdminProfileApi(
  token: string,
  updates: { name?: string; bio?: string }
): Promise<UserProfile> {
  const res = await fetch('/api/admin/settings/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update administrator profile.');
  return data.user;
}

export async function exportDataCsvApi(token: string, exportType: 'users' | 'trips' | 'expenses' | 'audit' | 'ai' | 'reservations'): Promise<void> {
  const res = await fetch(`/api/admin/export/${exportType}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to export ${exportType} CSV.`);
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `travelmate_${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function adminLogoutApi(token?: string): Promise<void> {
  const activeToken = token || getStoredToken();
  if (activeToken) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken}` },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  removeStoredToken();
}

// --- Lodging & Hotel Reservation Client APIs ---

export async function fetchLodgingHotelsApi(filters?: { district?: string; type?: string; search?: string }): Promise<HotelLodging[]> {
  const params = new URLSearchParams();
  if (filters?.district && filters.district !== 'ALL') params.set('district', filters.district);
  if (filters?.type && filters.type !== 'ALL') params.set('type', filters.type);
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`/api/lodging/hotels?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch hotels.');
  return data.hotels || [];
}

export async function fetchUserReservationsApi(token?: string, userId?: string): Promise<HotelReservation[]> {
  const activeToken = token || getStoredToken();
  const headers: Record<string, string> = {};
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`/api/lodging/reservations${query}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch reservations.');
  return data.reservations || [];
}

export async function createReservationApi(
  reservationData: {
    hotelId: string;
    hotelName: string;
    hotelImage?: string;
    district: string;
    city: string;
    roomTypeId: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    nightsCount: number;
    guestsCount: number;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
    roomRatePerNightInr: number;
    totalAmountInr: number;
    totalAmountUsd?: number;
    tripId?: string;
    userId?: string;
    paymentStatus?: 'Paid' | 'Pay at Hotel';
  },
  token?: string
): Promise<{ reservation: HotelReservation; bookingRef: string }> {
  const activeToken = token || getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch('/api/lodging/reservations', {
    method: 'POST',
    headers,
    body: JSON.stringify(reservationData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to book room reservation.');
  return { reservation: data.reservation, bookingRef: data.bookingRef };
}

// --- Admin Lodging Management APIs ---

export async function fetchAdminReservationsApi(
  token: string,
  filters?: { search?: string; district?: string; status?: string }
): Promise<HotelReservation[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.district && filters.district !== 'ALL') params.set('district', filters.district);
  if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);

  const res = await fetch(`/api/admin/reservations?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to retrieve admin hotel reservations.');
  return data.reservations || [];
}

export async function updateAdminReservationStatusApi(
  token: string,
  id: string,
  status: 'Confirmed' | 'Completed' | 'Cancelled'
): Promise<void> {
  const res = await fetch(`/api/admin/reservations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update reservation status.');
}

// --- Admin Complete User Data Inspector API ---

export interface AdminUserFullData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar: string;
    bio: string;
    last_login_at?: string;
    created_at: string;
    updated_at?: string;
  };
  stats: {
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    totalExpensesCount: number;
    totalSpentUsd: number;
    totalReservationsCount: number;
    totalReservationsInr: number;
  };
  trips: AdminDashboardTrip[];
  expenses: AdminExpenseRecord[];
  reservations: HotelReservation[];
}

export async function fetchAdminUserFullDataApi(token: string, userId: string): Promise<AdminUserFullData> {
  const res = await fetch(`/api/admin/users/${userId}/full-data`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to retrieve full user data.');
  return data.data;
}

// --- User Trip & Expense Persistent Database APIs ---

export async function fetchTripsApi(): Promise<any[]> {
  try {
    const res = await fetch('/api/trips');
    if (!res.ok) return [];
    const data = await res.json();
    return data.trips || [];
  } catch {
    return [];
  }
}

export async function createTripApi(trip: any, tokenParam?: string): Promise<boolean> {
  try {
    const token = tokenParam || getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers,
      body: JSON.stringify(trip),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchExpensesApi(): Promise<any[]> {
  try {
    const res = await fetch('/api/expenses');
    if (!res.ok) return [];
    const data = await res.json();
    return data.expenses || [];
  } catch {
    return [];
  }
}

export async function createExpenseApi(expense: any, tokenParam?: string): Promise<boolean> {
  try {
    const token = tokenParam || getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers,
      body: JSON.stringify(expense),
    });
    return res.ok;
  } catch {
    return false;
  }
}

