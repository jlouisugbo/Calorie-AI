import { getProfileServer, type UserProfile } from '@/lib/supabase/profile-server';
import { getLatestBiomarkers, type BiomarkerRow } from '@/lib/supabase/biomarkers';
import { getUserState } from '@/lib/supabase/notifications';

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
    timezone: profile?.timezone ?? 'America/Los_Angeles',
    nowIso: new Date().toISOString(),
  };
}

export function buildSystemPrompt(ctx: AgentContext): string {
  const lines: string[] = [
    'You are Calorie-AI, a personal nutrition and lifestyle coach embedded in a mobile app.',
    'Be concise, warm, and specific. Use the available tools when current facts (location, calendar, biomarkers, nearby places) would help. Never invent restaurant names — call search_nearby_places.',
    '',
    `Current time: ${ctx.nowIso} (${ctx.timezone}).`,
  ];

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
    lines.push('User has no profile yet — keep recommendations general.');
  }

  if (ctx.coords) {
    lines.push('');
    lines.push(
      `Last known location: ${ctx.coords.latitude.toFixed(4)}, ${ctx.coords.longitude.toFixed(4)}.`,
    );
  } else {
    lines.push('');
    lines.push('No location available — ask the user where they are if relevant.');
  }

  if (ctx.biomarkers.length > 0) {
    const latest = ctx.biomarkers[0];
    lines.push('');
    lines.push('Latest biomarkers (most recent first):');
    lines.push(
      `- ${latest.recorded_at}: glucose ${latest.glucose_mg_dl ?? '—'} mg/dL, resting HR ${latest.resting_hr ?? '—'}, HRV ${latest.hrv_ms ?? '—'} ms, sleep ${latest.sleep_hours ?? '—'} h, steps ${latest.steps ?? '—'}`,
    );
  }

  return lines.join('\n');
}
