@MEMORY.md

# Calorie-AI — Claude Code Conventions

**Thesis**: A personal nutrition coach that meets you where you are — not where meal-prep culture assumes you'll be.

## Quick Start

```bash
npm install
npx expo start          # dev server → scan QR in Expo Go
npm run lint && npm run typecheck   # pre-push checks
```

## Reference (prompting & workflow)

This file is the repo map and stack conventions. For **what to prompt**, session
structure, and operator workflows, attach or open
**[@.claude/PLAYBOOK.md](.claude/PLAYBOOK.md)** (in Cursor: `@.claude/PLAYBOOK.md`).

---

## Stack

- **Framework**: Expo SDK 52 + React Native + TypeScript
- **Navigation**: Expo Router (file-based, same mental model as Next.js App Router)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native) + custom component library in `components/ui/`
- **DB + Auth**: Supabase (`lib/supabase/client.ts` — uses `@supabase/supabase-js` with AsyncStorage for session persistence)
- **AI**: Anthropic Claude via `lib/anthropic.ts` — model `claude-sonnet-4-6`
- **State**: Zustand (`lib/store.ts`) for UI state
- **Location**: `expo-location` for GPS coords in Active Mode
- **Camera**: `expo-image-picker` for meal photo capture
- **External APIs**: Google Places API (restaurant search), LogMeal API (image nutrition analysis)

---

## Hackathon Scope — Must-Haves

These four features must work for the demo. Everything else is cut unless all four are done.

| #   | Feature                                                                                                   | Owner  | Risk   |
| --- | --------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1   | **Onboarding** — 3-step flow: goals → dietary restrictions → activity level; saves to Supabase `profiles` | Joel   | Low    |
| 2   | **AI Nutrition Coach** — Claude chat with system prompt built from user profile                           | Mani   | Low    |
| 3   | **Active Mode** — "I'm near X, what should I eat?" → Google Places + Claude recommendations               | Shared | Medium |
| 4   | **Meal Logging** — photo → LogMeal API → calories/macros → saved to Supabase                              | Shared | Medium |

### Nice-to-Haves (only if must-haves are done)

| Feature           | Owner  | Risk   | Notes                                                                       |
| ----------------- | ------ | ------ | --------------------------------------------------------------------------- |
| Calendar sync     | Tejiri | Medium | OAuth scope; reads upcoming events to suggest nearby lunch spots in advance |
| Historical charts | —      | Low    | Pure UI over Supabase data; `charts/` components are already built          |
| Passive Mode      | —      | High   | Real-time geofencing — skip for hackathon                                   |

### Active Mode Fallback

If Google Places API setup takes too long, have Claude generate recommendations from neighborhood + cuisine type in the prompt. Works fine for a demo.

---

## Demo Path (2 min, 4 beats)

1. **Onboarding**: "I'm a journalist, high-protein, no time to cook, 2000 calories a day."
2. **Active Mode**: "I'm in Midtown Atlanta grabbing lunch between interviews." → 3 restaurants with a sentence on why each fits your goals.
3. **Meal Logging**: Photo of chicken bowl → ~650 cal / 45g protein → daily total updates.
4. **Coach**: Follow-up question to the AI nutrition coach about hitting protein targets.

---

## Supabase Schema

### `profiles` table

```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  goals text[],                    -- e.g. ['high_protein', 'weight_loss']
  dietary_restrictions text[],     -- e.g. ['gluten_free', 'no_dairy']
  activity_level text,             -- 'sedentary' | 'lightly_active' | 'active' | 'very_active'
  daily_calorie_target integer,    -- e.g. 2000
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = user_id);
```

### `meal_logs` table

```sql
create table meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  description text,
  photo_url text,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  logged_at timestamptz default now()
);
alter table meal_logs enable row level security;
create policy "Users manage own logs" on meal_logs
  for all using (auth.uid() = user_id);
```

---

## File & Folder Breakdown

### `app/` — Screens (Expo Router)

Every `.tsx` file in `app/` is automatically a route. No route registration needed.
`+api.ts` suffix = an Expo API route (server-side handler, runs on the server).

