import { create } from 'zustand';
import { analyzeFoodImage } from '@/services/logmeal';
import { supabase } from '@/lib/supabase/client';
import { insertMealLog, listRecentMealLogs, type MealLogRow } from '@/lib/supabase/meals';
import type { FoodLogEntry } from '@/types';

interface FoodStore {
  entries: FoodLogEntry[];
  loaded: boolean;
  loading: boolean;
  load: () => Promise<void>;
  addFromImage: (imageUri: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  clear: () => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowToEntry(row: MealLogRow): FoodLogEntry {
  return {
    id: row.id,
    imageUri: row.photo_url ?? '',
    createdAt: new Date(row.logged_at),
    status: 'done',
    dishName: row.description ?? undefined,
    nutrition: {
      calories: row.calories ?? undefined,
      protein_g: row.protein_g ?? undefined,
      carbs_g: row.carbs_g ?? undefined,
      fat_g: row.fat_g ?? undefined,
    },
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

type SetFn = (fn: (state: FoodStore) => Partial<FoodStore>) => void;

async function runAnalysis(id: string, uri: string, set: SetFn) {
  try {
    const analysis = await analyzeFoodImage(uri, uri);

    // Persist to Supabase if the user is signed in.
    const userId = await getCurrentUserId();
    console.log('[foodStore] userId:', userId ?? '(NOT SIGNED IN — skipping DB insert)');

    let persistedId = id;
    let loggedAt = new Date();

    if (userId) {
      const row = await insertMealLog(userId, analysis.mealLogFields);
      console.log('[foodStore] insert result:', row ? `saved row ${row.id}` : 'FAILED (see earlier error)');
      if (row) {
        persistedId = row.id;
        loggedAt = new Date(row.logged_at);
      }
    }

    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              id: persistedId,
              status: 'done',
              dishName: analysis.description ?? undefined,
              nutrition: analysis.nutrition,
              createdAt: loggedAt,
              error: undefined,
            }
          : e,
      ),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze image';
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, status: 'error', error: message } : e,
      ),
    }));
  }
}

export const useFoodStore = create<FoodStore>((set, get) => ({
  entries: [],
  loaded: false,
  loading: false,

  load: async () => {
    if (get().loading) return;
    set(() => ({ loading: true }));

    const userId = await getCurrentUserId();
    if (!userId) {
      set(() => ({ loaded: true, loading: false }));
      return;
    }

    const rows = await listRecentMealLogs(userId);
    set(() => ({
      entries: rows.map(rowToEntry),
      loaded: true,
      loading: false,
    }));
  },

  addFromImage: async (imageUri) => {
    const id = newId();
    const entry: FoodLogEntry = {
      id,
      imageUri,
      createdAt: new Date(),
      status: 'analyzing',
    };
    set((state) => ({ entries: [entry, ...state.entries] }));
    await runAnalysis(id, imageUri, set);
  },

  retry: async (id) => {
    const existing = get().entries.find((e) => e.id === id);
    if (!existing) return;
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, status: 'analyzing', error: undefined } : e,
      ),
    }));
    await runAnalysis(id, existing.imageUri, set);
  },

  clear: () => set(() => ({ entries: [] })),
}));
