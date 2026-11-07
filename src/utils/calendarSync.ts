import { ItineraryActivity } from '../types';

export interface CalendarEventPayload {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
  category?: string;
  cost?: string;
  transitInfo?: string;
  splitInfo?: string;
  bookingRef?: string;
  id?: string;
}

/**
 * Maps day index & year/month to a concrete Date object
 * For Kyoto Autumn: base is Nov 14, 2024 (or 2026 current year)
 */
export function resolveActivityDates(
  activity: ItineraryActivity,
  dayNumber: number,
  baseTripYear = 2026,
  baseMonthIndex = 10, // November (0-indexed)
  baseStartDay = 14
): { startDate: Date; endDate: Date } {
  // Calculate day date: day 1 = baseStartDay, day 2 = baseStartDay + 1, etc.
  const targetDay = baseStartDay + (dayNumber - 1);
  
  // Parse timeSlot: e.g. "08:30 - 10:00" or "14:30 - 16:30" or "18:00"
  let startHour = 9;
  let startMin = 0;
  let endHour = 11;
  let endMin = 0;

  if (activity.timeSlot) {
    const parts = activity.timeSlot.split('-').map((s) => s.trim());
    if (parts[0]) {
      const matchStart = parts[0].match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (matchStart) {
        let h = parseInt(matchStart[1], 10);
        const m = parseInt(matchStart[2], 10);
        const meridiem = matchStart[3]?.toUpperCase();
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        startHour = h;
        startMin = m;
      }
    }

    if (parts[1]) {
      const matchEnd = parts[1].match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (matchEnd) {
        let h = parseInt(matchEnd[1], 10);
        const m = parseInt(matchEnd[2], 10);
        const meridiem = matchEnd[3]?.toUpperCase();
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        endHour = h;
        endMin = m;
      }
    } else {
      endHour = (startHour + 2) % 24;
      endMin = startMin;
    }
  }

  const startDate = new Date(baseTripYear, baseMonthIndex, targetDay, startHour, startMin, 0);
  const endDate = new Date(baseTripYear, baseMonthIndex, targetDay, endHour, endMin, 0);

  return { startDate, endDate };
}

/**
 * Format a Date object to iCalendar / Google Calendar UTC string: YYYYMMDDTHHmmssZ
 */
export function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Build rich description string for calendar events
 */
export function buildEventDescription(activity: ItineraryActivity, tripName = 'Kyoto & Tokyo'): string {
  const lines: string[] = [
    `📍 Stop: ${activity.title}`,
    `🗂️ Category: ${activity.category}`,
    `🗺️ Trip: ${tripName}`,
  ];

  if (activity.location) {
    lines.push(`📌 Location: ${activity.location}`);
  }
  if (activity.cost) {
    lines.push(`💰 Est. Cost: ${activity.cost}`);
  }
  if (activity.bookingRef) {
    lines.push(`🎫 Booking Ref: ${activity.bookingRef}`);
  }
  if (activity.transitInfo) {
    lines.push(`🚆 Transit Route: ${activity.transitInfo}`);
  }
  if (activity.splitInfo) {
    lines.push(`👥 Expense Split: ${activity.splitInfo}`);
  }
  if (activity.advisory) {
    lines.push(`💡 Travel Note: ${activity.advisory}`);
  }

  lines.push('');
  lines.push('✈️ Generated seamlessly by TravelMate Companion');
  lines.push('https://travelmate.app');

  return lines.join('\n');
}

/**
 * Generate a direct Google Calendar Web URL for a single activity
 * Opens Google Calendar event creation in user's browser pre-filled
 */
