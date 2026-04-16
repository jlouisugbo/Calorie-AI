export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface AnthropicMessage {
  role: MessageRole;
  content: string;
}
