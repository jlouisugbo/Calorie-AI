import type { AgentToolDef } from './openai';
import type { AgentContext } from './context';
import { searchNearbyPlaces } from '@/lib/places/server';
import { listUpcomingEvents } from '@/lib/google/calendar';
import { getLatestBiomarkers } from '@/lib/supabase/biomarkers';
import { getFakeCalendarEvents, shouldUseFakeCalendar } from './fake-calendar';
import { generateBusyProBiomarkers } from './sample-biomarkers';

export interface ToolDef<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  run: (input: TInput, ctx: AgentContext) => Promise<unknown>;
}

const getLocation: ToolDef<Record<string, never>> = {
  name: 'get_location',
  description:
    "Returns the user's last known location (lat/lng, accuracy in metres, timestamp). Use it before searching nearby places if no location was provided in the system prompt.",
  input_schema: { type: 'object', properties: {}, additionalProperties: false },
  run: async (_input, ctx) => {
    if (!ctx.coords) return { available: false };
    return {
      available: true,
      latitude: ctx.coords.latitude,
      longitude: ctx.coords.longitude,
      accuracy_m: ctx.coords.accuracy ?? null,
      timestamp: ctx.coords.timestamp ?? null,
    };
  },
};

const getUserProfile: ToolDef<Record<string, never>> = {
  name: 'get_user_profile',
  description:
    'Returns the stored profile (goals, dietary restrictions, activity level, daily calorie target). Use it whenever you need to personalize advice.',
  input_schema: { type: 'object', properties: {}, additionalProperties: false },
  run: async (_input, ctx) => ctx.profile ?? { profile: null },
};

const getBiomarkers: ToolDef<{ limit?: number }> = {
  name: 'get_biomarkers',
  description:
    'Returns recent biomarker readings (glucose, resting heart rate, HRV, sleep hours, steps). Use it before giving energy/recovery/nutrition advice that depends on physiology.',
  input_schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 30,
        description: 'How many recent readings to return (default 5).',
      },
    },
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const limit = input.limit ?? 5;
    const rows = ctx.userId ? await getLatestBiomarkers(ctx.userId, limit) : [];
    if (rows.length === 0) {
      return {
        biomarkers: generateBusyProBiomarkers(ctx.userId ?? 'demo', limit),
        source: 'demo',
      };
    }
    return { biomarkers: rows, source: 'real' };
  },
};

const getCalendarEvents: ToolDef<{ hoursAhead?: number; maxResults?: number }> = {
  name: 'get_calendar_events',
  description:
    "Returns the user's upcoming Google Calendar events for the next N hours. Use this to fit nutrition or restaurant suggestions around meetings, travel, or workouts. Returns an empty list if calendar is not connected.",
  input_schema: {
    type: 'object',
    properties: {
      hoursAhead: {
        type: 'integer',
        minimum: 1,
        maximum: 168,
        description: 'Lookahead window in hours (default 24).',
      },
      maxResults: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Max events to return (default 10).',
      },
    },
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const hoursAhead = input.hoursAhead ?? 24;
    const maxResults = input.maxResults ?? 10;

    if (shouldUseFakeCalendar()) {
      const events = getFakeCalendarEvents(hoursAhead, maxResults);
      return { events, source: 'demo' };
    }

    if (!ctx.userId) return { events: [], reason: 'no user' };
    try {
      const events = await listUpcomingEvents(ctx.userId, hoursAhead, maxResults);
      return { events, source: 'google' };
    } catch (err) {
      return {
        events: [],
        error: err instanceof Error ? err.message : 'calendar unavailable',
      };
    }
  },
};

const searchNearby: ToolDef<{
  query?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  limit?: number;
}> = {
  name: 'search_nearby_places',
  description:
    "Searches Google Places near the user (or the lat/lng you pass) for restaurants, cafés, gyms, etc. Use it any time the user wants real, currently-open places. Defaults to the user's last known location if no coords are given.",
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          "What to search for, e.g. 'high protein bowl', 'sushi', 'coffee shop'. Defaults to 'restaurants'.",
      },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      longitude: { type: 'number', minimum: -180, maximum: 180 },
      radiusKm: { type: 'number', minimum: 0.1, maximum: 25 },
      limit: { type: 'integer', minimum: 1, maximum: 20 },
    },
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    const lat = input.latitude ?? ctx.coords?.latitude;
    const lng = input.longitude ?? ctx.coords?.longitude;
    if (lat == null || lng == null) {
      return { error: 'No location available — ask the user where they are.' };
    }
    const result = await searchNearbyPlaces({
      latitude: lat,
      longitude: lng,
      query: input.query,
      radiusKm: input.radiusKm,
      limit: input.limit,
    });
    return result;
  },
};

export const TOOLS: ToolDef[] = [
  getLocation as ToolDef,
  getUserProfile as ToolDef,
  getBiomarkers as ToolDef,
  getCalendarEvents as ToolDef,
  searchNearby as ToolDef,
];

export const TOOL_DEFS: AgentToolDef[] = TOOLS.map((t) => ({
  type: 'function',
  name: t.name,
  description: t.description,
  parameters: t.input_schema,
  strict: false,
}));

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  ctx: AgentContext,
): Promise<{ result: unknown; isError: boolean }> {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) {
    return { result: { error: `Unknown tool: ${name}` }, isError: true };
  }
  try {
    const result = await tool.run(input as never, ctx);
    return { result, isError: false };
  } catch (err) {
    return {
      result: { error: err instanceof Error ? err.message : String(err) },
      isError: true,
    };
  }
}
