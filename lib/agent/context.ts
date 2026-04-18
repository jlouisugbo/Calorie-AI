import { getProfileServer, type UserProfile } from '@/lib/supabase/profile-server';
import { getLatestBiomarkers, type BiomarkerRow } from '@/lib/supabase/biomarkers';
import { getUserState } from '@/lib/supabase/notifications';
import { shouldUseFakeCalendar } from './fake-calendar';

export interface AgentCoords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
}

export interface AgentContext {
  userId: string | null;
  profile: UserProfile | null;
  coords: AgentCoords | null;
  biomarkers: BiomarkerRow[];
  timezone: string;
  nowIso: string;
}

export interface BuildContextArgs {
  userId?: string | null;
  coords?: AgentCoords | null;
  loadBiomarkers?: boolean;
}

export async function buildAgentContext(args: BuildContextArgs): Promise<AgentContext> {
  const userId = args.userId ?? null;
  let profile: UserProfile | null = null;
  let biomarkers: BiomarkerRow[] = [];
  let coords = args.coords ?? null;

  if (userId) {
    try {
      profile = await getProfileServer(userId);
    } catch {
      profile = null;
    }
    if (args.loadBiomarkers !== false) {
      try {
        biomarkers = await getLatestBiomarkers(userId, 5);
      } catch {
        biomarkers = [];
      }
    }
    if (!coords) {
      try {
        const state = await getUserState(userId);
        if (state?.last_lat != null && state.last_lng != null) {
          coords = {
            latitude: state.last_lat,
            longitude: state.last_lng,
            timestamp: state.last_seen ? Date.parse(state.last_seen) : undefined,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    userId,
    profile,
    coords,
    biomarkers,
    timezone: profile?.timezone ?? 'America/New_York',
    nowIso: new Date().toISOString(),
  };
}

function fmt(value: number | null | undefined, suffix = ''): string {
  return value == null ? '—' : `${value}${suffix}`;
}

export function buildSystemPrompt(ctx: AgentContext): string {
  const lines: string[] = [
    'You are Calorie-AI, a personal nutrition and lifestyle coach embedded in a mobile app.',
    'Be concise, warm, and specific. Use the available tools when current facts (location, calendar, biomarkers, nearby places) would help. Never invent restaurant names — call search_nearby_places.',
    '',
    `Current time: ${ctx.nowIso} (${ctx.timezone}).`,
  ];

  lines.push('');
  lines.push('Available tools:');
  lines.push('- get_user_profile: stored goals, restrictions, calorie target.');
  lines.push('- get_biomarkers: recent sleep, HRV, glucose, resting HR, steps. Call this when energy, recovery, or food choice depends on physiology.');
  lines.push(
    `- get_calendar_events: today's schedule${shouldUseFakeCalendar() ? ' (demo data — a busy Atlanta journalist\'s day)' : ''}. Use it to time food/recovery around meetings, travel, and workouts.`,
  );
  lines.push('- get_location: last known lat/lng if needed before searching.');
  lines.push('- search_nearby_places: real Google Places near the user. Use any time the user wants real, currently-open spots.');

  if (ctx.profile) {
    lines.push('');
    lines.push('User profile:');
    if (ctx.profile.display_name) lines.push(`- Name: ${ctx.profile.display_name}`);
    if (ctx.profile.goals?.length) lines.push(`- Goals: ${ctx.profile.goals.join(', ')}`);
    if (ctx.profile.dietary_restrictions?.length)
      lines.push(`- Restrictions: ${ctx.profile.dietary_restrictions.join(', ')}`);
    if (ctx.profile.activity_level)
      lines.push(`- Activity level: ${ctx.profile.activity_level}`);
    if (ctx.profile.daily_calorie_target)
      lines.push(`- Daily calorie target: ${ctx.profile.daily_calorie_target} kcal`);
  } else {
    lines.push('');
    lines.push('User has no profile yet — keep recommendations general but actionable.');
  }

  if (ctx.coords) {
    lines.push('');
    lines.push(
      `Last known location: ${ctx.coords.latitude.toFixed(4)}, ${ctx.coords.longitude.toFixed(4)}.`,
    );
  } else {
    lines.push('');
    lines.push(
      'No live location — assume the user is in Midtown Atlanta (33.7838, -84.3830) for the demo until they say otherwise. Confirm before suggesting specific spots if it matters.',
    );
  }

  if (ctx.biomarkers.length > 0) {
    const latest = ctx.biomarkers[0];
    const previous = ctx.biomarkers[1] ?? null;
    lines.push('');
    lines.push('Latest biomarkers (most recent first):');
    lines.push(
      `- ${latest.recorded_at}: glucose ${fmt(latest.glucose_mg_dl, ' mg/dL')}, resting HR ${fmt(latest.resting_hr)}, HRV ${fmt(latest.hrv_ms, ' ms')}, sleep ${fmt(latest.sleep_hours, ' h')}, steps ${fmt(latest.steps)}`,
    );
    if (previous) {
      lines.push(
        `- ${previous.recorded_at}: glucose ${fmt(previous.glucose_mg_dl, ' mg/dL')}, resting HR ${fmt(previous.resting_hr)}, HRV ${fmt(previous.hrv_ms, ' ms')}, sleep ${fmt(previous.sleep_hours, ' h')}, steps ${fmt(previous.steps)}`,
      );
      const trend: string[] = [];
      if (latest.hrv_ms != null && previous.hrv_ms != null) {
        const delta = latest.hrv_ms - previous.hrv_ms;
        if (Math.abs(delta) >= 3)
          trend.push(`HRV ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)}ms`);
      }
      if (latest.sleep_hours != null && previous.sleep_hours != null) {
        const delta = latest.sleep_hours - previous.sleep_hours;
        if (Math.abs(delta) >= 0.4)
          trend.push(`sleep ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)}h`);
      }
      if (trend.length > 0) lines.push(`- Trend: ${trend.join(', ')}`);
    }
    lines.push(
      'Use these signals when answering — e.g. low HRV / poor sleep → favour easy-to-digest, high-protein, lower-fat options; high glucose → suggest fibre + protein, avoid simple carbs.',
    );
  } else {
    lines.push('');
    lines.push(
      'No biomarker data available. If physiology matters for the answer, call get_biomarkers first; if it returns empty, ask the user how they slept / ate today.',
    );
  }

  return lines.join('\n');
}