| File                                    | Route                            | Owner  | What it does                                                       |
| --------------------------------------- | -------------------------------- | ------ | ------------------------------------------------------------------ |
| `app/_layout.tsx`                       | (root)                           | —      | Root layout — fonts, providers, navigation shell                   |
| `app/index.tsx`                         | `/`                              | —      | Splash/redirect: profile complete → tabs, else → onboarding        |
| `app/(auth)/login.tsx`                  | `/login`                         | —      | Login screen                                                       |
| `app/(auth)/signup.tsx`                 | `/signup`                        | —      | Signup screen                                                      |
| `app/onboarding/_layout.tsx`            | (layout)                         | Joel   | Onboarding shell with step progress indicator                      |
| `app/onboarding/step1-goals.tsx`        | `/onboarding/step1-goals`        | Joel   | Pick nutrition goals (multi-select chips)                          |
| `app/onboarding/step2-restrictions.tsx` | `/onboarding/step2-restrictions` | Joel   | Pick dietary restrictions (multi-select chips)                     |
| `app/onboarding/step3-activity.tsx`     | `/onboarding/step3-activity`     | Joel   | Pick activity level + confirm calorie target → write to `profiles` |
| `app/(tabs)/_layout.tsx`                | (layout)                         | —      | Tab bar: Home · Coach · Active · Log                               |
| `app/(tabs)/home.tsx`                   | `/home`                          | —      | Daily summary: calories remaining, macro rings                     |
| `app/(tabs)/coach.tsx`                  | `/coach`                         | Mani   | AI Nutrition Coach chat (fork of chat-interface)                   |
| `app/(tabs)/active.tsx`                 | `/active`                        | Shared | Active Mode — location input + restaurant recs                     |
| `app/(tabs)/log.tsx`                    | `/log`                           | Shared | Meal logging — camera → LogMeal → save                             |
| `app/(tabs)/calendar.tsx`               | `/calendar`                      | Tejiri | Calendar sync (nice-to-have)                                       |
| `app/api/nutrition-coach+api.ts`        | `POST /api/nutrition-coach`      | Mani   | Streams Claude with profile-injected system prompt                 |
| `app/api/active-mode+api.ts`            | `POST /api/active-mode`          | Shared | Google Places → Claude recommendation pipeline                     |
| `app/api/log-meal+api.ts`               | `POST /api/log-meal`             | Shared | LogMeal API → parse macros → write to Supabase                     |
| `app/api/calendar-events+api.ts`        | `GET /api/calendar-events`       | Tejiri | Google Calendar OAuth + event fetch (nice-to-have)                 |

> **`(auth)` and `(protected)` are route groups** — the parentheses make them
> invisible in the URL. They let you apply different layouts to different
> sections without affecting the path. No `middleware.ts` in Expo Router —
> auth protection lives in `app/(protected)/_layout.tsx`.

---

### `components/` — UI Components

#### `components/ui/` — Custom primitives (fully owned — NOT shadcn)

These are **your code**, not a library import. shadcn/ui does not support React
Native — these components are built from scratch and fully customizable.

