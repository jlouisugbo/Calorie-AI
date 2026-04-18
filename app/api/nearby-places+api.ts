import { ApifyClient } from 'apify-client';
import { z } from 'zod';
import { getApifyToken } from '@/constants/env';
import type { NearbyPlace } from '@/types/places';

const ACTOR_ID = 'compass/crawler-google-places';
const DEFAULT_QUERY = 'restaurants';
const DEFAULT_RADIUS_KM = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const ACTOR_WAIT_SECS = 120;

const inputSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  query: z.string().trim().min(1).max(120).optional(),
  radiusKm: z.number().positive().max(25).optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  return null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function toCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function normalizePlace(raw: Record<string, unknown>, index: number): NearbyPlace {
  const location =
    raw.location && typeof raw.location === 'object'
      ? (raw.location as { lat?: unknown; lng?: unknown })
      : null;

  const lat = toNumberOrNull(location?.lat);
  const lng = toNumberOrNull(location?.lng);

  const id =
    toStringOrNull(raw.placeId) ??
    toStringOrNull(raw.fid) ??
    toStringOrNull(raw.cid) ??
    toStringOrNull(raw.url) ??
    `place-${index}`;

  return {
    id,
    name: toStringOrNull(raw.title) ?? toStringOrNull(raw.name) ?? 'Unknown',
    address: toStringOrNull(raw.address) ?? toStringOrNull(raw.street),
    rating: toNumberOrNull(raw.totalScore) ?? toNumberOrNull(raw.rating),
    reviewsCount: toNumberOrNull(raw.reviewsCount),
    categories:
      toCategories(raw.categories).length > 0
        ? toCategories(raw.categories)
        : toCategories(raw.categoryName),
    location: lat != null && lng != null ? { latitude: lat, longitude: lng } : null,
    url: toStringOrNull(raw.url) ?? toStringOrNull(raw.website),
    priceLevel: toStringOrNull(raw.price),
    openingHours: toStringOrNull(raw.openingHours),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: 'Invalid input', details: parsed.error.flatten() },
      400,
    );
  }

  const { latitude, longitude } = parsed.data;
  const query = parsed.data.query ?? DEFAULT_QUERY;
  const radiusKm = parsed.data.radiusKm ?? DEFAULT_RADIUS_KM;
  const limit = Math.min(parsed.data.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  let token: string;
  try {
    token = getApifyToken();
  } catch {
    return jsonResponse(
      { error: 'Server missing APIFY_TOKEN configuration' },
      500,
    );
  }

  const client = new ApifyClient({ token });

  const actorInput = {
    searchStringsArray: [query],
    customGeolocation: {
      type: 'Point',
      coordinates: [longitude, latitude],
      radiusKm,
    },
    maxCrawledPlacesPerSearch: limit,
    language: 'en',
  };

  let run;
  try {
    run = await client
      .actor(ACTOR_ID)
      .call(actorInput, { waitSecs: ACTOR_WAIT_SECS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apify actor failed';
    return jsonResponse({ error: message }, 502);
  }

  if (!run?.defaultDatasetId) {
    return jsonResponse({ error: 'Apify run did not produce a dataset' }, 502);
  }

  let items: Record<string, unknown>[];
  try {
    const dataset = await client.dataset(run.defaultDatasetId).listItems({ limit });
    items = dataset.items as Record<string, unknown>[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load dataset';
    return jsonResponse({ error: message }, 502);
  }

  const places = items.map((item, index) => normalizePlace(item, index));

  return jsonResponse({ places, query, radiusKm });
}
