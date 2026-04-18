/**
 * Emit INSERT INTO public.meal_logs from saved LogMeal nutritionalInfo JSON.
 *
 *   npx tsx tools/logmeal/emit-meal-log-from-logmeal-json.ts ./nutrition.json
 *
 * Optional: MEAL_LOG_USER_UUID in .env for user_id (otherwise placeholder uuid).
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  type LogMealNutritionalInfoPayload,
  mealLogInsertSql,
} from './meal-log-map';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const file = process.argv[2];
if (!file) {
  throw new Error(
    'Usage: npx tsx tools/logmeal/emit-meal-log-from-logmeal-json.ts <nutrition.json>',
  );
}

const raw = readFileSync(path.resolve(process.cwd(), file), 'utf8');
const payload = JSON.parse(raw) as LogMealNutritionalInfoPayload;
const placeholder =
  process.env.MEAL_LOG_USER_UUID?.trim() ||
  '11111111-1111-1111-1111-111111111111';

console.log(mealLogInsertSql(payload, { userIdPlaceholder: placeholder }));
