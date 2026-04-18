import type { CalendarEvent } from '@/lib/google/calendar';

interface FakeEventTemplate {
  hour: number;
  minute: number;
  durationMin: number;
  summary: string;
  location: string | null;
  description: string | null;
}

const BUSY_JOURNALIST_DAY: FakeEventTemplate[] = [
  {
    hour: 10,
    minute: 30,
    durationMin: 60,
    summary: "Interview — Mayor's office",
    location: 'Atlanta City Hall, Midtown',
    description:
      'Background interview about transit funding. Bring recorder + follow-up questions.',
  },
  {
    hour: 12,
    minute: 30,
    durationMin: 45,
    summary: 'Lunch window',
    location: null,
    description:
      'Open block — find something nearby that fits the high-protein goal without a long sit-down.',
  },
  {
    hour: 14,
    minute: 0,
    durationMin: 45,
    summary: 'Source meeting at Octane Coffee',
    location: 'Octane Coffee, Westside Provisions',
    description: 'Coffee with city council source. Mostly off-the-record.',
  },
  {
    hour: 16,
    minute: 0,
    durationMin: 30,
    summary: 'Editorial sync',
    location: 'Zoom',
    description: 'Weekly desk meeting — pitch the transit story.',
  },
  {
    hour: 19,
    minute: 30,
    durationMin: 90,
    summary: 'Dinner with Sara',
    location: 'Inman Park',
    description: "Friend's birthday dinner — likely tasting menu.",
  },
];

function buildEvent(
  baseDate: Date,
  template: FakeEventTemplate,
  index: number,
): CalendarEvent {
  const start = new Date(baseDate);
  start.setHours(template.hour, template.minute, 0, 0);
  const end = new Date(start.getTime() + template.durationMin * 60_000);
  return {
    id: `fake-${start.toISOString().slice(0, 10)}-${index}`,
    summary: template.summary,
    start: start.toISOString(),
    end: end.toISOString(),
    location: template.location,
    description: template.description,
    htmlLink: null,
  };
}

/**
 * Returns plausible "today's calendar" events for the busy-journalist demo
 * persona, anchored to the current local time. Filters to events that start
 * within the next `hoursAhead` hours. If the entire day's schedule is in the
 * past, rolls forward one day so the demo never looks empty.
 */
export function getFakeCalendarEvents(
  hoursAhead = 24,
  maxResults = 10,
): CalendarEvent[] {
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let events = BUSY_JOURNALIST_DAY.map((tpl, i) => buildEvent(today, tpl, i));

  const stillToday = events.filter(
    (ev) => ev.start && Date.parse(ev.start) >= now.getTime(),
  );

  if (stillToday.length === 0) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    events = BUSY_JOURNALIST_DAY.map((tpl, i) => buildEvent(tomorrow, tpl, i));
  } else {
    events = stillToday;
  }

  const cutoff = now.getTime() + hoursAhead * 3_600_000;
  return events
    .filter((ev) => ev.start && Date.parse(ev.start) <= cutoff)
    .slice(0, maxResults);
}

/** True when the app should bypass Google OAuth and serve fake events. */
export function shouldUseFakeCalendar(): boolean {
  return process.env.EXPO_PUBLIC_USE_FAKE_CALENDAR !== 'false';
}
