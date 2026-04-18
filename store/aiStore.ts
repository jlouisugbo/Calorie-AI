import { create } from 'zustand';
import { runAgentTurn } from '@/services/ai';
import { useLocationStore } from '@/store/locationStore';
import { supabase } from '@/lib/supabase/client';
import type { Message } from '@/types';
import { getSystemPrompt, PromptMode } from '@/services/promptBuilder';
import { getProfile } from '@/lib/supabase/profile';
import type { Profile } from '@/lib/supabase/types';

interface AIStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  mode: PromptMode;
  systemPrompt: string;
  profile: Profile | null;
  mealLogs: any[];
  lastToolCalls: { name: string; isError: boolean }[];
  
  initializeData: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMode: (mode: PromptMode) => void;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  mode: 'coach',
  systemPrompt: 'Loading context...',
  profile: null,
  mealLogs: [],
  lastToolCalls: [],

  initializeData: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const userId = session.user.id;
      
      const profile = await getProfile(userId);
      const { data: logs } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId);

      const mealLogs = logs || [];
      const newPrompt = getSystemPrompt(get().mode, profile, mealLogs);

      set({ profile, mealLogs, systemPrompt: newPrompt });
    } catch (err) {
      console.error('Error initializing AI store:', err);
    }
  },

  sendMessage: async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      await get().initializeData();
      
      const { messages } = get();

      const apiMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const coords = useLocationStore.getState().coords;
      const userId = await getCurrentUserId();

      const result = await runAgentTurn({
        messages: apiMessages,
        userId,
        coords: coords
          ? {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              timestamp: coords.timestamp,
            }
          : null,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text,
        createdAt: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        lastToolCalls:
          result.trace?.toolCalls.map((c) => ({ name: c.name, isError: c.isError })) ?? [],
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  },

  clearMessages: () => set({ messages: [], error: null, lastToolCalls: [] }),

  setMode: (mode: PromptMode) => {
    const state = get();
    set({ mode, systemPrompt: getSystemPrompt(mode, state.profile, state.mealLogs) });
  },
}));