| Component      | Use it for                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button.tsx`   | Primary actions, form submits — variants: default · outline · ghost · destructive; sizes: sm · md · lg; `loading` prop shows inline `ActivityIndicator` |
| `Card.tsx`     | Content containers with `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` slots — use all or just `Card` with raw children                         |
| `Input.tsx`    | Controlled `TextInput` with label, error, and hint slots — border shifts to `border-destructive` on error and `border-primary` on focus                 |
| `Badge.tsx`    | Status chips — variants: default · secondary · success · warning · destructive                                                                          |
| `Avatar.tsx`   | Profile pictures with initials fallback — sizes: sm · md · lg · xl                                                                                      |
| `Skeleton.tsx` | Pulsing loading placeholders — use during AI streaming and data fetches; `SkeletonText` renders N lines, last at 60% width                              |
| `Sheet.tsx`    | Bottom sheet modal — `Animated.spring` slide-up, backdrop dismiss, configurable `snapHeight`                                                            |

#### `components/onboarding/` — Onboarding primitives (Joel)

| File               | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `GoalChip.tsx`     | Toggleable chip for goal/restriction selection — wraps `Chip.tsx` |
| `StepProgress.tsx` | 3-dot step indicator shown in onboarding header                   |

#### `components/nutrition-coach/` — AI Coach (Mani)

| File                | What it does                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `NutritionChat.tsx` | **Fork of `chat-interface.tsx`** — injects profile system prompt. Never edit the original. |

#### `components/active-mode/` — Active Mode UI

| File                 | What it does                                              |
| -------------------- | --------------------------------------------------------- |
| `LocationInput.tsx`  | Text input + "Use my location" button via `expo-location` |
| `RestaurantCard.tsx` | Restaurant name, cuisine, Claude's why-it-fits blurb      |

#### `components/meal-log/` — Meal Logging UI

| File               | What it does                                               |
| ------------------ | ---------------------------------------------------------- |
| `PhotoCapture.tsx` | Camera button + `expo-image-picker` — returns base64 image |
| `MacroSummary.tsx` | Shows cal/protein/carbs/fat after LogMeal returns          |

#### `components/auth/`

| File            | What it does                                                   |
| --------------- | -------------------------------------------------------------- |
| `auth-form.tsx` | Shared login/signup form — accepts `mode: "login" \| "signup"` |

#### `components/chat/`

| File                 | What it does                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chat-interface.tsx` | **Plug-and-play Claude chat UI.** Streams responses from `POST /api/chat`. Accepts `systemPrompt` and `placeholder` props. Fork a copy for your feature — don't edit the original. |

#### `components/effects/` — Visual effects adapted for React Native

| File                | What it does                                                                   |
| ------------------- | ------------------------------------------------------------------------------ |
| `gradient-mesh.tsx` | Animated gradient background — drop behind any screen for depth and atmosphere |
| `typing-text.tsx`   | Typewriter effect cycling through an array of phrases — good for hero screens  |

#### `components/motion/` — Animation primitives

Built on `react-native-reanimated`. Import shared presets from `lib/animations.ts`.

| File                   | What it does                                                       |
| ---------------------- | ------------------------------------------------------------------ |
| `animated-section.tsx` | Stagger container — children reveal in sequence on mount or scroll |
| `page-transition.tsx`  | Fade + slide-up wrapper for screen entry transitions               |

---

### `lib/` — Shared Logic

| File                       | What it does                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `lib/anthropic.ts`         | Anthropic client singleton. Exports `anthropic`, `DEFAULT_MODEL`, `DEFAULT_MAX_TOKENS`.            |
| `lib/supabase/client.ts`   | Supabase client — AsyncStorage-backed session. Use in components and hooks.                        |
| `lib/supabase/types.ts`    | TypeScript types for DB schema. Regenerate after schema changes.                                   |
| `lib/supabase/profile.ts`  | `getProfile(userId)`, `upsertProfile(userId, data)` — wraps `profiles` table.                      |
| `lib/supabase/meals.ts`    | `logMeal(userId, meal)`, `getTodaysMeals(userId)` — wraps `meal_logs` table.                       |
| `lib/store.ts`             | Zustand for UI-only state (onboarding step, active mode query). No server data here.               |
| `lib/auth/current-user.ts` | `getCurrentUser()` (returns `User \| null`) and `requireUser()` (redirects to `/login`).           |
| `lib/animations.ts`        | Reanimated presets — `fadeUp`, `fadeIn`, `scaleIn`, `popIn`.                                       |
| `lib/places.ts`            | Google Places wrapper — `searchNearby(lat, lon, query)` → top 5 places with name/address/cuisine.  |
| `lib/logmeal.ts`           | LogMeal wrapper — `analyzeImage(base64)` → `{ calories, protein_g, carbs_g, fat_g, description }`. |
| `lib/profile-prompt.ts`    | `buildSystemPrompt(profile)` — converts profile → Claude system prompt. **Server-side only.**      |

---

## Team Workflow

Same principles as the web baseplate with these mobile-specific notes:

