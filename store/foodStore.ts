import { create } from 'zustand';
import { analyzeFoodImage } from '@/services/logmeal';
import type { FoodLogEntry } from '@/types';

interface FoodStore {
  entries: FoodLogEntry[];
  addFromImage: (imageUri: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  clear: () => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function runAnalysis(id: string, uri: string, set: (fn: (s: FoodStore) => Partial<FoodStore>) => void) {
  try {
    const { dishName, nutrition } = await analyzeFoodImage(uri);
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, status: 'done', dishName, nutrition, error: undefined } : e
      ),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze image';
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, status: 'error', error: message } : e
      ),
    }));
  }
}

// Mock entries for UI preview — replace with `[]` once real captures flow through.
const MOCK_ENTRIES: FoodLogEntry[] = [
  {
    id: 'mock-1',
    imageUri: 'https://picsum.photos/seed/salmon/400/400',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    status: 'done',
    dishName: 'Grilled Salmon Bowl',
    nutrition: { calories: 720, protein_g: 48, carbs_g: 52, fat_g: 28, fiber_g: 6 },
  },
  {
    id: 'mock-2',
    imageUri: 'https://picsum.photos/seed/caesar/400/400',
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    status: 'done',
    dishName: 'Caesar Salad',
    nutrition: { calories: 310, protein_g: 9, carbs_g: 24, fat_g: 18, fiber_g: 4 },
  },
  {
    id: 'mock-3',
    imageUri: 'https://picsum.photos/seed/pizza/400/400',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: 'done',
    dishName: 'Margherita Pizza',
    nutrition: { calories: 580, protein_g: 22, carbs_g: 68, fat_g: 24, fiber_g: 3 },
  },
  {
    id: 'mock-4',
    imageUri: 'https://picsum.photos/seed/oatmeal/400/400',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    status: 'done',
    dishName: 'Oatmeal with Berries',
    nutrition: { calories: 340, protein_g: 12, carbs_g: 58, fat_g: 7, fiber_g: 8 },
  },
  {
    id: 'mock-5',
    imageUri: 'https://picsum.photos/seed/burger/400/400',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'done',
    dishName: 'Burger & Fries',
    nutrition: { calories: 820, protein_g: 34, carbs_g: 72, fat_g: 42, fiber_g: 5 },
  },
  {
    id: 'mock-6',
    imageUri: 'https://picsum.photos/seed/stirfry/400/400',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'done',
    dishName: 'Chicken Stir Fry',
    nutrition: { calories: 540, protein_g: 42, carbs_g: 38, fat_g: 22, fiber_g: 5 },
  },
];

export const useFoodStore = create<FoodStore>((set, get) => ({
  entries: MOCK_ENTRIES,

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
        e.id === id ? { ...e, status: 'analyzing', error: undefined } : e
      ),
    }));
    await runAnalysis(id, existing.imageUri, set);
  },

  clear: () => set({ entries: [] }),
}));
