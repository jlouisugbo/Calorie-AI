@MEMORY.md

# Baseplate Mobile — Claude Code Conventions

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

---

## File & Folder Breakdown

### `app/` — Screens (Expo Router)

Every `.tsx` file in `app/` is automatically a route. No route registration needed.
`+api.ts` suffix = an Expo API route (server-side handler, runs on the server).

| File | Route | What it does |
| --- | --- | --- |
| `app/_layout.tsx` | (root) | Root layout — fonts, providers, navigation shell |
| `app/index.tsx` | `/` | Landing / onboarding screen |
| `app/(auth)/login.tsx` | `/login` | Login screen |
| `app/(auth)/signup.tsx` | `/signup` | Signup screen |
| `app/(protected)/_layout.tsx` | (layout) | Protected routes — checks auth, redirects if not logged in |
| `app/(protected)/home.tsx` | `/home` | Main app home tab |
| `app/(protected)/dashboard.tsx` | `/dashboard` | Dashboard screen |
| `app/api/chat+api.ts` | `POST /api/chat` | Expo API route — streams Claude responses, prompt caching wired |

> **`(auth)` and `(protected)` are route groups** — the parentheses make them
> invisible in the URL. They let you apply different layouts to different
> sections without affecting the path. No `middleware.ts` in Expo Router —
> auth protection lives in `app/(protected)/_layout.tsx`.

---

### `components/` — UI Components

#### `components/ui/` — Custom primitives (fully owned — NOT shadcn)

These are **your code**, not a library import. shadcn/ui does not support React
Native — these components are built from scratch and fully customizable.

| Component | Use it for |
| --- | --- |
| `Button.tsx` | Primary actions, form submits — variants: default · outline · ghost · destructive; sizes: sm · md · lg; `loading` prop shows inline `ActivityIndicator` |
| `Card.tsx` | Content containers with `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` slots — use all or just `Card` with raw children |
| `Input.tsx` | Controlled `TextInput` with label, error, and hint slots — border shifts to `border-destructive` on error and `border-primary` on focus |
| `Badge.tsx` | Status chips — variants: default · secondary · success · warning · destructive |
| `Avatar.tsx` | Profile pictures with initials fallback — sizes: sm · md · lg · xl |
| `Skeleton.tsx` | Pulsing loading placeholders — use during AI streaming and data fetches; `SkeletonText` renders N lines, last at 60% width |
| `Sheet.tsx` | Bottom sheet modal — `Animated.spring` slide-up, backdrop dismiss, configurable `snapHeight` |

#### `components/auth/`

| File | What it does |
| --- | --- |
| `auth-form.tsx` | Shared login/signup form — accepts `mode: "login" \| "signup"` |

#### `components/chat/`

| File | What it does |
| --- | --- |
| `chat-interface.tsx` | **Plug-and-play Claude chat UI.** Streams responses from `POST /api/chat`. Accepts `systemPrompt` and `placeholder` props. Fork a copy for your feature — don't edit the original. |

#### `components/effects/` — Visual effects adapted for React Native

| File | What it does |
| --- | --- |
| `gradient-mesh.tsx` | Animated gradient background — drop behind any screen for depth and atmosphere |
| `typing-text.tsx` | Typewriter effect cycling through an array of phrases — good for hero screens |

#### `components/motion/` — Animation primitives

Built on `react-native-reanimated`. Import shared presets from `lib/animations.ts`.

| File | What it does |
| --- | --- |
| `animated-section.tsx` | Stagger container — children reveal in sequence on mount or scroll |
| `page-transition.tsx` | Fade + slide-up wrapper for screen entry transitions |

---

### `lib/` — Shared Logic

