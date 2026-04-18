import { ENV } from '@/constants/env';
import {
  mealLogFieldsFromLogMealNutrition,
  type LogMealNutritionalInfoPayload,
  type MealLogInsertFields,
} from '@/lib/supabase/tools/logmeal/meal-log-map';
import type { Nutrition } from '@/types';

const API_BASE = 'https://api.logmeal.com';

interface SegmentationResponse {
  imageId: number;
}

export interface FoodAnalysis {
  /** Human-readable dish name(s) — maps to meal_logs.description */
  description: string | null;
  /** Core macros + calories, ready for the UI */
  nutrition: Nutrition;
  /** Exact row shape for public.meal_logs (minus user_id / logged_at) */
  mealLogFields: MealLogInsertFields;
}

async function postSegmentationComplete(uri: string): Promise<SegmentationResponse> {
  const form = new FormData();
  // Field name MUST be "image" per LogMeal API.
  form.append('image', {
    uri,
    name: 'meal.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const url = `${API_BASE}/v2/image/segmentation/complete?language=eng`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ENV.LOGMEAL_API_KEY}` },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`LogMeal segmentation ${res.status}: ${text || res.statusText}`);
  }
  return JSON.parse(text) as SegmentationResponse;
}

async function postNutritionalInfo(imageId: number): Promise<LogMealNutritionalInfoPayload> {
  const url = `${API_BASE}/v2/nutrition/recipe/nutritionalInfo?language=eng`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.LOGMEAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`LogMeal nutrition ${res.status}: ${text || res.statusText}`);
  }
  return JSON.parse(text) as LogMealNutritionalInfoPayload;
}

function round(n: number | null | undefined): number | undefined {
  return typeof n === 'number' && !Number.isNaN(n) ? Math.round(n) : undefined;
}

/**
 * Full two-step LogMeal pipeline: identify dish → fetch nutrition → map to DB shape.
 * `photoUrl` is passed through into the returned `mealLogFields.photo_url` for convenience.
 */
export async function analyzeFoodImage(
  uri: string,
  photoUrl: string | null = null,
): Promise<FoodAnalysis> {
  console.log('[LogMeal] segmentation start:', uri);
  const seg = await postSegmentationComplete(uri);
  console.log('[LogMeal] imageId:', seg.imageId);

  const nutrition = await postNutritionalInfo(seg.imageId);
  console.log('[LogMeal] nutrition raw:', JSON.stringify(nutrition).slice(0, 500));

  const mealLogFields = mealLogFieldsFromLogMealNutrition(nutrition, {
    photo_url: photoUrl,
  });
  console.log('[LogMeal] mapped fields:', mealLogFields);

  return {
    description: mealLogFields.description,
    nutrition: {
      calories: mealLogFields.calories ?? undefined,
      protein_g: round(mealLogFields.protein_g),
      carbs_g: round(mealLogFields.carbs_g),
      fat_g: round(mealLogFields.fat_g),
    },
    mealLogFields,
  };
}
