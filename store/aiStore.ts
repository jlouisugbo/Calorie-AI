import { create } from 'zustand';
import { runAgentTurn } from '@/services/ai';
import { useLocationStore } from '@/store/locationStore';
import { supabase } from '@/lib/supabase/client';
import type { Message, AnthropicMessage } from '@/types';

interface AIStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  /** Surface the most recent agent tool calls in the UI for transparency. */
  lastToolCalls: { name: string; isError: boolean }[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
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
  lastToolCalls: [],

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
      const { messages } = get();
      const apiMessages: AnthropicMessage[] = messages.map((m) => ({
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
}));
