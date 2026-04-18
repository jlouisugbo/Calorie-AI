# Proactive notifications

Calorie-AI sends a single short push every ~15 minutes when (and only when) the
agent decides a time-sensitive nudge is warranted, fusing:

- Stored profile (goals, restrictions, calorie target)
- Latest biomarkers (mock today; HealthKit later) via `get_biomarkers`
- Today's Google Calendar via `get_calendar_events`
- Last known location via `get_location` + `search_nearby_places`

The agent calls `propose_notification` exactly once per tick. Skipping is the
default behavior.

## Wiring

| Piece                                                                         | Where                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Push token registration                                                       | `components/notifications/NotificationBootstrap.tsx`   |
| Push token persistence                                                        | `app/api/push/register+api.ts` → `push_tokens`         |
| Cron entrypoint                                                               | `POST /api/cron/proactive-tick` (gated by `CRON_SECRET`) |
| Per-user planner                                                              | `lib/agent/planner.ts` (`planNotification`)            |
| Push fan-out                                                                  | `lib/notifications/expoPush.ts` → Expo Push v2         |
| Cooldown / dedup                                                              | `notifications_log` (90 min per `(user_id, trigger)`)  |
| Tap-handler deep link                                                         | `NotificationBootstrap` → `router.push(deeplink)`      |

## Schedule

### Option A — Supabase pg_cron + pg_net (recommended)

```sql
select cron.schedule(
  'calorie-ai-proactive-tick',
  '*/15 * * * *',
  $$
    select net.http_post(
      url     := 'https://YOUR_DEPLOYMENT/api/cron/proactive-tick',
      headers := jsonb_build_object(
                   'content-type', 'application/json',
                   'x-cron-secret', current_setting('app.cron_secret', true)
                 ),
      body    := '{}'::jsonb
    );
  $$
);
```

Set the secret once in the database:

```sql
alter database postgres set app.cron_secret to 'replace-with-CRON_SECRET';
```

### Option B — Vercel cron (if hosting the API there)

Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/proactive-tick", "schedule": "*/15 * * * *" }
  ]
}
```

Pass `x-cron-secret` via a Vercel rewrite or middleware.

## Local test

```bash
curl -X POST http://localhost:8081/api/cron/proactive-tick \
     -H "x-cron-secret: $CRON_SECRET"
```

Returns `{ count, results }` with one entry per registered user.

## Gotchas

- `expo-notifications` push tokens require a custom dev build for iOS — Expo
  Go cannot register them. Local notifications still work in Go.
- The planner is rate-limited only by the 15-minute schedule + 90-minute
  per-trigger cooldown. Tighten by lowering `COOLDOWN_MIN` in
  `app/api/cron/proactive-tick+api.ts`.
- Background location is disabled in `app.json`. The cron uses
  `user_state.last_lat/lng`, which we update on each foreground agent call.
