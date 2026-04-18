import { create } from 'zustand';
import { sendChatMessage } from '@/services/ai';
import type { Message, AnthropicMessage } from '@/types';
import { getSystemPrompt, PromptMode } from '@/services/promptBuilder';
import { supabase } from '@/lib/supabase/client';
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
  
  initializeData: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setMode: (mode: PromptMode) => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  mode: 'coach',
  systemPrompt: 'Loading context...',
  profile: null,
  mealLogs: [],

  initializeData: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const userId = session.user.id;
      
      // Fetch profile
      const profile = await getProfile(userId);
      
      // Fetch meal logs for today (simplistic approach for demo)
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
      // Re-initialize data just before sending to ensure we have the absolute latest DB state
      await get().initializeData();
      
      const { messages, systemPrompt } = get();
      const apiMessages: AnthropicMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const responseText = await sendChatMessage(apiMessages, systemPrompt);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Something went wrong',
      });
    }
  },

  clearMessages: () => set({ messages: [], error: null }),

  setMode: (mode: PromptMode) => {
    const state = get();
    set({ mode, systemPrompt: getSystemPrompt(mode, state.profile, state.mealLogs) });
  },
}));
