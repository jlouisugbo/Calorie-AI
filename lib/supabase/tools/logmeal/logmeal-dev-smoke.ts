/**
 * Local smoke test for the LogMeal pipeline (same sequence a server route would use).
 *
 * 1) POST /v2/image/segmentation/complete — multipart field "image" (Bearer APIUser token)
 * 2) POST /v2/nutrition/recipe/nutritionalInfo — JSON { imageId } (optional: confirm dishes first; otherwise top-1 predictions are used)
 *
 * Loads `.env` from the current working directory. Uses `LOGMEAL_API_KEY` or
 * `logmeal_api_key`. Must be an APIUser access token (LogMeal Users page), not
 * the APICompany account token; wrong type yields 401 code 802 on segmentation.
 *
 * Usage:
 *   npx tsx tools/logmeal/logmeal-dev-smoke.ts
 *   npx tsx tools/logmeal/logmeal-dev-smoke.ts ./path/to/photo.jpg
 *   npx tsx tools/logmeal/logmeal-dev-smoke.ts --emit-sql
 * Optional: MEAL_LOG_USER_UUID in .env to populate user_id in generated SQL.
 *
 * Default image: IMG_7184.png in the repo root (current working directory).
 *
 * LogMeal caps uploads at 1 MiB. The multipart *field name* must be `image`
 * (that is what their error refers to—not your file name).
 */
import { config as loadEnv } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { mealLogInsertSql } from './meal-log-map';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const API_BASE = 'https://api.logmeal.com';
/** LogMeal: code 715 — payload must be under this size */
const LOGMEAL_MAX_IMAGE_BYTES = 1_048_576;

type SegmentationResponse = {
  imageId: number;
  [key: string]: unknown;
};

type NutritionalResponse = {
  imageId?: number;
  foodName?: string | string[];
  hasNutritionalInfo?: boolean;
  nutritional_info?: {
    calories?: number;
    totalNutrients?: Record<
      string,
      { label?: string; quantity?: number; unit?: string }
    >;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function mimeAndName(imagePath: string): { mime: string; filename: string } {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === '.png') return { mime: 'image/png', filename: 'meal.png' };
  if (ext === '.jpg' || ext === '.jpeg')
    return { mime: 'image/jpeg', filename: 'meal.jpg' };
  if (ext === '.webp') return { mime: 'image/webp', filename: 'meal.webp' };
  return { mime: 'application/octet-stream', filename: 'meal' + ext || '.bin' };
}

/**
 * LogMeal recommends JPEG; large phone photos need resize + quality pass to stay under 1 MiB.
 */
async function ensureUnderLogMealLimit(input: Buffer): Promise<Buffer> {
  if (input.length <= LOGMEAL_MAX_IMAGE_BYTES) {
    return input;
  }
  let quality = 85;
  let maxSide = 1920;
  for (let attempt = 0; attempt < 14; attempt++) {
    const out = await sharp(input)
      .rotate()
      .resize(maxSide, maxSide, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (out.length <= LOGMEAL_MAX_IMAGE_BYTES) {
      return out;
    }
    quality -= 7;
    if (quality < 42) {
      quality = 80;
      maxSide = Math.max(720, Math.floor(maxSide * 0.72));
    }
  }
  throw new Error(
    `Could not compress image under ${LOGMEAL_MAX_IMAGE_BYTES} bytes (LogMeal limit).`,
  );
}

async function postSegmentationComplete(
  imageBytes: Buffer,
  mime: string,
  filename: string,
  token: string,
): Promise<SegmentationResponse> {
  const form = new FormData();
  // Field name must be `image` per LogMeal API (not related to IMG_7184.png).
  form.append(
    'image',
    new Blob([new Uint8Array(imageBytes)], { type: mime }),
    filename,
  );

  const url = new URL(`${API_BASE}/v2/image/segmentation/complete`);
  url.searchParams.set('language', 'eng');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`segmentation/complete ${res.status}: ${text}`);
  }
  return JSON.parse(text) as SegmentationResponse;
}

async function postNutritionalInfo(
  imageId: number,
  token: string,
): Promise<NutritionalResponse> {
  const url = new URL(`${API_BASE}/v2/nutrition/recipe/nutritionalInfo`);
  url.searchParams.set('language', 'eng');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageId }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`nutrition/recipe/nutritionalInfo ${res.status}: ${text}`);
  }
  return JSON.parse(text) as NutritionalResponse;
}

function printNutrientSummary(n: NutritionalResponse) {
  const info = n.nutritional_info;
  if (!info) {
    console.log('No nutritional_info on response (hasNutritionalInfo may be false).');
    return;
  }
  console.log('\n--- Summary ---');
  console.log('Food:', n.foodName);
  if (typeof info.calories === 'number') {
    console.log(`Calories: ${info.calories}`);
  }
  const tn = info.totalNutrients;
  if (tn && typeof tn === 'object') {
    const rows = Object.values(tn)
      .filter((x) => x && typeof x.label === 'string')
      .map((x) => ({
        label: x.label as string,
        quantity: x.quantity,
        unit: x.unit,
      }));
    for (const r of rows.slice(0, 12)) {
      console.log(
        `  ${r.label}: ${r.quantity ?? '—'}${r.unit ? ` ${r.unit}` : ''}`,
      );
    }
    if (rows.length > 12) {
      console.log(`  … and ${rows.length - 12} more nutrients (see full JSON below)`);
    }
  }
}

function logmealToken(): string | undefined {
  return (
    process.env.LOGMEAL_API_KEY ??
    process.env.logmeal_api_key
  )?.trim();
}

async function main() {
  const token = logmealToken();
  if (!token) {
    throw new Error(
      'Set LOGMEAL_API_KEY or logmeal_api_key in .env to an APIUser token (LogMeal Users page). The APICompany account token cannot call image recognition.',
    );
  }

  const argv = process.argv.slice(2);
  const emitSql = argv.includes('--emit-sql');
  const imageArg = argv.find((a) => !a.startsWith('--'));
  const imagePath = path.resolve(
    process.cwd(),
    imageArg ?? 'IMG_7184.png',
  );

  console.log('Image:', imagePath);

  let imageBytes: Buffer = Buffer.from(readFileSync(imagePath));
  let { mime, filename } = mimeAndName(imagePath);
  const rawSize = imageBytes.length;
  if (rawSize > LOGMEAL_MAX_IMAGE_BYTES) {
    console.log(
      `Original file is ${rawSize} bytes; LogMeal allows ≤ ${LOGMEAL_MAX_IMAGE_BYTES}. Compressing to JPEG…`,
    );
    imageBytes = Buffer.from(await ensureUnderLogMealLimit(imageBytes));
    mime = 'image/jpeg';
    filename = 'meal.jpg';
    console.log(`Sending ${imageBytes.length} bytes as ${filename}.`);
  }

  console.log('Step 1: segmentation/complete …');
  const seg = await postSegmentationComplete(imageBytes, mime, filename, token);
  console.log('imageId:', seg.imageId);

  console.log('Step 2: nutrition/recipe/nutritionalInfo …');
  const nutrition = await postNutritionalInfo(seg.imageId, token);
  printNutrientSummary(nutrition);

  console.log('\n--- Full nutrition JSON ---');
  console.log(JSON.stringify(nutrition, null, 2));

  if (emitSql) {
    const placeholder =
      process.env.MEAL_LOG_USER_UUID?.trim() ||
      '11111111-1111-1111-1111-111111111111';
    console.log('\n--- SQL: public.meal_logs ---\n');
    console.log(
      mealLogInsertSql(nutrition, { userIdPlaceholder: placeholder }),
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
