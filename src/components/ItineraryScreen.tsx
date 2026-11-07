import { useState } from 'react';
import { APP_ASSETS } from '../data/mockData';
import { ItineraryActivity, TripDestination } from '../types';
import { AddActivityModal } from './AddActivityModal';

interface ItineraryScreenProps {
  activities: ItineraryActivity[];
  onAddActivity?: (activity: ItineraryActivity) => void;
  onDeleteActivity?: (id: string) => void;
  onOpenAddExpense: () => void;
  onOpenMap: () => void;
  onShowToast: (msg: string) => void;
  onOpenExpenseDetails?: () => void;
  isOffline?: boolean;
  onOpenOfflineModal?: () => void;
  trip?: TripDestination;
}

export function ItineraryScreen({
  activities,
  onAddActivity,
  onDeleteActivity,
  onOpenAddExpense,
  onOpenMap,
  onShowToast,
  onOpenExpenseDetails,
  isOffline = false,
  onOpenOfflineModal,
  trip,
}: ItineraryScreenProps) {
  const [selectedDay, setSelectedDay] = useState(trip?.currentDay || 1);
  const [showSwapCard, setShowSwapCard] = useState(true);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  const totalDays = trip?.daysTotal || 7;
  const days = Array.from({ length: Math.min(14, totalDays) }, (_, i) => {
    const dayNum = i + 1;
    return {
      day: dayNum,
      date: `Day ${dayNum}`,
      status: dayNum < (trip?.currentDay || 1) ? 'done' : dayNum === (trip?.currentDay || 1) ? 'active' : 'normal',
      temp: trip?.weatherTemp || '22°C',
      icon: trip?.weatherIcon || 'wb_sunny',
    };
  });

  const currentDayActivities = activities.filter((act) => act.day === selectedDay);

  const handleSaveActivity = (newAct: ItineraryActivity) => {
    if (onAddActivity) {
      onAddActivity(newAct);
    }
  };

  return (
    <div className="flex flex-col w-full px-4 pb-12 space-y-4">
      {/* Day Overview Bar & Add Action */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-[#131b2e] truncate">
              {trip?.name || 'Your Trip Itinerary'}
            </span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e2e7ff] text-[#006194] text-[11px] font-bold">
              {currentDayActivities.length}
            </span>
          </div>
          <p className="text-[11px] text-[#64748b]">
            {currentDayActivities.length} activities scheduled • Day {selectedDay} of {totalDays}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddActivityOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#006194] text-white text-xs font-semibold shadow-xs active:scale-95 transition-transform shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
            <span>Add Stop</span>
          </button>
        </div>
      </div>

      {/* Offline Storage Status Indicator */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-[#ea580c] animate-pulse' : 'bg-[#10b981]'}`} />
          <span className="text-[11px] text-[#475569]">
            {isOffline
              ? 'Offline Mode Active • Itinerary loaded from localStorage cache'
              : 'LocalStorage Caching: Ready • Works seamlessly offline'}
          </span>
        </div>
        {onOpenOfflineModal && (
          <button
            onClick={onOpenOfflineModal}
            className="text-[11px] text-[#006194] font-bold hover:underline flex items-center gap-0.5"
            type="button"
          >
            <span>Cache Status</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Horizontal Day Selector Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar snap-x snap-mandatory">
        {days.map((item) => {
          const isSelected = selectedDay === item.day;
          if (isSelected) {
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className="snap-start flex flex-col items-center justify-between w-24 py-2.5 px-2 rounded-2xl bg-[#006194] text-white shrink-0 shadow-md active:scale-95 transition-all text-center"
                type="button"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#e0f2fe] uppercase tracking-wider font-bold">
                    Day {item.day}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fef3c7]" />
                </div>
                <span className="text-sm text-white my-0.5 font-bold">{item.date}</span>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] text-white font-medium">
                  <span className="material-symbols-outlined text-[12px]">{item.icon}</span>
                  <span>{item.temp}</span>
                </div>
              </button>
            );
          }

          if (item.status === 'done') {
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className="snap-start flex flex-col items-center justify-between w-20 py-2.5 px-1.5 rounded-2xl bg-[#f2f3ff] text-[#131b2e] shrink-0 active:scale-95 transition-all text-center hover:bg-[#e2e7ff]"
                type="button"
              >
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                  Day {item.day}
                </span>
                <span className="text-xs font-bold text-[#131b2e] my-0.5">{item.date}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#006c49] font-semibold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span> Done
                </span>
              </button>
            );
          }

          if (item.status === 'rain') {
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className="snap-start flex flex-col items-center justify-between w-22 py-2.5 px-2 rounded-2xl bg-[#eaedff] text-[#131b2e] shrink-0 active:scale-95 transition-all text-center hover:bg-[#dae2fd]"
                type="button"
              >
                <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                  Day {item.day}
                </span>
                <span className="text-xs font-bold text-[#131b2e] my-0.5">{item.date}</span>
                <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#ffe4e6] text-[10px] text-[#f43f5e] font-bold">
                  <span className="material-symbols-outlined text-[12px]">rainy</span>
                  <span>{item.temp}</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.day}
              onClick={() => setSelectedDay(item.day)}
              className="snap-start flex flex-col items-center justify-between w-20 py-2.5 px-1.5 rounded-2xl bg-[#f2f3ff] text-[#131b2e] shrink-0 active:scale-95 transition-all text-center hover:bg-[#e2e7ff]"
              type="button"
            >
              <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold">
                Day {item.day}
              </span>
              <span className="text-xs font-bold text-[#131b2e] my-0.5">{item.date}</span>
              <div className="inline-flex items-center gap-0.5 text-[10px] text-[#825100]">
                <span className="material-symbols-outlined text-[13px]">{item.icon}</span>
                <span>{item.temp}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* AI Smart Swap Alert Card */}
      {showSwapCard && selectedDay === 3 && (trip?.shortName.toLowerCase().includes('kyoto') || activities.some(a => a.title.toLowerCase().includes('arashiyama'))) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#e0f2fe] via-[#e2e7ff] to-[#dae2fd] p-4 shadow-sm border border-[#006194]/20 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#006194] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[#006194] font-bold">
                  Weather Assist • Kyoto
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#f43f5e] bg-[#ffe4e6] px-2 py-0.5 rounded-full font-bold">
                  Rain expected
                </span>
              </div>
              <p className="text-xs text-[#131b2e] mt-1 leading-snug">
                Swap outdoor <strong className="font-semibold text-[#006194]">Arashiyama Bamboo</strong> for indoor{' '}
                <strong className="font-semibold text-[#006194]">Kyoto National Museum</strong> tomorrow?
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowSwapCard(false);
                    onShowToast('Applied schedule swap! Arashiyama shifted to sunny Monday.');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#006194] text-white text-xs font-semibold shadow-xs active:scale-95 transition-transform"
                  type="button"
                >
                  Apply Swap
                </button>
                <button
                  onClick={() => setShowSwapCard(false)}
                  className="px-3.5 py-1.5 rounded-full bg-[#dae2fd] text-[#3f4850] text-xs font-semibold hover:bg-[#eaedff] active:scale-95 transition-all"
                  type="button"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Vertical Timeline */}
      <div className="relative flex flex-col pt-1">
        {/* Connecting Continuous Timeline Spine */}
        {currentDayActivities.length > 1 && (
          <div className="absolute left-4 top-6 bottom-8 w-0.5 bg-[#dae2fd] z-0" />
        )}

        {currentDayActivities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#e2e8f0] shadow-xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#e2e7ff] text-[#006194] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">event_note</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#131b2e]">No stops scheduled for Day {selectedDay}</h4>
              <p className="text-xs text-[#64748b] mt-1">
                Add an activity or explore recommended destinations from Kyoto &amp; India.
              </p>
            </div>
            <button
              onClick={() => setIsAddActivityOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-xs hover:bg-[#004f7a] transition-colors inline-flex items-center gap-1.5"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Stop to Day {selectedDay}</span>
            </button>
          </div>
        ) : (
          currentDayActivities.map((act, index) => {
            const isCompleted = act.status === 'completed';
            const isUpNext = act.status === 'up-next';
            const isReserved = act.status === 'reserved';

            return (
              <div key={act.id || index} className="relative flex items-start gap-3.5 mb-6 z-10 group">
                {/* Timeline Icon Marker */}
                {isCompleted ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6ffbbe] text-[#006c49] shrink-0 shadow-xs mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                ) : isUpNext ? (
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#006194] text-white shrink-0 shadow-md mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f43f5e] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f43f5e]" />
                    </span>
                  </div>
                ) : isReserved ? (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e2e7ff] text-[#707881] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e0f2fe] text-[#006194] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">place</span>
                  </div>
                )}

                {/* Card Container */}
                <div
                  className={`flex flex-col flex-1 bg-white rounded-2xl p-4 shadow-sm border transition-all ${
                    isUpNext
                      ? 'ring-2 ring-[#006194]/40 border-[#e2e8f0]/40 shadow-md'
                      : 'border-[#e2e8f0]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-[#006194]">{act.timeSlot}</span>
                      <span className="w-1 h-1 rounded-full bg-[#bfc7d2]" />
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          isCompleted
                            ? 'bg-[#d1fae5] text-[#006c49]'
                            : isUpNext
                            ? 'bg-[#e0f2fe] text-[#006194]'
                            : isReserved
                            ? 'bg-[#ffddb8] text-[#825100]'
                            : 'bg-[#f1f5f9] text-[#475569]'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                    {act.cost && (
                      <span className="text-[11px] font-bold text-[#131b2e]">{act.cost}</span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#131b2e] mt-1.5 leading-snug">
                    {act.title}
                  </h3>

                  {/* Photo if present */}
                  {act.image && (
                    <div className="mt-2.5 rounded-xl overflow-hidden h-32 w-full relative">
                      <img
                        className="w-full h-full object-cover"
                        alt={act.title}
                        src={act.image}
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#283044]/80 backdrop-blur-xs text-[#eef0ff] text-[10px] font-semibold">
                        {act.category}
                      </div>
                    </div>
                  )}

                  {/* Location info */}
                  {act.location && (
                    <div className="flex items-center gap-1 text-[11px] text-[#64748b] mt-2">
                      <span className="material-symbols-outlined text-[14px] text-[#006194]">
                        location_on
                      </span>
                      <span className="truncate">{act.location}</span>
                    </div>
                  )}

                  {/* Transit Pill */}
                  {act.transitInfo && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#e2e7ff]/60 mt-2.5 text-[#131b2e]">
                      <span className="material-symbols-outlined text-[#006194] text-[18px] shrink-0">
                        train
                      </span>
                      <span className="text-[11px] text-[#475569] leading-tight truncate">
                        {act.transitInfo}
                      </span>
                    </div>
                  )}

                  {/* Split info */}
                  {act.splitInfo && (
                    <div className="flex items-center justify-between mt-2 pt-2 bg-[#f2f3ff]/50 -mx-4 -mb-4 p-3 rounded-b-2xl">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#475569]">
                        <span className="material-symbols-outlined text-[15px] text-[#006194]">
                          receipt_long
                        </span>
                        <span>{act.splitInfo}</span>
                      </span>
                      {onDeleteActivity && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove "${act.title}" from Day ${selectedDay}?`)) {
                              onDeleteActivity(act.id);
                              onShowToast('Stop removed from itinerary');
                            }
                          }}
                          className="text-[#94a3b8] hover:text-[#ef4444] transition-colors p-1"
                          title="Remove Stop"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action buttons on Up Next item */}
                  {isUpNext && (
                    <div className="flex items-center justify-between gap-2 pt-3 mt-1">
                      <button
                        onClick={onOpenMap}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#006194] text-white text-xs font-semibold active:scale-95 transition-transform shadow-xs"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">directions</span>
                        <span>Navigate</span>
                      </button>
                      <button
                        onClick={() => onShowToast('Activity note added to Kyoto notes.')}
                        className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#131b2e] flex items-center justify-center hover:bg-[#dae2fd] active:scale-95 transition-all"
                        title="Add Note"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                      </button>
                      <button
                        onClick={onOpenAddExpense}
                        className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#131b2e] flex items-center justify-center hover:bg-[#dae2fd] active:scale-95 transition-all"
                        title="Split Expense"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Map Preview Drawer Component */}
      <div className="mt-2 bg-white rounded-2xl p-3.5 shadow-sm flex flex-col gap-3 border border-[#e2e8f0]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006194] text-[20px]">map</span>
            <span className="text-xs font-bold text-[#131b2e]">Day {selectedDay} Route Map</span>
          </div>
          <span className="text-[11px] text-[#64748b]">
            {currentDayActivities.length} stops • Offline cached map
          </span>
        </div>

        {/* Map View Container with Location Marker */}
        <div
          onClick={onOpenMap}
          className="w-full h-36 rounded-xl bg-[#eaedff] relative overflow-hidden flex items-end p-2.5 shadow-inner cursor-pointer group"
        >
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
            style={{ backgroundImage: `url('${APP_ASSETS.routeMap}')` }}
          />
          <div className="relative z-10 flex items-center justify-between w-full bg-[#faf8ff]/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-white/60">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#131b2e]">
                Current target: Fushimi Inari
              </span>
            </div>
            <button
              className="text-[#006194] text-[11px] font-bold flex items-center gap-0.5"
              type="button"
            >
              Expand Map{' '}
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Map View Quick Pill */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={onOpenMap}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#283044]/90 text-[#eef0ff] backdrop-blur-md shadow-lg active:scale-95 transition-all hover:bg-[#283044]"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-[#6ffbbe]">map</span>
          <span className="text-xs tracking-tight font-semibold">Interactive Route</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] ml-0.5" />
        </button>
      </div>

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityOpen}
        selectedDay={selectedDay}
        onClose={() => setIsAddActivityOpen(false)}
        onSave={handleSaveActivity}
        onShowToast={onShowToast}
      />
    </div>
  );
}
