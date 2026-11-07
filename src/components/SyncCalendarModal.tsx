import React, { useState } from 'react';
import { ItineraryActivity } from '../types';
import {
  createGoogleCalendarUrl,
  createGoogleCalendarDaySummaryUrl,
  downloadICalendarFile,
  generateICalendarString,
  resolveActivityDates,
  GOOGLE_CALENDAR_IMPORT_URL,
  GOOGLE_CALENDAR_HOME_URL,
} from '../utils/calendarSync';

interface SyncCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ItineraryActivity[];
  selectedDay: number;
  tripName?: string;
  tripDates?: string;
  onShowToast: (msg: string) => void;
}

export function SyncCalendarModal({
  isOpen,
  onClose,
  activities,
  selectedDay,
  tripName = 'Kyoto & Tokyo Autumn',
  tripDates = 'Nov 14 – Nov 21',
  onShowToast,
}: SyncCalendarModalProps) {
  const [syncScope, setSyncScope] = useState<'day' | 'all'>('day');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentDayActivities = activities.filter((act) => act.day === selectedDay);
  const targetActivities = syncScope === 'day' ? currentDayActivities : activities;

  // Format date helper for display
  const formatTimeSlot = (act: ItineraryActivity) => {
    const { startDate, endDate } = resolveActivityDates(act, act.day || selectedDay);
    const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${startStr} – ${endStr}`;
  };

  const handleDownloadIcs = () => {
    const filterDay = syncScope === 'day' ? selectedDay : undefined;
    const result = downloadICalendarFile(activities, tripName, filterDay);
    if (result.success) {
      onShowToast(`✓ Downloaded ${result.filename} (${result.count} stops) for Google Calendar!`);
    } else {
      onShowToast('⚠️ No activities found to export for this selection.');
    }
  };

  const handleCopyIcsData = () => {
    const filterDay = syncScope === 'day' ? selectedDay : undefined;
    const icsContent = generateICalendarString(activities, tripName, filterDay);
    navigator.clipboard.writeText(icsContent);
    setCopiedLink(true);
    onShowToast('✓ iCal content copied to clipboard! Paste into your calendar app.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenGoogleCalendarDay = () => {
    if (targetActivities.length === 0) {
      onShowToast('No scheduled activities to export.');
      return;
    }

    if (targetActivities.length === 1) {
      const url = createGoogleCalendarUrl(targetActivities[0], tripName);
      window.open(url, '_blank', 'noopener,noreferrer');
      onShowToast('✓ Opened in Google Calendar!');
      return;
    }

    // If day scope, generate day summary event or open primary event
    const url = createGoogleCalendarDaySummaryUrl(
      currentDayActivities,
      selectedDay,
      tripName,
      `Day ${selectedDay}`
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    onShowToast(`✓ Opening Google Calendar for Day ${selectedDay} schedule!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
      >
        {/* Header with Google Calendar Theme */}
        <div className="bg-gradient-to-r from-[#006194] to-[#0284c7] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-[26px] text-amber-300">
                event_available
              </span>
            </div>
            <div>
              <h2 id="calendar-modal-title" className="text-base font-extrabold tracking-tight">
                Sync to Google Calendar
              </h2>
              <p className="text-xs text-white/80">
                Export active itinerary stops via standard iCal (.ics)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Trip Scope Selector */}
          <div className="bg-[#f8fafc] rounded-2xl p-1.5 border border-[#e2e8f0] flex gap-1">
            <button
              onClick={() => setSyncScope('day')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                syncScope === 'day'
                  ? 'bg-white text-[#006194] shadow-xs border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">today</span>
              <span>Day {selectedDay} ({currentDayActivities.length} Stops)</span>
            </button>
            <button
              onClick={() => setSyncScope('all')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                syncScope === 'all'
                  ? 'bg-white text-[#006194] shadow-xs border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">date_range</span>
              <span>All Days ({activities.length} Stops)</span>
            </button>
          </div>

          {/* Direct Actions Card */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#006194]">sync_alt</span>
              Calendar Export Options
            </h3>

            {/* 1. Direct Web Google Calendar Link */}
            <div className="p-3.5 rounded-2xl border border-[#cbd5e1] bg-[#f0f9ff] flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#0c4a6e] truncate">
                    Open in Google Calendar
                  </span>
                  <span className="text-[11px] text-[#38bdf8] leading-tight text-slate-600">
                    Instantly create pre-filled calendar entry
                  </span>
                </div>
              </div>
              <button
                onClick={handleOpenGoogleCalendarDay}
                disabled={targetActivities.length === 0}
                className="px-3.5 py-2 rounded-xl bg-[#006194] hover:bg-[#004f7a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 inline-flex items-center gap-1 disabled:opacity-50"
                type="button"
              >
                <span>Add Event</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </button>
            </div>

            {/* 2. Standard iCal (.ics) Download */}
            <div className="p-3.5 rounded-2xl border border-[#cbd5e1] bg-white flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#e2e7ff] text-[#006194] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">download</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#131b2e] truncate">
                    Export Standard iCal (.ics)
                  </span>
                  <span className="text-[11px] text-[#64748b] leading-tight">
                    Universal file for Google, Apple &amp; Outlook Calendars
                  </span>
                </div>
              </div>
              <button
                onClick={handleDownloadIcs}
                disabled={targetActivities.length === 0}
                className="px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all shrink-0 inline-flex items-center gap-1 disabled:opacity-50"
                type="button"
              >
                <span>Export .ics</span>
                <span className="material-symbols-outlined text-[14px]">file_download</span>
              </button>
            </div>

            {/* 3. Copy iCal Data & Google Calendar Import link */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopyIcsData}
                className="p-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px] text-[#006194]">
                  {copiedLink ? 'check' : 'content_copy'}
                </span>
                <span>{copiedLink ? 'Copied!' : 'Copy iCal Data'}</span>
              </button>

              <a
                href={GOOGLE_CALENDAR_IMPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <span className="material-symbols-outlined text-[16px] text-[#006194]">upload_file</span>
                <span>G-Cal Import Hub</span>
                <span className="material-symbols-outlined text-[12px] text-slate-400">north_east</span>
              </a>
            </div>
          </div>

          {/* Quick Guide */}
          <div className="rounded-2xl bg-[#f8fafc] p-3 text-[11px] text-[#475569] border border-[#e2e8f0] space-y-1">
            <div className="font-bold text-[#131b2e] flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#006194]">info</span>
              How to import into Google Calendar on Web / Phone:
            </div>
            <ol className="list-decimal pl-4 space-y-0.5 text-[#64748b]">
              <li>Click <strong>Export .ics</strong> to download the itinerary file.</li>
              <li>Open <strong>G-Cal Import Hub</strong> or open Google Calendar Settings &gt; <em>Import &amp; Export</em>.</li>
              <li>Select the downloaded <code className="text-[#006194] font-semibold">.ics</code> file to sync all activities automatically with exact alarms and locations.</li>
            </ol>
          </div>

          {/* Preview of Activities Scheduled to Sync */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131b2e]">
                Stops to Sync ({targetActivities.length})
              </span>
              <span className="text-[10px] text-[#64748b]">
                {syncScope === 'day' ? `Day ${selectedDay}` : 'All Days'} • {tripDates}
              </span>
            </div>

            {targetActivities.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-[#f8fafc] text-xs text-[#64748b]">
                No stops scheduled for this day yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {targetActivities.map((act) => {
                  const gCalActUrl = createGoogleCalendarUrl(act, tripName);
                  return (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-xl border border-[#e2e8f0] bg-white flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#006194] text-[11px]">
                            {act.timeSlot}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] text-[#64748b] truncate">
                            Day {act.day || selectedDay}
                          </span>
                        </div>
                        <span className="font-semibold text-[#131b2e] truncate">{act.title}</span>
                        {act.location && (
                          <span className="text-[10px] text-[#64748b] truncate flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px] text-[#006194]">
                              place
                            </span>
                            {act.location}
                          </span>
                        )}
                      </div>

                      {/* Per-activity Google Calendar Link */}
                      <a
                        href={gCalActUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Add this stop to Google Calendar"
                        className="px-2 py-1 rounded-lg bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#006194] text-[10px] font-bold border border-[#bae6fd] shrink-0 flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        <span>Sync</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between shrink-0">
          <a
            href={GOOGLE_CALENDAR_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#006194] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Open Google Calendar</span>
            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] active:scale-95 text-[#334155] text-xs font-bold shadow-2xs transition-all"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SyncCalendarModal;