| File | What it does |
| --- | --- |
| `lib/anthropic.ts` | Anthropic client singleton. Exports `anthropic`, `DEFAULT_MODEL` (`claude-sonnet-4-6`), `DEFAULT_MAX_TOKENS`. Import in any API route that calls Claude. |
| `lib/supabase/client.ts` | Supabase client for React Native — initialized with AsyncStorage for session persistence. Use in components and hooks. |
| `lib/supabase/types.ts` | TypeScript types for the DB schema. Regenerate with `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts` after schema changes. |
| `lib/store.ts` | Zustand store for UI-only state. Don't put server data here — keep Supabase data in local component state or a dedicated query layer. |
| `lib/auth/current-user.ts` | `getCurrentUser()` (returns `User \| null`) and `requireUser()` (redirects to `/login` if unauthenticated). Call `requireUser()` at the top of every protected layout. |
| `lib/animations.ts` | react-native-reanimated animation presets — `fadeUp`, `fadeIn`, `scaleIn`, `popIn`, etc. Pass to `useAnimatedStyle` or shared values. |

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
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

**Important:** In Expo, public env vars use the `EXPO_PUBLIC_` prefix (not
`NEXT_PUBLIC_`). Env vars are **build-time baked in** — changing `.env` requires
restarting `npx expo start`. For production builds, set them in EAS secrets, not
`.env`.

---

## Adding Things

| Task | Where |
| --- | --- |
| New protected screen | `app/(protected)/yourscreen.tsx` |
| New public screen | `app/(auth)/yourscreen.tsx` |
| New API route | `app/api/[name]+api.ts` |
| New feature component | `components/[feature]/ComponentName.tsx` |
| Fork of chat UI | `components/[feature]/[Name]Chat.tsx` |
| New shared utility | `lib/[name].ts` |
| New DB query helper | `lib/supabase/[name].ts` |
| New global UI state | Add a slice to `lib/store.ts` |

---

## Fonts

| Tailwind class | Font | Use for |
| --- | --- | --- |
| `font-sans` | Plus Jakarta Sans 400 | Body text, paragraphs — default, no class needed |
| `font-medium` | Plus Jakarta Sans 500 | Labels, captions |
| `font-semibold` | Plus Jakarta Sans 600 | Subheadings, button text |
| `font-bold` | Plus Jakarta Sans 700 | Emphasized body text |
| `font-display` | Syne 700 | Screen titles, section headers |
| `font-display-xl` | Syne 800 | Hero text, large numerics |
| `font-mono` | JetBrains Mono 400 | AI output, code blocks, IDs |

## Colors

- **Semantic tokens** for UI: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-destructive`, etc. These respect dark mode automatically.
- **Palette vars** for custom styling: `var(--color-indigo-500)`, `var(--color-blue-300)`, `var(--color-purple-700)`, etc.
- Full rainbow palette: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `indigo`, `violet`, `purple` — each with steps `100`–`900`
- Neutrals: `--color-gray-50` through `--color-gray-950`
- All defined in `global.css`; dark mode overrides semantic tokens automatically via `@media (prefers-color-scheme: dark)`

---

## CI

All three workflows run in **parallel** on every push to `main` and every PR.

| File | Command | Fails if |
| --- | --- | --- |
| `lint.yml` | `npm run lint` | Any ESLint rule violation |
| `prettier.yml` | `npm run format:check` | Any file doesn't match `.prettierrc` |
| `typecheck.yml` | `npm run typecheck` (`tsc --noEmit`) | Any TypeScript type error, including strict-mode violations |

---

## Rules

- `lib/supabase/client.ts` must be initialized with the AsyncStorage adapter — without it, sessions don't persist between app restarts
- Call `requireUser()` at the top of every protected screen layout; use `getCurrentUser()` when `null` is acceptable
- All DB mutations go through Expo API routes or server actions — never call Supabase directly from components
- Use `EXPO_PUBLIC_` prefix for env vars that need to be accessible in client code (not `NEXT_PUBLIC_`)
- Expo Router file-based routes: `(group)` folders are invisible in navigation, `+api.ts` suffix = API route, `_layout.tsx` = shared layout wrapper

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

- `lib/supabase/client.ts` must be initialized with AsyncStorage — without it, sessions don't persist between app restarts
- `app/(protected)/_layout.tsx` is where auth redirect happens — not middleware (Expo Router has no `middleware.ts`)
- Expo env vars are build-time baked in: changing `.env` requires restarting `npx expo start`; for prod builds, set them in EAS secrets
- NativeWind v4 requires `className` prop support — use components that accept and forward `className`
- `KeyboardAvoidingView` behavior differs between iOS (`padding`) and Android (`height`) — test on both platforms