- Use `npx expo start` (not `npm run dev`)
- Test on **iOS Simulator**, **Android Emulator**, and a physical device via **Expo Go** before marking anything done
- No `middleware.ts` — auth protection goes in `app/(protected)/_layout.tsx`
- All DB mutations go through Expo API routes (`app/api/`) — never call Supabase directly from components
- The chat component is a **generic starter** — copy it next to the UI you're building and customize on your branch; don't edit the original
- **At the end of any productive session**, run `/distill-memory` — Claude promotes non-obvious learnings into `MEMORY.md`. Commit and push so teammates get it next session.
- **Personal notes** (your preferences, not team-wide) — press `#` during a session. Claude saves them to your private local memory automatically; they are never committed.

---

## Env Vars

```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Google (Active Mode — server-only, NO EXPO_PUBLIC_ prefix)
GOOGLE_PLACES_API_KEY=

# LogMeal (Meal Logging — server-only, NO EXPO_PUBLIC_ prefix)
LOGMEAL_API_KEY=

# Google Calendar (Tejiri — nice-to-have)
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
```

**Critical**: `GOOGLE_PLACES_API_KEY` and `LOGMEAL_API_KEY` must NOT have the `EXPO_PUBLIC_` prefix — they are used only in `app/api/` routes (server-side). Putting them in `EXPO_PUBLIC_` would expose them in the client bundle.

**Build-time baked in**: Changing `.env` requires restarting `npx expo start`. For production, set in EAS secrets.

---

## Key Integration Points

### Profile → System Prompt (Critical Path)

The nutrition coach's value is that Claude knows who the user is. This happens in `app/api/nutrition-coach+api.ts`:

```
1. Extract user session from request headers
2. Fetch profile from Supabase (server-side, service role key)
3. lib/profile-prompt.ts → build system prompt string
4. Stream Claude response with that system prompt + prompt caching
5. Client never sees raw profile — only the streamed response
```

Never build the system prompt client-side. Profile data would appear in network traffic.

### Active Mode Pipeline

```
User input (location text or GPS coords)
  → POST /api/active-mode
  → lib/places.ts → Google Places → top 5 nearby restaurants
  → Claude: synthesize 3 recommendations with goals/restrictions context
  → Stream back to app/(tabs)/active.tsx

Fallback (no GOOGLE_PLACES_API_KEY): skip Places call,
  pass location text directly to Claude for plausible recs.
```

### Meal Logging Pipeline

```
Photo (base64 JPEG)
  → POST /api/log-meal
  → lib/logmeal.ts → LogMeal API → { calories, protein_g, carbs_g, fat_g }
  → Write row to Supabase meal_logs
  → Return macro summary to client → MacroSummary component renders
```

---

## Adding Things

| Task                  | Where                                    |
| --------------------- | ---------------------------------------- |
| New protected screen  | `app/(protected)/yourscreen.tsx`         |
| New public screen     | `app/(auth)/yourscreen.tsx`              |
| New API route         | `app/api/[name]+api.ts`                  |
| New feature component | `components/[feature]/ComponentName.tsx` |
| Fork of chat UI       | `components/[feature]/[Name]Chat.tsx`    |
| New shared utility    | `lib/[name].ts`                          |
| New DB query helper   | `lib/supabase/[name].ts`                 |
| New global UI state   | Add a slice to `lib/store.ts`            |

---

## Fonts

| Tailwind class    | Font                  | Use for                                          |
| ----------------- | --------------------- | ------------------------------------------------ |
| `font-sans`       | Plus Jakarta Sans 400 | Body text, paragraphs — default, no class needed |
| `font-medium`     | Plus Jakarta Sans 500 | Labels, captions                                 |
| `font-semibold`   | Plus Jakarta Sans 600 | Subheadings, button text                         |
| `font-bold`       | Plus Jakarta Sans 700 | Emphasized body text                             |
| `font-display`    | Syne 700              | Screen titles, section headers                   |
| `font-display-xl` | Syne 800              | Hero text, large numerics                        |
| `font-mono`       | JetBrains Mono 400    | AI output, code blocks, IDs                      |

## Colors

**Theme**: Forest / nature — cream backgrounds, beige surfaces, deep greens as primary.

### Semantic tokens (use these in components)

