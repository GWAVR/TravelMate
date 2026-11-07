import React, { useState, useEffect } from 'react';
import { HotelLodging, HotelRoomType, HotelReservation, UserProfile } from '../types';
import { createReservationApi } from '../utils/authApi';

interface HotelBookingModalProps {
  hotel: HotelLodging | null;
  initialRoomType?: HotelRoomType | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (reservation: HotelReservation) => void;
  currentUser?: UserProfile | null;
}

export const HotelBookingModal: React.FC<HotelBookingModalProps> = ({
  hotel,
  initialRoomType,
  isOpen,
  onClose,
  onBookingSuccess,
  currentUser,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomType | null>(null);

  // Date calculation defaults: tomorrow and 2 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const [checkIn, setCheckIn] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState<string>(dayAfter.toISOString().split('T')[0]);
  const [guestsCount, setGuestsCount] = useState<number>(2);

  // Guest details - Zero email autofill rule enforced strictly
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentOption, setPaymentOption] = useState<'Pay at Hotel' | 'Paid'>('Pay at Hotel');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<HotelReservation | null>(null);

  useEffect(() => {
    if (hotel) {
      if (initialRoomType) {
        setSelectedRoom(initialRoomType);
      } else if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        setSelectedRoom(hotel.roomTypes[0]);
      }
    }
  }, [hotel, initialRoomType]);

  useEffect(() => {
    if (isOpen) {
      // Reset form state on open with zero email autofill
      setGuestEmail('');
      setGuestPhone('');
      setGuestName(currentUser?.name || '');
      setSpecialRequests('');
      setErrorMsg(null);
      setConfirmedBooking(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !hotel) return null;

  // Calculate nights
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const calculatedNights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const currentRoom = selectedRoom || hotel.roomTypes[0] || {
    id: 'std',
    name: 'Deluxe Room',
    pricePerNightInr: hotel.pricePerNightInr,
    pricePerNightUsd: hotel.pricePerNightUsd,
    bedType: '1 King Bed',
    capacity: '2 Adults',
    amenities: ['Wi-Fi', 'AC', 'Breakfast Included'],
  };

  const currentRoomRateInr = currentRoom.priceInr ?? currentRoom.pricePerNightInr ?? hotel.pricePerNightInr;
  const roomSubtotalInr = currentRoomRateInr * calculatedNights;
  const gstAmountInr = Math.round(roomSubtotalInr * 0.12);
  const totalAmountInr = roomSubtotalInr + gstAmountInr;
  const totalAmountUsd = Math.round(totalAmountInr / 84);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!guestName.trim()) {
      setErrorMsg('Please enter primary guest full name.');
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes('@')) {
      setErrorMsg('Please enter a valid guest email address.');
      return;
    }
    if (!guestPhone.trim() || guestPhone.length < 8) {
      setErrorMsg('Please enter a valid contact phone number.');
      return;
    }
    if (checkInDate >= checkOutDate) {
      setErrorMsg('Check-out date must be after check-in date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelImage: hotel.image,
        district: hotel.district,
        city: hotel.city,
        roomTypeId: currentRoom.id,
        roomTypeName: currentRoom.name,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nightsCount: calculatedNights,
        guestsCount: Number(guestsCount),
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim(),
        roomRatePerNightInr: currentRoomRateInr,
        totalAmountInr,
        totalAmountUsd,
        paymentStatus: paymentOption,
        userId: currentUser?.id,
      };

      const result = await createReservationApi(payload, currentUser?.token);
      setConfirmedBooking(result.reservation);
      onBookingSuccess(result.reservation);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete hotel booking. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Top Header */}
        <div className="relative h-32 sm:h-40 overflow-hidden bg-slate-800">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60 z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {hotel.district} • {hotel.type}
              </span>
              <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                ★ {hotel.rating} ({hotel.reviewsCount})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight line-clamp-1">
              {hotel.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {confirmedBooking ? (
            /* Booking Confirmation Voucher View */
            <div className="space-y-5 py-2 animate-fadeIn">
              <div className="text-center py-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">Booking Confirmed!</h3>
                <p className="text-sm text-emerald-400 mt-1 font-mono">
                  Reservation Voucher: <span className="font-bold">{confirmedBooking.bookingRef || confirmedBooking.booking_ref}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Instant confirmation details have been recorded in the TravelMate Maharashtra lodging system.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Hotel Property</span>
                  <span className="text-white font-medium text-right">{confirmedBooking.hotelName || confirmedBooking.hotel_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white font-medium text-right">{confirmedBooking.city}, {confirmedBooking.district}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Selected Room</span>
                  <span className="text-emerald-400 font-medium">{confirmedBooking.roomTypeName || confirmedBooking.room_type_name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Stay Duration</span>
                  <span className="text-white font-medium">{confirmedBooking.checkInDate || confirmedBooking.check_in_date} to {confirmedBooking.checkOutDate || confirmedBooking.check_out_date} ({confirmedBooking.nightsCount || confirmedBooking.nights_count} nights)</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Primary Guest</span>
                  <span className="text-white font-medium">{confirmedBooking.guestName || confirmedBooking.guest_name} ({confirmedBooking.guestsCount || confirmedBooking.guests_count} Guests)</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                  <span className="text-slate-400">Payment Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {confirmedBooking.paymentStatus || confirmedBooking.payment_status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 text-base font-bold">
                  <span className="text-slate-300">Total Billed Amount</span>
                  <span className="text-amber-400">₹{((confirmedBooking.totalAmountInr ?? confirmedBooking.total_amount_inr) || 0).toLocaleString('en-IN')} (approx ${confirmedBooking.totalAmountUsd ?? confirmedBooking.total_amount_usd})</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Print Voucher
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Room Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {hotel.roomTypes.map((rt) => {
                    const isSelected = currentRoom.id === rt.id;
                    return (
                      <div
                        key={rt.id}
                        onClick={() => setSelectedRoom(rt)}
                        className={`p-3 rounded-2xl cursor-pointer border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                            : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-white">{rt.name}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-1.5">{rt.bedType} • {rt.capacity || `${rt.maxGuests || 2} Guests`}</p>
                          <div className="flex flex-wrap gap-1">
                            {(rt.amenities || []).slice(0, 2).map((a, idx) => (
                              <span key={idx} className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">Rate / night</span>
                          <span className="text-emerald-400 font-bold text-sm">
                            ₹{((rt.priceInr ?? rt.pricePerNightInr) || hotel.pricePerNightInr).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stay Dates & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Total Guests
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults / Family</option>
                  </select>
                </div>
              </div>

              {/* Guest Details with Strict Zero Email Autofill */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Guest Contact Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs text-slate-400 mb-1">Primary Guest Full Name *</span>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Rahul Patil"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400 mb-1">Mobile / WhatsApp Number *</span>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">Guest Email ID (Strictly No Autofill) *</span>
                  <input
                    type="email"
                    autoComplete="off"
                    name="booking_guest_custom_email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter recipient email for reservation confirmation"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 mb-1">Special Requests / Arrival Notes (Optional)</span>
                  <input
                    type="text"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Early check-in requested, high floor, MTDC member discount"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Payment Option */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setPaymentOption('Pay at Hotel')}
                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                      paymentOption === 'Pay at Hotel'
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">🏨 Pay at Hotel</div>
                    <div className="text-xs text-slate-400 mt-0.5">Pay upon check-in at reception</div>
                  </div>
                  <div
                    onClick={() => setPaymentOption('Paid')}
                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                      paymentOption === 'Paid'
                        ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">💳 Instant Prepaid</div>
                    <div className="text-xs text-slate-400 mt-0.5">UPI / NetBanking / Cards</div>
                  </div>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Room rate (₹{currentRoomRateInr.toLocaleString('en-IN')} × {calculatedNights} nights)</span>
                  <span>₹{roomSubtotalInr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Maharashtra Tourism & Govt GST (12%)</span>
                  <span>₹{gstAmountInr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-700/50 text-sm font-bold text-white">
                  <span>Total Payable</span>
                  <span className="text-amber-400 text-base">
                    ₹{totalAmountInr.toLocaleString('en-IN')}
                    <span className="text-xs text-slate-400 font-normal ml-1.5">(~${totalAmountUsd})</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Confirming Reservation...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
