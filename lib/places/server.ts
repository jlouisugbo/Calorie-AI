import { ApifyClient } from 'apify-client';
import { getApifyToken } from '@/constants/env';
import type { NearbyPlace } from '@/types/places';

const ACTOR_ID = 'compass/crawler-google-places';
const DEFAULT_QUERY = 'restaurants';
const DEFAULT_RADIUS_KM = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const ACTOR_WAIT_SECS = 120;

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

export interface SearchNearbyArgs {
  latitude: number;
  longitude: number;
  query?: string;
  radiusKm?: number;
  limit?: number;
}

export interface SearchNearbyResult {
  places: NearbyPlace[];
  query: string;
  radiusKm: number;
}

export async function searchNearbyPlaces(
  args: SearchNearbyArgs,
): Promise<SearchNearbyResult> {
  const query = args.query?.trim() || DEFAULT_QUERY;
  const radiusKm = args.radiusKm ?? DEFAULT_RADIUS_KM;
  const limit = Math.min(args.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  const client = new ApifyClient({ token: getApifyToken() });

  const actorInput = {
    searchStringsArray: [query],
    customGeolocation: {
      type: 'Point',
      coordinates: [args.longitude, args.latitude],
      radiusKm,
    },
    maxCrawledPlacesPerSearch: limit,
    language: 'en',
  };

  const run = await client
    .actor(ACTOR_ID)
    .call(actorInput, { waitSecs: ACTOR_WAIT_SECS });

  if (!run?.defaultDatasetId) {
    throw new Error('Apify run did not produce a dataset');
  }

  const dataset = await client.dataset(run.defaultDatasetId).listItems({ limit });
  const items = dataset.items as Record<string, unknown>[];
  const places = items.map((item, index) => normalizePlace(item, index));

  return { places, query, radiusKm };
}