| Token                | Light                | Dark                 | Tailwind class               |
| -------------------- | -------------------- | -------------------- | ---------------------------- |
| `--color-primary`    | forest-500 `#3c6e21` | forest-300 `#7bae56` | `bg-primary`, `text-primary` |
| `--color-background` | cream-100 `#f9f4e8`  | `#101610`            | `bg-background`              |
| `--color-surface`    | beige-100 `#f4edd9`  | `#192019`            | `bg-surface`                 |
| `--color-muted`      | beige-200 `#e9dbbe`  | `#202b1f`            | `bg-muted`, `text-muted`     |

### Forest palette (for direct use via `var()`)

- **Cream**: `--color-cream-50` → `--color-cream-500` (off-white to warm tan)
- **Beige**: `--color-beige-50` → `--color-beige-500` (light parchment to earthy tan)
- **Forest**: `--color-forest-50` → `--color-forest-900` (pale sage to near-black)
- **Olive**: `--color-olive-100` → `--color-olive-600` (pale olive to dark olive)

### Standard palette (via Tailwind classes)

`red`, `orange`, `yellow`, `green`, `teal`, `blue`, `indigo`, `violet`, `purple` — each with steps `100`–`900`
Neutrals: `--color-gray-50` through `--color-gray-950`
All defined in `global.css`; dark mode overrides semantic tokens automatically via `@media (prefers-color-scheme: dark)`

---

## CI

All three workflows run in **parallel** on every push to `main` and every PR.

| File            | Command                              | Fails if                                                    |
| --------------- | ------------------------------------ | ----------------------------------------------------------- |
| `lint.yml`      | `npm run lint`                       | Any ESLint rule violation                                   |
| `prettier.yml`  | `npm run format:check`               | Any file doesn't match `.prettierrc`                        |
| `typecheck.yml` | `npm run typecheck` (`tsc --noEmit`) | Any TypeScript type error, including strict-mode violations |

---

## Rules

- `lib/supabase/client.ts` must be initialized with AsyncStorage — without it, sessions don't persist
- All DB mutations go through Expo API routes — never call Supabase from components
- Build the Claude system prompt in `lib/profile-prompt.ts` and use it **server-side only** in API routes
- `GOOGLE_PLACES_API_KEY` and `LOGMEAL_API_KEY` must NOT have `EXPO_PUBLIC_` prefix — server-only
- Call `requireUser()` at the top of every protected layout; `getCurrentUser()` when null is acceptable
- `NutritionChat.tsx` is a fork — do not edit `components/chat/chat-interface.tsx` directly
- Expo Router: `(group)` folders are invisible in URLs, `+api.ts` = server route, `_layout.tsx` = layout wrapper

---

## Context

- Route groups: `(auth)` = public auth screens, `(protected)` = requires login; parentheses are invisible in the URL and navigation path
- `lib/store.ts` is Zustand for UI-only state — do not store server/Supabase data here
- Prompt caching is wired in `app/api/chat+api.ts` via `cache_control: { type: "ephemeral" }`
- `components/ui/` components are fully owned custom components — NOT shadcn (shadcn doesn't support React Native); customize freely
- NativeWind v4 requires `className` prop support — all `components/ui/` components accept and forward `className`

---

## Preferences

- Conventional commits: `feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `ci`
- Pre-push: `npm run lint && npm run typecheck`
- Test on both iOS and Android before marking anything done

---

## Gotchas

- `lib/supabase/client.ts` must use AsyncStorage — without it, sessions don't persist between app restarts
- Expo env vars are build-time baked in — changing `.env` requires restarting `npx expo start`
- `KeyboardAvoidingView` behavior differs: iOS uses `padding`, Android uses `height` — test both
- `expo-location` requires `NSLocationWhenInUseUsageDescription` in `app.json` for iOS
- `expo-image-picker` requires camera permission entries in `app.json` → `ios.infoPlist`
- NativeWind v4 requires `className` prop support — all `components/ui/` components accept and forward `className`
- LogMeal API expects base64-encoded JPEG — compress before sending or you'll hit payload limits
- Onboarding redirect lives in `app/index.tsx` (check `profiles` row exists), not in middleware
