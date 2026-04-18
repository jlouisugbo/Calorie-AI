import { create } from 'zustand';
import { fetchUpcomingEvents, type CalendarEvent } from '@/services/calendar';
import { supabase } from '@/lib/supabase/client';

const USE_FAKE = process.env.EXPO_PUBLIC_USE_FAKE_CALENDAR !== 'false';

interface CalendarState {
  isConnected: boolean;
  source: 'demo' | 'google' | 'none';
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  setConnected: (value: boolean) => void;
  refresh: () => Promise<void>;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export const useCalendarStore = create<CalendarState>((set) => ({
  isConnected: USE_FAKE,
  source: USE_FAKE ? 'demo' : 'none',
  events: [],
  isLoading: false,
  error: null,

  setConnected: (value) => set({ isConnected: value }),

  refresh: async () => {
    const userId = await getCurrentUserId();
    if (!USE_FAKE && !userId) {
      set({ error: 'Sign in to load your calendar.', events: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const result = await fetchUpcomingEvents({
        userId: userId ?? null,
        hoursAhead: 24,
      });
      set({
        events: result.events,
        source: result.source,
        isLoading: false,
        isConnected: true,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      });
    }
  },
}));
