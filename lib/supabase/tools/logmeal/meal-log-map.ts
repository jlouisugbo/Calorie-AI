/**
 * Map LogMeal POST /v2/nutrition/recipe/nutritionalInfo JSON into public.meal_logs-shaped fields.
 */

export type LogMealNutritionalInfoPayload = {
  foodName?: string | string[];
  imageId?: number;
  hasNutritionalInfo?: boolean;
  nutritional_info?: {
    calories?: number;
    totalNutrients?: Record<
      string,
      { label?: string; quantity?: number; unit?: string }
    >;
  };
};

export type MealLogInsertFields = {
  description: string | null;
  photo_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};

function sqlStringLiteral(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNum(value: number | null): string {
  if (value === null || Number.isNaN(value)) return 'NULL';
  return String(value);
}

function foodNameToDescription(foodName: string | string[] | undefined): string | null {
  if (foodName == null) return null;
  if (Array.isArray(foodName)) {
    const parts = foodName.filter((s) => typeof s === 'string' && s.trim());
    return parts.length ? parts.join(', ') : null;
  }
  const s = foodName.trim();
  return s.length ? s : null;
}

function toGrams(quantity: number, unitRaw: string | undefined): number {
  const u = (unitRaw ?? 'g').toLowerCase().trim();
  if (u === 'mg' || u === 'milligram' || u === 'milligrams') return quantity / 1000;
  if (u === 'µg' || u === 'ug' || u === 'mcg') return quantity / 1_000_000;
  return quantity;
}

type FlatNutrient = { label: string; quantity: number };

function flattenNutrients(
  totalNutrients:
    | Record<string, { label?: string; quantity?: number; unit?: string }>
    | undefined,
): FlatNutrient[] {
  if (!totalNutrients || typeof totalNutrients !== 'object') return [];
  const out: FlatNutrient[] = [];
  for (const v of Object.values(totalNutrients)) {
    if (
      v &&
      typeof v === 'object' &&
      typeof v.label === 'string' &&
      typeof v.quantity === 'number'
    ) {
      out.push({
        label: v.label,
        quantity: toGrams(v.quantity, v.unit),
      });
    }
  }
  return out;
}

function pickFirst(
  nutrients: FlatNutrient[],
  test: (label: string) => boolean,
): number | null {
  const hit = nutrients.find((n) => test(n.label.toLowerCase()));
  return hit ? hit.quantity : null;
}

/**
 * Heuristic match on LogMeal nutrient labels (English).
 */
export function mealLogFieldsFromLogMealNutrition(
  payload: LogMealNutritionalInfoPayload,
  options: { photo_url?: string | null } = {},
): MealLogInsertFields {
  const ni = payload.nutritional_info;
  const nutrients = flattenNutrients(ni?.totalNutrients);

  const protein_g = pickFirst(nutrients, (l) => l.includes('protein'));

  const carbs_g =
    pickFirst(nutrients, (l) => l.includes('carbohydrate')) ??
    pickFirst(nutrients, (l) => l.includes('carb') && l.includes('hydr'));

  const fat_g =
    pickFirst(nutrients, (l) => l.includes('total fat')) ??
    pickFirst(nutrients, (l) => l.includes('total lipid')) ??
    pickFirst(
      nutrients,
      (l) =>
        (l === 'fat' || l.endsWith(' fat')) &&
        !l.includes('saturated') &&
        !l.includes('trans'),
    );

  let calories: number | null =
    typeof ni?.calories === 'number' && !Number.isNaN(ni.calories)
      ? Math.round(ni.calories)
      : null;

  return {
    description: foodNameToDescription(payload.foodName),
    photo_url: options.photo_url ?? null,
    calories,
    protein_g,
    carbs_g,
    fat_g,
  };
}

/**
 * Single-row INSERT for public.meal_logs. Use a real auth.users id for user_id before running.
 */
export function mealLogInsertSql(
  payload: LogMealNutritionalInfoPayload,
  options: {
    userIdPlaceholder?: string;
    photo_url?: string | null;
  } = {},
): string {
  const userId =
    options.userIdPlaceholder ?? '11111111-1111-1111-1111-111111111111';
  const row = mealLogFieldsFromLogMealNutrition(payload, {
    photo_url: options.photo_url,
  });

  return `INSERT INTO public.meal_logs (
  id,
  user_id,
  description,
  photo_url,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  logged_at
) VALUES (
  gen_random_uuid(),
  ${sqlStringLiteral(userId)}::uuid, -- replace with authenticated user id
  ${sqlStringLiteral(row.description)},
  ${sqlStringLiteral(row.photo_url)},
  ${sqlNum(row.calories)},
  ${sqlNum(row.protein_g)},
  ${sqlNum(row.carbs_g)},
  ${sqlNum(row.fat_g)},
  now()
);`;
}
