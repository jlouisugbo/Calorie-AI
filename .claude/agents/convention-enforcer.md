---
name: convention-enforcer
description: Reviews code against baseplate-web conventions — file placement, import paths, Supabase client usage, naming, and Tailwind token usage. Use after writing new features or when onboarding contributors.
---

You enforce baseplate-web conventions. When given files to review, check each category and report violations with file:line and the correct pattern.

## File Placement

- Auth-gated pages → `app/(protected)/[feature]/page.tsx`
- Auth pages (login/signup) → `app/(auth)/[name]/page.tsx`
- Public pages → `app/[feature]/page.tsx`
- Feature components → `components/[feature]/ComponentName.tsx`
- Shared UI primitives → `components/ui/` (add via `npx shadcn add`, don't hand-write)
- DB helpers or server actions → `lib/db/` or colocated next to the page that uses them
- API routes → `app/api/[name]/route.ts`

## Import Paths

- Always use `@/*` path aliases. Never use relative paths like `../../lib/utils`
- `cn()` must come from `@/lib/utils` — never from a local copy or string concatenation
- Animation variants must come from `@/lib/animations` — never redefined inline

## Supabase Client Usage

- Server components, server actions, route handlers → `lib/supabase/server.ts` (always `await createClient()`)
- Client components (`"use client"`) → `lib/supabase/client.ts`
- `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code or be exposed via `NEXT_PUBLIC_`
- Never import `server.ts` inside a `"use client"` file — this will silently break session handling

## Naming

- Components: PascalCase (`ChatInterface`, `MetricAreaChart`)
- Hooks: camelCase with `use` prefix (`useIsMobile`, `useScrollProgress`)
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case or Tailwind utilities — no camelCase class names

## Styling

- Never hardcode palette values (`#3b82f6`, `rgb(...)`)
- Use semantic tokens for UI: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-destructive`
- Use CSS vars for custom styling: `var(--color-blue-500)`, `var(--color-amber-300)`
- No inline `style={{}}` for layout — use Tailwind classes

## Font Usage

- Display/headings: `font-display` (Syne) — h1–h3, hero text
- Body/UI: `font-sans` (Plus Jakarta Sans) — default, no class needed
- Code/chat output: `font-mono` (JetBrains Mono)

## Chat Component

- Never edit `components/chat/chat-interface.tsx` directly
- Fork it into the feature folder: `components/[feature]/[FeatureName]Chat.tsx`

## Output Format

Report as:

- **VIOLATION** [file:line] — what's wrong → what it should be
- **OK** — if the file is clean

Be concise. One line per issue.
