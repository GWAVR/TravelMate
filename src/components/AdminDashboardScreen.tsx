import React, { useState, useEffect } from 'react';
import { UserProfile, AdminDashboardStats, AdminUserRecord, AdminDashboardTrip, HotelReservation } from '../types';
import {
  fetchAdminDashboardStats,
  deleteAdminUser,
  createAdminUser,
  adminLogoutApi,
  getStoredToken,
  fetchAdminReservationsApi,
  updateAdminReservationStatusApi,
  fetchAdminUserFullDataApi,
  AdminUserFullData,
  exportDataCsvApi,
} from '../utils/authApi';
import { TravelMateLogo } from './TravelMateLogo';

interface AdminDashboardScreenProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchToTravelerView: () => void;
  onShowToast: (msg: string) => void;
}

export function AdminDashboardScreen({
  currentUser,
  onLogout,
  onSwitchToTravelerView,
  onShowToast,
}: AdminDashboardScreenProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // New user modal state - strictly no email autofill
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [creatingUser, setCreatingUser] = useState(false);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'trips' | 'reservations' | 'audit'>('overview');

  // Hotel Reservations State
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState('ALL');

  // User Full Data Inspector Modal State
  const [inspectedUser, setInspectedUser] = useState<AdminUserFullData | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [loadingUserDossier, setLoadingUserDossier] = useState(false);

  const loadStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = currentUser.token || getStoredToken();
      if (!token) {
        throw new Error('No authorization token present. Please log in as an administrator.');
      }
      const data = await fetchAdminDashboardStats(token);
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReservations = async () => {
    setLoadingReservations(true);
    try {
      const token = currentUser.token || getStoredToken();
      if (!token) return;
      const res = await fetchAdminReservationsApi(token, {
        search: reservationSearch,
        status: reservationStatusFilter,
      });
      setReservations(res);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Failed to load reservations'}`);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations') {
      loadReservations();
    }
  }, [activeTab, reservationStatusFilter]);

  const handleLogout = async () => {
    try {
      const token = currentUser.token || getStoredToken();
      await adminLogoutApi(token || undefined);
    } catch {
      // Ignore
    }
    onShowToast('✓ Administrator signed out safely.');
    onLogout();
  };

  const handleDeleteUser = async (user: AdminUserRecord) => {
    if (user.id === currentUser.id || user.email.toLowerCase() === currentUser.email.toLowerCase()) {
      onShowToast('⚠️ You cannot delete your own active administrator account.');
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${user.name}" (${user.email}) from the database?`)) {
      return;
    }

    try {
      const token = currentUser.token || getStoredToken();
      if (!token) throw new Error('Not authorized.');
      await deleteAdminUser(token, user.id);
      onShowToast(`✓ Deleted user ${user.name}`);
      loadStats(true);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Failed to delete user'}`);
    }
  };

  const handleInspectUser = async (userId: string) => {
    setLoadingUserDossier(true);
    setIsInspectModalOpen(true);
    setInspectedUser(null);
    try {
      const token = currentUser.token || getStoredToken();
      if (!token) throw new Error('Not authorized.');
      const data = await fetchAdminUserFullDataApi(token, userId);
      setInspectedUser(data);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Failed to load user dataset'}`);
      setIsInspectModalOpen(false);
    } finally {
      setLoadingUserDossier(false);
    }
  };

  const handleUpdateReservationStatus = async (resId: string, newStatus: 'Confirmed' | 'Completed' | 'Cancelled') => {
    try {
      const token = currentUser.token || getStoredToken();
      if (!token) throw new Error('Not authorized.');
      await updateAdminReservationStatusApi(token, resId, newStatus);
      onShowToast(`✓ Reservation ${resId} status changed to ${newStatus}`);
      loadReservations();
      loadStats(true);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Failed to update reservation status'}`);
    }
  };

  const handleExportCsv = async (type: 'users' | 'trips' | 'expenses' | 'audit' | 'ai' | 'reservations') => {
    try {
      const token = currentUser.token || getStoredToken();
      if (!token) throw new Error('Not authorized.');
      onShowToast(`Exporting ${type} to CSV...`);
      await exportDataCsvApi(token, type);
      onShowToast(`✓ Downloaded ${type} CSV report successfully.`);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Export failed'}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      onShowToast('Please fill out all required fields.');
      return;
    }

    setCreatingUser(true);
    try {
      const token = currentUser.token || getStoredToken();
      if (!token) throw new Error('Not authorized.');

      await createAdminUser(token, {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      onShowToast(`✓ Successfully created ${newUserRole} account for ${newUserEmail}`);
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('USER');
      loadStats(true);
    } catch (err: any) {
      onShowToast(`❌ ${err.message || 'Failed to create user'}`);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#131b2e] pb-16">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0c1e33] text-white shadow-md border-b border-[#1e3a5f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TravelMateLogo size={32} className="shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  TravelMate
                </span>
                <span className="bg-[#eab308]/20 border border-[#eab308]/40 text-[#fde047] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-[#93c5fd]">
                Full System Control • Maharashtra Lodging & Database Inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Switch to Traveler View */}
            <button
              onClick={onSwitchToTravelerView}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#93c5fd] hover:text-white bg-[#162e4c] hover:bg-[#1d3d66] rounded-xl transition-all border border-[#2b4c74]"
              title="Return to regular travel planner & TripGenie interface"
            >
              <span className="material-symbols-outlined text-[16px]">travel_explore</span>
              <span>Traveler View</span>
            </button>

            {/* Refresh button */}
            <button
              onClick={() => {
                loadStats(true);
                if (activeTab === 'reservations') loadReservations();
              }}
              disabled={refreshing}
              className="p-1.5 text-[#93c5fd] hover:text-white bg-[#162e4c] hover:bg-[#1d3d66] rounded-xl transition-all border border-[#2b4c74]"
              title="Refresh statistics from database"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#2b4c74]">
              <div className="text-right hidden md:block">
                <p className="text-xs font-semibold text-white leading-tight">
                  {currentUser.name || 'Administrator'}
                </p>
                <p className="text-[10px] text-[#93c5fd]">{currentUser.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Mobile Traveler View button */}
        <div className="sm:hidden mb-4 flex justify-between items-center">
          <button
            onClick={onSwitchToTravelerView}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#006194] bg-white border border-[#e2e8f0] rounded-xl shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Switch to Traveler View</span>
          </button>
          <span className="text-xs font-mono text-slate-500">ADMIN: {currentUser.email}</span>
        </div>

        {/* Database Status Alert Banner */}
        {stats && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">database</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Database Engine: {stats.databaseType}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      stats.databaseStatus === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {stats.databaseStatus === 'connected' ? 'LIVE MYSQL CONNECTION' : 'PERSISTENT JSON ENGINE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                  {stats.databaseMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => handleExportCsv('users')}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="Export Users to CSV"
              >
                Export Users
              </button>
              <button
                onClick={() => handleExportCsv('reservations')}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                title="Export Hotel Reservations to CSV"
              >
                Export Bookings
              </button>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && !stats ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#006194]/20 border-t-[#006194] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              Connecting to secure database and loading metrics...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-red-500 shrink-0">
              error
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-sm">Failed to retrieve database metrics</h4>
              <p className="text-xs mt-1">{error}</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => loadStats()}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-xs"
                >
                  Retry Connection
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 bg-[#0c1e33] text-[#fde047] rounded-lg text-xs font-bold hover:bg-[#162e4c] transition-colors shadow-xs"
                >
                  Sign In Again as Admin
                </button>
              </div>
            </div>
          </div>
        ) : stats ? (
          /* Top Statistics Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Card 1: Registered Users */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registered Users
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalUsers}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {stats.totalAdmins} Admins
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Stored in database</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">group</span>
              </div>
            </div>

            {/* Card 2: Total Trips */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Trips & Itineraries
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalTrips}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Maharashtra Journeys
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Registered across travelers</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">map</span>
              </div>
            </div>

            {/* Card 3: Hotel Reservations */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hotel Reservations
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalReservations !== undefined ? stats.totalReservations : reservations.length}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    MTDC & Lodges
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Confirmed stays across 36 districts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">hotel</span>
              </div>
            </div>

            {/* Card 4: Total Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Expenses (₹)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    ₹{stats.totalExpensesUsd.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tracked ledger items in INR</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">payments</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab Navigation for Detailed Data */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-[#0c1e33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Overview & Tables
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'users'
                ? 'bg-[#0c1e33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Registered Users ({stats?.totalUsers || 0})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'trips'
                ? 'bg-[#0c1e33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Maharashtra Trips ({stats?.recentTrips?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'reservations'
                ? 'bg-[#0c1e33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Hotel Reservations</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
              {stats?.totalReservations ?? reservations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'audit'
                ? 'bg-[#0c1e33] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Security Audit Log
          </button>
        </div>

        {/* Tab Content */}
        {stats && (
          <div className="space-y-6">
            {/* Overview or Users View: User Registrations */}
            {(activeTab === 'overview' || activeTab === 'users') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      User Management & Database Dossiers
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click &quot;Inspect Dossier&quot; on any user to view all their trips, itineraries, expenses, and hotel bookings.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#006194] bg-[#f0f9ff] hover:bg-[#e0f2fe] rounded-xl border border-[#bae6fd] transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>New Account</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Deep Inspection & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentUsers.map((u: AdminUserRecord) => {
                        const isSelf = u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase();
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">
                                    {u.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {u.id}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  u.role === 'ADMIN'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role === 'ADMIN' && (
                                  <span className="material-symbols-outlined text-[12px]">shield</span>
                                )}
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Pre-existing'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleInspectUser(u.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                  title="Inspect all data of this user (trips, itineraries, expenses, reservations)"
                                >
                                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                                  <span>Inspect Dossier</span>
                                </button>

                                {isSelf ? (
                                  <span className="text-[11px] font-bold text-slate-400 px-2">You</span>
                                ) : (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete user"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Overview or Trips View: Maharashtra Trips */}
            {(activeTab === 'overview' || activeTab === 'trips') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Maharashtra Trips in Database ({stats.recentTrips.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live expeditions and itineraries registered across travelers
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportCsv('trips')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                  >
                    Export Trips CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Trip Name</th>
                        <th className="py-3 px-4">Destination & Region</th>
                        <th className="py-3 px-4">Travel Dates</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Budget Limit vs Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.recentTrips.map((t: AdminDashboardTrip) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {t.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            📍 {t.location}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {t.dates || 'Flexible Dates'} ({t.daysTotal} days)
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : t.status === 'Planned'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium">
                            <span className="text-emerald-700 font-bold">₹{Number(t.spentUsd || 0).toLocaleString('en-IN')}</span>
                            <span className="text-slate-400"> / ₹{Number(t.budgetLimitUsd || 0).toLocaleString('en-IN')}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hotel Reservations Tab */}
            {activeTab === 'reservations' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>Maharashtra Hotel Lodging & Reservations</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {reservations.length} Records
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Complete log of MTDC resorts, safari camps, and luxury hotel bookings across all 36 Maharashtra districts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadReservations}
                      disabled={loadingReservations}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 flex items-center gap-1"
                    >
                      <span className={`material-symbols-outlined text-[16px] ${loadingReservations ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => handleExportCsv('reservations')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                    >
                      Download CSV
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadReservations()}
                    placeholder="Search by booking ref, guest name, hotel, or city..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#006194]"
                  />
                  <select
                    value={reservationStatusFilter}
                    onChange={(e) => setReservationStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006194]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Hotel Property</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Guest Contact</th>
                        <th className="py-3 px-4">Dates & Nights</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Change Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reservations.map((res) => (
                        <tr key={res.id || res.booking_ref} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            {res.booking_ref}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{res.hotel_name}</span>
                            <span className="text-[11px] text-slate-500">{res.room_type_name}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            📍 {res.district}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{res.guest_name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{res.guest_email}</span>
                            <span className="text-[10px] text-slate-400 block">{res.guest_phone}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span>{res.check_in_date} → {res.check_out_date}</span>
                            <span className="text-[10px] text-slate-400 block">{res.nights_count} nights • {res.guests_count} guests</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            ₹{res.total_amount_inr?.toLocaleString('en-IN')}
                            <span className="text-[10px] text-slate-400 block font-normal">({res.payment_status})</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              res.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : res.status === 'Completed'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={res.status}
                              onChange={(e) => handleUpdateReservationStatus(res.id || res.booking_ref || '', e.target.value as any)}
                              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}

                      {reservations.length === 0 && !loadingReservations && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            No hotel lodging reservations found matching filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Logs View */}
            {(activeTab === 'overview' || activeTab === 'audit') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Security & Administrative Audit Log
                    </h3>
                    <p className="text-xs text-slate-500">
                      Immutable trail of admin actions and security occurrences
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportCsv('audit')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                  >
                    Export Audit CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin Email</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {stats.auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-semibold">
                            {log.admin_email}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-sans">
                            {log.details || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* User Deep Data Dossier Inspector Modal */}
      {isInspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-[#0c1e33] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-amber-400">travel_explore</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    User Complete Data Dossier & Journey History
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Deep inspection of account, trips, itineraries, expenses, and hotel bookings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              {loadingUserDossier ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-[#006194]/20 border-t-[#006194] rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Retrieving full relational data from database...</p>
                </div>
              ) : inspectedUser ? (
                <>
                  {/* User Profile Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#006194] text-white text-lg font-bold flex items-center justify-center shrink-0">
                        {inspectedUser.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{inspectedUser.user.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inspectedUser.user.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {inspectedUser.user.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inspectedUser.user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inspectedUser.user.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-600 mt-0.5">{inspectedUser.user.email} • ID: {inspectedUser.user.id}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Registered: {new Date(inspectedUser.user.created_at).toLocaleDateString()}
                          {inspectedUser.user.last_login_at && ` • Last Active: ${new Date(inspectedUser.user.last_login_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto text-center text-xs">
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Trips</span>
                        <span className="font-bold text-slate-900 text-sm">{inspectedUser.stats.totalTrips}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Expenses</span>
                        <span className="font-bold text-slate-900 text-sm">${inspectedUser.stats.totalSpentUsd}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Stays</span>
                        <span className="font-bold text-emerald-600 text-sm">{inspectedUser.stats.totalReservationsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: User's Trips */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">flight_takeoff</span>
                      <span>User Registered Trips ({inspectedUser.trips.length})</span>
                    </h4>
                    {inspectedUser.trips.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No trips created yet by this user.</p>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Trip Name</th>
                              <th className="py-2.5 px-3">Location</th>
                              <th className="py-2.5 px-3">Dates</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Budget vs Spent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectedUser.trips.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{t.name}</td>
                                <td className="py-2.5 px-3 text-slate-600">📍 {t.location}</td>
                                <td className="py-2.5 px-3 text-slate-500">{t.dates || 'Flexible'} ({t.daysTotal}d)</td>
                                <td className="py-2.5 px-3">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium">
                                  ${t.spentUsd} / ${t.budgetLimitUsd}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 2: User's Hotel Lodging Reservations */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-teal-600">hotel</span>
                      <span>Hotel & Resort Bookings ({inspectedUser.reservations.length})</span>
                    </h4>
                    {inspectedUser.reservations.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No hotel reservations on file for this user.</p>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Booking Ref</th>
                              <th className="py-2.5 px-3">Hotel & Room</th>
                              <th className="py-2.5 px-3">District</th>
                              <th className="py-2.5 px-3">Stay Dates</th>
                              <th className="py-2.5 px-3">Total Amount</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectedUser.reservations.map((res) => (
                              <tr key={res.id || res.booking_ref} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{res.booking_ref}</td>
                                <td className="py-2.5 px-3">
                                  <span className="font-semibold text-slate-900 block">{res.hotel_name}</span>
                                  <span className="text-[11px] text-slate-500">{res.room_type_name}</span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{res.district}</td>
                                <td className="py-2.5 px-3 text-slate-500">{res.check_in_date} to {res.check_out_date} ({res.nights_count}N)</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800">₹{res.total_amount_inr?.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    {res.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Section 3: User's Expenses */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">payments</span>
                      <span>Recorded Ledger Expenses ({inspectedUser.expenses.length})</span>
                    </h4>
                    {inspectedUser.expenses.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">No expenses recorded yet.</p>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Expense Title</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectedUser.expenses.map((exp) => (
                              <tr key={exp.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{exp.title}</td>
                                <td className="py-2.5 px-3 text-slate-600">{exp.category}</td>
                                <td className="py-2.5 px-3 text-slate-500">{exp.date || 'Recent'}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                  ₹{Number(exp.amountUsd || 0).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User / Admin Modal with Strict Zero Email Autofill */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0c1e33] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-400">person_add</span>
                <h3 className="font-bold text-sm">Create New Account in Database</h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Ramesh Kadam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006194]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Strictly No Autofill)</label>
                <input
                  type="email"
                  autoComplete="off"
                  name="admin_new_user_custom_email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006194]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006194]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Stored as salted bcrypt hash on the server.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign System Role</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewUserRole('USER')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newUserRole === 'USER'
                        ? 'border-[#006194] bg-[#f0f9ff] text-[#006194]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    USER (Traveler)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole('ADMIN')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      newUserRole === 'ADMIN'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ADMIN (Full Access)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#006194] hover:bg-[#004e77] rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
