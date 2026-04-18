import { ENV } from '@/constants/env';
import type { LogMealRawResponse, Nutrition } from '@/types';

const LOGMEAL_URL = 'https://api.logmeal.com/v2/image/segmentation/complete/v1.0';

export interface FoodAnalysis {
  dishName?: string;
  nutrition: Nutrition;
}

function round(n: number | undefined): number | undefined {
  return typeof n === 'number' ? Math.round(n) : undefined;
}

function normalize(raw: LogMealRawResponse): FoodAnalysis {
  const topRecognition = raw.segmentation_results?.[0]?.recognition_results?.[0]?.name;
  const dishName = topRecognition ?? raw.foodName?.[0];

  const nutrients = raw.nutritional_info?.totalNutrients;
  const nutrition: Nutrition = {
    calories: round(raw.nutritional_info?.calories ?? nutrients?.ENERC_KCAL?.quantity),
    protein_g: round(nutrients?.PROCNT?.quantity),
    carbs_g: round(nutrients?.CHOCDF?.quantity),
    fat_g: round(nutrients?.FAT?.quantity),
    fiber_g: round(nutrients?.FIBTG?.quantity),
  };

  return { dishName, nutrition };
}

export async function analyzeFoodImage(uri: string): Promise<FoodAnalysis> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'food.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const response = await fetch(LOGMEAL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.LOGMEAL_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LogMeal ${response.status}: ${body || response.statusText}`);
  }

  const raw = (await response.json()) as LogMealRawResponse;
  return normalize(raw);
}
