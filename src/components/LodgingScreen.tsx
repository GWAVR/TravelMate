import React, { useState, useEffect, useMemo } from 'react';
import { HotelLodging, HotelRoomType, HotelReservation, UserProfile } from '../types';
import { MAHARASHTRA_HOTELS } from '../data/maharashtraHotelsData';
import { MAHARASHTRA_DISTRICTS } from '../data/maharashtraPlacesData';
import { HotelBookingModal } from './HotelBookingModal';
import { fetchUserReservationsApi } from '../utils/authApi';

interface LodgingScreenProps {
  currentUser?: UserProfile | null;
  onOpenMapWithCoordinates?: (lat: number, lng: number, title: string) => void;
}

export const LodgingScreen: React.FC<LodgingScreenProps> = ({
  currentUser,
  onOpenMapWithCoordinates,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'directory' | 'my_bookings'>('directory');

  // Booking Modal State
  const [bookingModalHotel, setBookingModalHotel] = useState<HotelLodging | null>(null);
  const [bookingModalRoom, setBookingModalRoom] = useState<HotelRoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // User Reservations
  const [userReservations, setUserReservations] = useState<HotelReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false);

  // Lodging categories
  const lodgingTypes = [
    'ALL',
    'MTDC Resort',
    'Heritage & Luxury',
    'Hill Resort & Forest Retreat',
    'Wildlife & Safari Lodge',
    'Pilgrimage & Heritage',
    'Wine Estate & Resort',
  ];

  const loadReservations = async () => {
    setIsLoadingReservations(true);
    try {
      const res = await fetchUserReservationsApi(currentUser?.token, currentUser?.id);
      setUserReservations(res);
    } catch {
      // Fallback
    } finally {
      setIsLoadingReservations(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [currentUser]);

  const handleBookNow = (hotel: HotelLodging, roomType?: HotelRoomType) => {
    setBookingModalHotel(hotel);
    setBookingModalRoom(roomType || hotel.roomTypes[0] || null);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = (newReservation: HotelReservation) => {
    setUserReservations((prev) => [newReservation, ...prev]);
  };

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return MAHARASHTRA_HOTELS.filter((hotel) => {
      if (selectedDistrict !== 'ALL' && hotel.district !== selectedDistrict) {
        return false;
      }
      if (selectedType !== 'ALL' && !hotel.type.toLowerCase().includes(selectedType.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = hotel.name.toLowerCase().includes(q);
        const matchesCity = hotel.city.toLowerCase().includes(q);
        const matchesDistrict = hotel.district.toLowerCase().includes(q);
        const matchesTagline = hotel.tagline.toLowerCase().includes(q);
        const matchesAmenities = hotel.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesDistrict && !matchesTagline && !matchesAmenities) {
          return false;
        }
      }
      return true;
    });
  }, [selectedDistrict, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 pt-4 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/20 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
            <span>Official Maharashtra Tourism & Lodging</span>
            <span>•</span>
            <span>All 36 Districts</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Maharashtra Hotels, MTDC Resorts & Jungle Lodges
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            From iconic Arabian Sea heritage landmarks and Konkan coastal MTDC resorts to Sahyadri misty hill retreats and Tadoba tiger safari jungle camps. Book verified accommodations with guaranteed instant confirmation.
          </p>

          {/* Quick Tab Switcher */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>🏨 Explore Lodgings ({MAHARASHTRA_HOTELS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my_bookings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'my_bookings'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <span>📋 My Reservations ({userReservations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'my_bookings' ? (
        /* My Reservations Tab */
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Your Confirmed Reservations</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {userReservations.length} Active
              </span>
            </h2>
            <button
              onClick={loadReservations}
              disabled={isLoadingReservations}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {userReservations.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
                🏨
              </div>
              <h3 className="text-lg font-bold text-white">No Hotel Bookings Found</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
                You haven&apos;t reserved any MTDC resorts or hotels yet. Explore top properties across Maharashtra to book your stay.
              </p>
              <button
                onClick={() => setActiveTab('directory')}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-500/20"
              >
                Browse Maharashtra Hotels
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userReservations.map((res) => {
                const bookingRef = res.bookingRef || res.booking_ref || res.id;
                const hotelName = res.hotelName || res.hotel_name || 'Hotel';
                const hotelImage = res.hotelImage || res.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80';
                const roomTypeName = res.roomTypeName || res.room_type_name || 'Room';
                const checkInDate = res.checkInDate || res.check_in_date;
                const checkOutDate = res.checkOutDate || res.check_out_date;
                const nightsCount = res.nightsCount || res.nights_count || 1;
                const guestsCount = res.guestsCount || res.guests_count || 2;
                const totalAmountInr = (res.totalAmountInr ?? res.total_amount_inr) || 0;
                const paymentStatus = res.paymentStatus || res.payment_status || 'Pay at Hotel';

                return (
                  <div
                    key={res.id || bookingRef}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all space-y-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={hotelImage}
                        alt={hotelName}
                        className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            {bookingRef}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            res.status === 'Confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : res.status === 'Completed'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {res.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-base truncate mt-1">{hotelName}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          📍 {res.city}, {res.district}
                        </p>
                        <p className="text-xs text-slate-300 mt-1 font-medium">
                          🛏️ {roomTypeName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/40 border border-slate-800 rounded-2xl text-xs text-center">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Check-In</span>
                        <span className="font-semibold text-slate-200">{checkInDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Check-Out</span>
                        <span className="font-semibold text-slate-200">{checkOutDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Stay</span>
                        <span className="font-semibold text-slate-200">{nightsCount}N • {guestsCount}G</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400">Total Billed: </span>
                        <span className="text-amber-400 font-bold text-sm">₹{totalAmountInr.toLocaleString('en-IN')}</span>
                        <span className="text-slate-500 ml-1">({paymentStatus})</span>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                      >
                        Print Voucher
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Directory View */
        <div className="space-y-6 animate-fadeIn">
          {/* Search and Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by hotel name, city, MTDC, pool, safari, spa..."
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* District Filter (All 36 Districts) */}
              <div className="w-full sm:w-64">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="ALL">All 36 Districts</option>
                  {MAHARASHTRA_DISTRICTS.map((dist) => (
                    <option key={dist.id} value={dist.name}>
                      {dist.name} District
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lodging Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-slate-400 shrink-0 font-medium mr-1">Category:</span>
              {lodgingTypes.map((t) => {
                const isSelected = selectedType === t;
                const label = t === 'ALL' ? 'All Stays' : t;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium ${
                      isSelected
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Count and Quick Stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredHotels.length}</strong> verified accommodations across Maharashtra
              {selectedDistrict !== 'ALL' && ` in ${selectedDistrict}`}
            </span>
            <span>All prices include verified MTDC & resort rates</span>
          </div>

          {/* Hotel Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="group bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-48 overflow-hidden bg-slate-800">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/90 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                        {hotel.district}
                      </span>
                      {hotel.type.includes('MTDC') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow">
                          MTDC OFFICIAL
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-amber-400 border border-amber-500/30 backdrop-blur-sm flex items-center gap-1">
                        ★ {hotel.rating}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-xs text-slate-300 line-clamp-1 italic">
                        &quot;{hotel.tagline}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Hotel Info */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium text-emerald-400">{hotel.type}</span>
                      <span>📍 {hotel.city}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {hotel.description}
                    </p>

                    {/* Amenities Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/40 text-slate-500">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with Pricing and Action */}
                <div className="p-5 pt-0 border-t border-slate-800/60 mt-3">
                  <div className="flex items-baseline justify-between pt-3 mb-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Starting from</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-amber-400">
                          ₹{hotel.pricePerNightInr.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-400">/ night</span>
                        <span className="text-[11px] text-slate-500 ml-1">(~${hotel.pricePerNightUsd})</span>
                      </div>
                    </div>

                    {onOpenMapWithCoordinates && (
                      <button
                        type="button"
                        onClick={() => onOpenMapWithCoordinates(hotel.coordinates.lat, hotel.coordinates.lng, hotel.name)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                        title="View hotel on interactive map"
                      >
                        🗺️ Map
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleBookNow(hotel)}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Book Room Reservation</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredHotels.length === 0 && (
            <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="text-3xl mb-3">🏨</div>
              <h3 className="text-base font-bold text-white">No Hotels Found Matching Filters</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                Try clearing your search query or selecting &quot;All 36 Districts&quot; to see available Maharashtra accommodations.
              </p>
              <button
                onClick={() => {
                  setSelectedDistrict('ALL');
                  setSelectedType('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reservation Booking Modal with Zero Email Autofill */}
      <HotelBookingModal
        hotel={bookingModalHotel}
        initialRoomType={bookingModalRoom}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
        currentUser={currentUser}
      />
    </div>
  );
};
