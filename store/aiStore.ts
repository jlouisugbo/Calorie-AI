import { create } from 'zustand';
import { sendChatMessage } from '@/services/ai';
import type { Message, AnthropicMessage } from '@/types';

interface AIStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  systemPrompt: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setSystemPrompt: (prompt: string) => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  systemPrompt: 'You are a helpful AI assistant.',

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

  setSystemPrompt: (prompt: string) => set({ systemPrompt: prompt }),
}));
