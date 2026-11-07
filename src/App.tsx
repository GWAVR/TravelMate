import { useState, useEffect } from 'react';
import { ScreenTab, Expense, ItineraryActivity, UserProfile, Member, WorldPlace, TripDestination } from './types';
import { TRIP_DESTINATIONS, DEFAULT_USER, APP_ASSETS } from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { DashboardScreen } from './components/DashboardScreen';
import { ItineraryScreen } from './components/ItineraryScreen';
import { ExpensesScreen } from './components/ExpensesScreen';
import { TripGenieScreen } from './components/TripGenieScreen';
import { ExploreAIScreen } from './components/ExploreAIScreen';
import { LodgingScreen } from './components/LodgingScreen';
import { JournalScreen } from './components/JournalScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AuthScreen } from './components/AuthScreen';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import {
  getStoredToken,
  removeStoredToken,
  fetchCurrentProfile,
  updateUserProfileApi,
  fetchTripsApi,
  createTripApi,
  fetchExpensesApi,
  createExpenseApi,
} from './utils/authApi';
import { HotelReservation } from './types';
import { CreateTripModal } from './components/CreateTripModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ExpenseDetailsModal } from './components/ExpenseDetailsModal';
import { MapModal } from './components/MapModal';
import { PackingModal, EmergencyModal } from './components/TripToolkitModals';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { OfflineDiagnosticsModal } from './components/OfflineDiagnosticsModal';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import {
  getCachedExpenses,
  saveCachedExpenses,
  getCachedActivities,
  saveCachedActivities,
  getCachedUserProfile,
  saveCachedUserProfile,
  getCachedMembers,
  saveCachedMembers,
  getCachedTrips,
  saveCachedTrips,
  getAppMode,
  setAppMode,
  resetToFreshApp,
  loadDemoTrip,
  clearSessionAuth,
} from './utils/offlineStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/login') || path.startsWith('/signin') || path.startsWith('/signup') || path.startsWith('/register') || path.startsWith('/auth')) {
        return 'auth';
      }
      if (path.startsWith('/lodging') || path.startsWith('/hotels')) return 'lodging';
      if (path.startsWith('/tripgenie') || path.startsWith('/genie')) return 'tripgenie';
      if (path.startsWith('/expenses')) return 'expenses';
      if (path.startsWith('/itinerary')) return 'itinerary';
      if (path.startsWith('/explore')) return 'explore-ai';
      if (path.startsWith('/journal')) return 'journal';
      if (path.startsWith('/profile')) return 'profile';
    }
    const token = getStoredToken();
    const cachedUser = getCachedUserProfile();
    // Show login and signin page before travelmate opens if user is not authenticated
    if (!token && !cachedUser.isLoggedIn) {
      return 'auth';
    }
    return 'dashboard';
  });
  const [appMode, setAppModeState] = useState<'fresh' | 'demo'>(() => getAppMode());
  const [trips, setTrips] = useState<TripDestination[]>(() => getCachedTrips());
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    const cached = getCachedTrips();
    return cached[0]?.id || '';
  });

  const ADMIN_EMAILS = ['abhijeetraoavr@gmail.com', 'lokeshramkor650@gmail.com'];

  // Offline-first persistent state loaded directly from localStorage cache
  const [expenses, setExpenses] = useState<Expense[]>(() => getCachedExpenses());
  const [activities, setActivities] = useState<ItineraryActivity[]>(() => getCachedActivities());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const cached = getCachedUserProfile();
    const emailLower = (cached.email || '').trim().toLowerCase();
    if (ADMIN_EMAILS.includes(emailLower) || cached.role === 'ADMIN') {
      return { ...cached, role: 'ADMIN' };
    }
    return cached;
  });
  const [members, setMembers] = useState<Member[]>(() => getCachedMembers());
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/signup') || path.startsWith('/register')) return 'signup';
      if (path.startsWith('/admin-login')) return 'admin';
    }
    return 'signin';
  });

  // Synchronize browser history URLs with activeTab and modal states
  useEffect(() => {
    const handleUrlRouting = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/admin')) {
        setActiveTab('admin');
      } else if (path.startsWith('/signup') || path.startsWith('/register')) {
        setAuthModalInitialMode('signup');
        setActiveTab('auth');
      } else if (path.startsWith('/login') || path.startsWith('/signin') || path.startsWith('/auth')) {
        setAuthModalInitialMode('signin');
        setActiveTab('auth');
      } else if (path.startsWith('/admin-login')) {
        setAuthModalInitialMode('admin');
        setActiveTab('auth');
      }
    };
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  const loadReservations = () => {
    const token = getStoredToken();
    fetch('/api/lodging/reservations', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.reservations) {
          setReservations(data.reservations);
        }
      })
      .catch(() => {});
  };

  // Reconcile server-persisted trips, expenses, and reservations on boot
  useEffect(() => {
    fetchTripsApi()
      .then((serverTrips) => {
        if (serverTrips && serverTrips.length > 0) {
          setTrips(serverTrips);
          saveCachedTrips(serverTrips);
          if (!selectedTripId) {
            setSelectedTripId(serverTrips[0].id);
          }
        }
      })
      .catch(() => {});

    fetchExpensesApi()
      .then((serverExpenses) => {
        if (serverExpenses && serverExpenses.length > 0) {
          setExpenses(serverExpenses);
          saveCachedExpenses(serverExpenses);
        }
      })
      .catch(() => {});

    loadReservations();
  }, []);

  // Validate existing JWT token on app boot to ensure role is fresh from server
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      fetchCurrentProfile(token)
        .then((profile) => {
          if (profile) {
            const emailLower = (profile.email || '').trim().toLowerCase();
            const isAdmin = ADMIN_EMAILS.includes(emailLower) || profile.role === 'ADMIN';
            setCurrentUser((prev) => ({
              ...prev,
              ...profile,
              isLoggedIn: true,
              role: isAdmin ? 'ADMIN' : (profile.role || 'USER'),
            }));
            loadReservations();
          }
        })
        .catch(() => {
          // Keep cached profile if offline
        });
    }
  }, []);

  // Network & Cache Monitoring
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, diagnostics, refreshDiagnostics } =
    useNetworkStatus();
  const isOffline = !isOnline;

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [createTripPrefill, setCreateTripPrefill] = useState<any>(null);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | undefined>(undefined);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapSelectedPlace, setMapSelectedPlace] = useState<WorldPlace | null>(null);
  const [isPackingOpen, setIsPackingOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  // Safe active trip computation
  const fallbackTrip: TripDestination = {
    id: 'trip-fresh',
    name: 'Maharashtra Grand Tour',
    shortName: 'Maharashtra Tour',
    location: 'Maharashtra, India',
    country: 'India',
    dates: 'Nov 15 - Nov 22, 2026',
    daysTotal: 7,
    currentDay: 1,
    statusBadge: 'Fresh Trip',
    statusColor: 'bg-[#d1fae5] text-[#006c49]',
    daysLeftText: 'Plan to start',
    weatherTemp: '28°C',
    weatherCondition: 'Pleasant & Sunny',
    weatherRain: '0% rain',
    weatherIcon: 'wb_sunny',
    backgroundImage: TRIP_DESTINATIONS[0]?.backgroundImage || APP_ASSETS.maharashtraGateway,
    imageAlt: 'Maharashtra Gateway of India & Heritage',
    tagline: 'Historic forts, UNESCO caves, Konkan coastlines & Sahyadri trails',
    totalBudgetUsd: (currentUser.tripBudgetLimit && currentUser.tripBudgetLimit > 1000) ? currentUser.tripBudgetLimit : 45000,
    spentUsd: 0,
    todayScheduleTitle: "Day 1 Schedule",
    todayScheduleSub: 'Add stops to begin',
    paxCount: 4,
  };

  const selectedTrip = trips.length > 0
    ? (trips.find((t) => t.id === selectedTripId) || trips[0])
    : fallbackTrip;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const handleCreateTrip = (newTrip: TripDestination) => {
    const updated = [newTrip, ...trips];
    setTrips(updated);
    saveCachedTrips(updated);
    setSelectedTripId(newTrip.id);
    setAppModeState('fresh');
    setAppMode('fresh');
    refreshDiagnostics();

    // Persist permanently to backend database so trips are retained indefinitely
    const token = getStoredToken();
    createTripApi(newTrip, token || undefined).catch((err) => {
      console.warn('Backend trip persistence sync:', err.message);
    });
  };

  const handleOpenCreateTrip = (prefill?: any) => {
    setCreateTripPrefill(prefill || null);
    setIsCreateTripOpen(true);
  };

  const handleLoadDemoTrip = () => {
    const result = loadDemoTrip();
    setAppModeState('demo');
    setTrips(result.trips);
    setExpenses(result.expenses);
    setActivities(result.activities);
    setMembers(result.members);
    setSelectedTripId(result.trips[0]?.id || 'trip-sahyadri-heritage');
    refreshDiagnostics();
    showToast('✓ Loaded Maharashtra Grand Tour itinerary & expenses!');
  };

  const handleResetToFresh = () => {
    const result = resetToFreshApp();
    setAppModeState('fresh');
    setTrips(result.trips);
    setExpenses(result.expenses);
    setActivities(result.activities);
    setMembers(result.members);
    setSelectedTripId('');
    refreshDiagnostics();
    showToast('✓ Started fresh! Clean slate ready for your first trip.');
  };

  const handleOpenMap = (place?: WorldPlace) => {
    if (place) setMapSelectedPlace(place);
    setIsMapOpen(true);
  };

  const handleLoginSuccess = (updatedUser: UserProfile) => {
    const loggedInUser: UserProfile = {
      ...updatedUser,
      isLoggedIn: true,
      role: updatedUser.role || (['abhijeetraoavr@gmail.com', 'lokeshramkor650@gmail.com'].includes((updatedUser.email || '').toLowerCase()) ? 'ADMIN' : 'USER'),
    };
    setCurrentUser(loggedInUser);
    saveCachedUserProfile(loggedInUser);
    setIsAuthModalOpen(false);

    // Redirect admin logins to the admin dashboard per specifications
    if (loggedInUser.role === 'ADMIN') {
      setActiveTab('admin');
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      setActiveTab('dashboard');
      if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    }
    refreshDiagnostics();
    loadReservations();
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const emailLower = (updatedUser.email || '').trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(emailLower) || updatedUser.role === 'ADMIN';
    const userToSave: UserProfile = {
      ...updatedUser,
      role: isAdmin ? 'ADMIN' : (updatedUser.role || 'USER'),
    };
    setCurrentUser(userToSave);
    saveCachedUserProfile(userToSave);
    // Keep members synchronized with user updates
    setMembers((prev) =>
      prev.map((m, idx) =>
        idx === 0 || m.id === userToSave.id || m.email === userToSave.email
          ? {
              ...m,
              name: `${userToSave.name} (You)`,
              email: userToSave.email,
              avatar: userToSave.avatar,
            }
          : m
      )
    );
    refreshDiagnostics();

    // Persist to backend database if authenticated
    const token = getStoredToken();
    if (token) {
      updateUserProfileApi(
        {
          name: userToSave.name,
          bio: userToSave.bio,
          avatar: userToSave.avatar,
        },
        token
      ).catch((err) => {
        console.warn('Backend profile sync note:', err.message);
      });
    }
  };

  const handleUpdateMembers = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
    saveCachedMembers(updatedMembers);
    refreshDiagnostics();
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('travelmate_session_active');
    }
    clearSessionAuth();
    const loggedOutUser: UserProfile = {
      ...DEFAULT_USER,
      isLoggedIn: false,
      role: 'USER',
      token: undefined,
    };
    setCurrentUser(loggedOutUser);
    saveCachedUserProfile(loggedOutUser);
    removeStoredToken();
    showToast('Signed out of TravelMate. Please sign in or sign up to continue.');
    setIsAuthModalOpen(false);
    setActiveTab('auth');
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleOpenExpenseDetails = (id?: string) => {
    setSelectedExpenseId(id || 'EXP-8824-KYO');
    setIsExpenseDetailsOpen(true);
  };

  const handleSaveExpense = (newExpense: Expense) => {
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    saveCachedExpenses(updated);
    refreshDiagnostics();

    // Persist permanently to backend database so expenses are never auto-deleted
    const token = getStoredToken();
    createExpenseApi(newExpense, token || undefined).catch((err) => {
      console.warn('Backend expense persistence sync:', err.message);
    });

    const totalExpenseUsd = updated.reduce((sum, item) => sum + (item.amountUsd || 0), 0);
    const budgetLimit = currentUser.tripBudgetLimit ?? 45000;
    if (totalExpenseUsd > budgetLimit) {
      const overBy = totalExpenseUsd - budgetLimit;
      showToast(
        `⚠️ Budget Alert: Total trip expenses (₹${totalExpenseUsd.toLocaleString('en-IN')}) have exceeded your profile limit (₹${budgetLimit.toLocaleString('en-IN')}) by ₹${overBy.toLocaleString('en-IN')}!`
      );
    } else {
      showToast(`✓ Expense saved & stored in database (${newExpense.title})`);
    }
  };

  const handleAddActivity = (newActivity: ItineraryActivity) => {
    const updated = [newActivity, ...activities];
    setActivities(updated);
    saveCachedActivities(updated);
    refreshDiagnostics();
  };

  const handleDeleteActivity = (id: string) => {
    const updated = activities.filter((act) => act.id !== id);
    setActivities(updated);
    saveCachedActivities(updated);
    refreshDiagnostics();
  };

  const handleResetData = (newExpenses: Expense[], newActivities: ItineraryActivity[]) => {
    setExpenses(newExpenses);
    setActivities(newActivities);
    refreshDiagnostics();
  };

  // If user is not logged in, present Log In and Sign In / Sign Up option FIRST!
  if (!currentUser.isLoggedIn) {
    const isDirectAdminUrl = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
    const isDirectSignUpUrl = typeof window !== 'undefined' && (window.location.pathname.startsWith('/signup') || window.location.pathname.startsWith('/register'));
    const initialMode = isDirectAdminUrl ? 'admin' : (isDirectSignUpUrl ? 'signup' : 'signin');
    return (
      <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col items-center justify-center selection:bg-[#006194]/20 py-8 px-4">
        <Toast message={toastMessage} />
        <div className="w-full max-w-md">
          <AuthScreen
            initialMode={initialMode}
            currentUser={currentUser}
            onLoginSuccess={handleLoginSuccess}
            onShowToast={showToast}
          />
        </div>
      </div>
    );
  }

  const isFullscreenView = activeTab === 'auth';

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col items-center selection:bg-[#006194]/20 w-full">
      {/* Toast Notification Banner */}
      <Toast message={toastMessage} />

      {/* Persistent App Header */}
      {!isFullscreenView && (
        <Header
          activeTripName={trips.length > 0 ? selectedTrip.shortName : 'Plan First Trip'}
          activeTripDates={trips.length > 0 ? selectedTrip.dates : 'Fresh App'}
          activeTab={activeTab}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenProfile={() => setActiveTab('profile')}
          onSelectTrip={(tripIdOrName) => {
            const found = trips.find(
              (t) => t.id === tripIdOrName || t.name === tripIdOrName || t.shortName === tripIdOrName
            );
            if (found) {
              setSelectedTripId(found.id);
              showToast(`Switched trip destination to ${found.shortName}`);
            }
          }}
          trips={trips}
          onOpenCreateTrip={() => handleOpenCreateTrip()}
          onLoadDemoTrip={handleLoadDemoTrip}
          appMode={appMode}
          onOpenJournal={() => setActiveTab('journal')}
          onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
          onOpenAuth={(mode) => {
            setAuthModalInitialMode(mode || 'signin');
            setIsAuthModalOpen(true);
          }}
          onOpenTripGenie={() => setActiveTab('tripgenie')}
          onOpenAdmin={() => {
            const isAdmin = currentUser.role === 'ADMIN' || ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase());
            setActiveTab('admin');
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
              window.history.pushState({}, '', '/admin');
            }
            if (!isAdmin) {
              setAuthModalInitialMode('admin');
            }
          }}
          currentUser={currentUser}
          isOffline={isOffline}
        />
      )}

      {/* Offline Status Bar banner when offline or in simulation mode */}
      {!isFullscreenView && (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <OfflineStatusBar onOpenDiagnostics={() => setIsOfflineModalOpen(true)} />
        </div>
      )}

      {/* Main Container */}
      <main className={`w-full ${activeTab === 'admin' ? 'max-w-none pt-0 pb-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ' + (isOffline ? 'pt-2 pb-24' : 'pt-4 pb-24')} flex-1 flex flex-col`}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onShowToast={showToast}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenPacking={() => setIsPackingOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
            onOpenExpenseDetails={() => handleOpenExpenseDetails('EXP-8824-MH')}
            selectedTrip={selectedTrip}
            onSelectTrip={(tripId) => {
              setSelectedTripId(tripId);
            }}
            trips={trips}
            onOpenCreateTrip={handleOpenCreateTrip}
            onLoadDemoTrip={handleLoadDemoTrip}
            onResetToFresh={handleResetToFresh}
            appMode={appMode}
            expenses={expenses}
            activities={activities}
            members={members}
            reservations={reservations}
            currentUser={currentUser}
            onUpdateMembers={handleUpdateMembers}
            onUpdateUser={handleUpdateUser}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryScreen
            activities={activities}
            onAddActivity={handleAddActivity}
            onDeleteActivity={handleDeleteActivity}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onOpenMap={() => setIsMapOpen(true)}
            onShowToast={showToast}
            onOpenExpenseDetails={() => handleOpenExpenseDetails('EXP-8824-KYO')}
            isOffline={isOffline}
            onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
            trip={selectedTrip}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesScreen
            expenses={expenses}
            onOpenExpenseDetails={(id) => handleOpenExpenseDetails(id)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
            onShowToast={showToast}
            isOffline={isOffline}
            onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
            members={members}
            currentUser={currentUser}
            budgetLimit={selectedTrip.totalBudgetUsd || currentUser.tripBudgetLimit}
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        )}

        {activeTab === 'tripgenie' && (
          <TripGenieScreen
            trip={selectedTrip}
            itinerary={activities}
            expenses={expenses}
            members={members}
            user={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onShowToast={showToast}
            onOpenMap={() => setIsMapOpen(true)}
            onOpenPacking={() => setIsPackingOpen(true)}
            onOpenAddExpense={() => setIsAddExpenseOpen(true)}
          />
        )}

        {activeTab === 'explore-ai' && (
          <ExploreAIScreen
            onShowToast={showToast}
            onOpenMap={handleOpenMap}
            onOpenPacking={() => setIsPackingOpen(true)}
            onAddActivity={handleAddActivity}
            onSelectTripDestination={(place) => {
              const matched = trips.find(
                (t) =>
                  t.country.toLowerCase().includes(place.country.toLowerCase()) ||
                  t.name.toLowerCase().includes(place.city.toLowerCase()) ||
                  t.location.toLowerCase().includes(place.city.toLowerCase())
              );
              if (matched) {
                setSelectedTripId(matched.id);
                showToast(`Switched active trip to ${matched.shortName}`);
              } else {
                handleOpenCreateTrip({
                  name: `${place.city} Expedition`,
                  location: `${place.city}, ${place.country}`,
                  country: place.country,
                  image: place.heroImage,
                  tagline: place.tagline,
                });
              }
            }}
          />
        )}

        {activeTab === 'lodging' && (
          <LodgingScreen
            currentUser={currentUser}
            onOpenMapWithCoordinates={(lat, lng, title) => {
              handleOpenMap();
              showToast(`📍 Opening Maharashtra map for ${title}`);
            }}
          />
        )}

        {activeTab === 'journal' && (
          <JournalScreen
            onShowToast={showToast}
            onOpenExpenseDetails={() => handleOpenExpenseDetails('EXP-8824-KYO')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            currentUser={currentUser}
            onBack={() => setActiveTab('dashboard')}
            onShowToast={showToast}
            onOpenAuth={() => {
              setAuthModalInitialMode('signin');
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            activeTripName={selectedTrip.name}
            onUpdateActiveTrip={(newName) => {
              if (selectedTrip) {
                const updatedTrips = trips.map((t) =>
                  t.id === selectedTrip.id ? { ...t, name: newName, shortName: newName } : t
                );
                setTrips(updatedTrips);
                saveCachedTrips(updatedTrips);
                showToast(`✓ Active trip destination renamed to "${newName}"`);
              }
            }}
            members={members}
            onUpdateMembers={handleUpdateMembers}
            onResetData={handleResetData}
            appMode={appMode}
            onResetToFresh={handleResetToFresh}
            onLoadDemoTrip={handleLoadDemoTrip}
            onOpenAdmin={() => {
              const isAdmin = currentUser.role === 'ADMIN' || ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase());
              if (isAdmin) {
                setActiveTab('admin');
                if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
                  window.history.pushState({}, '', '/admin');
                }
              } else {
                setAuthModalInitialMode('admin');
                setIsAuthModalOpen(true);
              }
            }}
          />
        )}

        {activeTab === 'admin' && (
          ((currentUser.role === 'ADMIN' || ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase())) && currentUser.isLoggedIn && Boolean(getStoredToken())) ? (
            <AdminDashboardScreen
              currentUser={currentUser}
              onLogout={handleLogout}
              onSwitchToTravelerView={() => {
                setActiveTab('dashboard');
                if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                  window.history.pushState({}, '', '/');
                }
              }}
              onShowToast={showToast}
            />
          ) : (
            <div className="w-full max-w-xl mx-auto py-8 px-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#0c1e33] to-[#1e3a5f] p-6 text-white text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <span className="material-symbols-outlined text-[32px] text-amber-300">shield_person</span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Administrator Portal
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                    Sign in with your verified administrator credentials to access the TravelMate Super Admin Console.
                  </p>
                </div>
                <div className="p-6">
                  <AuthScreen
                    initialMode="admin"
                    currentUser={currentUser}
                    onLoginSuccess={(user) => {
                      handleLoginSuccess(user);
                      setActiveTab('admin');
                    }}
                    onShowToast={showToast}
                  />
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'auth' && (
          <div className="min-h-[75vh] flex items-center justify-center py-6">
            <div className="w-full max-w-lg">
              <AuthScreen
                initialMode={authModalInitialMode}
                currentUser={currentUser}
                onLoginSuccess={handleLoginSuccess}
                onShowToast={showToast}
              />
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Navigation & FAB */}
      {!isFullscreenView && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onQuickAdd={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* Global Modals */}
      <CreateTripModal
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onCreateTrip={handleCreateTrip}
        onShowToast={showToast}
        prefillDestination={createTripPrefill}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsAuthModalOpen(false)}
        onShowToast={showToast}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSaveExpense={handleSaveExpense}
        onShowToast={showToast}
        members={members}
        currentUser={currentUser}
      />

      <ExpenseDetailsModal
        isOpen={isExpenseDetailsOpen}
        expenseId={selectedExpenseId}
        expenses={expenses}
        onClose={() => setIsExpenseDetailsOpen(false)}
        onShowToast={showToast}
      />

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onShowToast={showToast}
        initialPlace={mapSelectedPlace}
        onAddActivity={handleAddActivity}
        onOpenHotelBooking={() => setActiveTab('lodging')}
      />

      <PackingModal
        isOpen={isPackingOpen}
        onClose={() => setIsPackingOpen(false)}
        onShowToast={showToast}
      />

      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        onShowToast={showToast}
      />

      {/* Offline Storage & Diagnostics Modal */}
      <OfflineDiagnosticsModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        onShowToast={showToast}
        onDataReset={handleResetData}
      />
    </div>
  );
}

