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

export interface Nutrition {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

export type FoodLogStatus = 'analyzing' | 'done' | 'error';

export interface FoodLogEntry {
  id: string;
  imageUri: string;
  createdAt: Date;
  status: FoodLogStatus;
  /** LogMeal dish name(s) — persisted as meal_logs.description */
  dishName?: string;
  nutrition?: Nutrition;
  error?: string;
}
