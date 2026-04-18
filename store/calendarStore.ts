import { create } from 'zustand';
import { fetchUpcomingEvents, type CalendarEvent } from '@/services/calendar';
import { supabase } from '@/lib/supabase/client';

interface CalendarState {
  isConnected: boolean;
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
  isConnected: false,
  events: [],
  isLoading: false,
  error: null,

  setConnected: (value) => set({ isConnected: value }),

  refresh: async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      set({ error: 'Sign in to load your calendar.', events: [] });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const events = await fetchUpcomingEvents({ userId, hoursAhead: 24 });
      set({ events, isLoading: false, isConnected: events.length >= 0 });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      });
    }
  },
}));
