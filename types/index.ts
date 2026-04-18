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
  dishName?: string;
  nutrition?: Nutrition;
  error?: string;
}

interface LogMealNutrient {
  quantity?: number;
  unit?: string;
  label?: string;
}

interface LogMealRecognition {
  name?: string;
  prob?: number;
}

interface LogMealSegmentation {
  recognition_results?: LogMealRecognition[];
}

export interface LogMealRawResponse {
  imageId?: number | string;
  foodName?: string[];
  segmentation_results?: LogMealSegmentation[];
  nutritional_info?: {
    calories?: number;
    totalNutrients?: {
      ENERC_KCAL?: LogMealNutrient;
      PROCNT?: LogMealNutrient;
      CHOCDF?: LogMealNutrient;
      FAT?: LogMealNutrient;
      FIBTG?: LogMealNutrient;
    };
  };
}