export function createGoogleCalendarUrl(
  activity: ItineraryActivity,
  tripName = 'Kyoto & Tokyo',
  dayDateStr?: string
): string {
  const { startDate, endDate } = resolveActivityDates(activity, activity.day || 3);
  const startStr = formatIcsDateTime(startDate);
  const endStr = formatIcsDateTime(endDate);
  
  const title = `[TravelMate] ${activity.title}`;
  const details = buildEventDescription(activity, tripName);
  const location = activity.location || `${tripName} Destination`;

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location,
    sf: 'true',
    output: 'xml',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a direct Google Calendar URL for an entire day summary event
 */
export function createGoogleCalendarDaySummaryUrl(
  activities: ItineraryActivity[],
  dayNumber: number,
  tripName = 'Kyoto & Tokyo',
  dateLabel = 'Nov 16'
): string {
  if (activities.length === 0) return '';
  const firstAct = activities[0];
  const lastAct = activities[activities.length - 1];

  const { startDate } = resolveActivityDates(firstAct, dayNumber);
  const { endDate } = resolveActivityDates(lastAct, dayNumber);

  const title = `[TravelMate] Day ${dayNumber} Itinerary: ${tripName} (${activities.length} stops)`;
  
  const lines = [
    `📅 ${tripName} • Day ${dayNumber} (${dateLabel})`,
    `Total Scheduled Stops: ${activities.length}`,
    '',
    'SCHEDULE BREAKDOWN:',
    ...activities.map((a, i) => `${i + 1}. [${a.timeSlot}] ${a.title} - ${a.location || a.category}`),
    '',
    '✈️ Generated seamlessly by TravelMate Companion'
  ];

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatIcsDateTime(startDate)}/${formatIcsDateTime(endDate)}`,
    details: lines.join('\n'),
    location: activities[0]?.location || tripName,
    sf: 'true',
    output: 'xml',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate RFC 5545 standard iCalendar (.ics) string
 * Compatible with Google Calendar, Apple Calendar, Microsoft Outlook, and standard calendar apps
 */
export function generateICalendarString(
  activities: ItineraryActivity[],
  tripName = 'Kyoto & Tokyo Autumn',
  filterDay?: number
): string {
  const filtered = filterDay ? activities.filter((a) => a.day === filterDay) : activities;
  const nowIcs = formatIcsDateTime(new Date());

  const vCalendarLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TravelMate//Travel Itinerary Companion v2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:TravelMate: ${tripName}${filterDay ? ` (Day ${filterDay})` : ''}`,
    'X-WR-TIMEZONE:UTC',
    'X-WR-CALDESC:Official synced trip schedule exported from TravelMate',
  ];

  filtered.forEach((activity, idx) => {
    const { startDate, endDate } = resolveActivityDates(activity, activity.day || 3);
    const startStr = formatIcsDateTime(startDate);
    const endStr = formatIcsDateTime(endDate);
    const uid = `travelmate-${activity.id || idx}-${startDate.getTime()}@travelmate.app`;
    
    // Clean string fields for ICS (escape commas, semicolons, backslashes)
    const escapeIcs = (str: string) =>
      str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');

    const summary = escapeIcs(`[TravelMate] ${activity.title}`);
    const location = escapeIcs(activity.location || tripName);
    const description = escapeIcs(buildEventDescription(activity, tripName));

    vCalendarLines.push('BEGIN:VEVENT');
    vCalendarLines.push(`UID:${uid}`);
    vCalendarLines.push(`DTSTAMP:${nowIcs}`);
    vCalendarLines.push(`DTSTART:${startStr}`);
    vCalendarLines.push(`DTEND:${endStr}`);
    vCalendarLines.push(`SUMMARY:${summary}`);
    vCalendarLines.push(`DESCRIPTION:${description}`);
    vCalendarLines.push(`LOCATION:${location}`);
    vCalendarLines.push('STATUS:CONFIRMED');
    vCalendarLines.push('TRANSP:OPAQUE');
    if (activity.category) {
      vCalendarLines.push(`CATEGORIES:${escapeIcs(activity.category)}`);
    }
    vCalendarLines.push('END:VEVENT');
  });

  vCalendarLines.push('END:VCALENDAR');
  return vCalendarLines.join('\r\n');
}

/**
 * Triggers standard browser download of .ics calendar file
 */
export function downloadICalendarFile(
  activities: ItineraryActivity[],
  tripName = 'Kyoto_Tokyo',
  filterDay?: number
): { success: boolean; count: number; filename: string } {
  const filtered = filterDay ? activities.filter((a) => a.day === filterDay) : activities;
  if (filtered.length === 0) {
    return { success: false, count: 0, filename: '' };
  }

  const cleanTripName = tripName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = filterDay
    ? `TravelMate_${cleanTripName}_Day${filterDay}.ics`
    : `TravelMate_${cleanTripName}_AllStops.ics`;

  const icsData = generateICalendarString(activities, tripName, filterDay);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return { success: true, count: filtered.length, filename };
}

/**
 * Google Calendar direct import URL (Settings > Import & Export)
 */
export const GOOGLE_CALENDAR_IMPORT_URL = 'https://calendar.google.com/calendar/u/0/r/settings/export';
export const GOOGLE_CALENDAR_HOME_URL = 'https://calendar.google.com/calendar';
