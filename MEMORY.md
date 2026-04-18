# Project Memory — baseplate-web
<!-- OpenClaw iron-law format. Hard cap: 10K chars. Distill, don't dump. -->
<!-- Run /distill-memory to promote session learnings here. -->
<!-- Committed to git — everything here is shared with the whole team. -->
<!-- Personal/private notes go in ~/.claude/projects/.../memory/ instead. -->

## rules
- Never edit `components/chat/chat-interface.tsx` directly — copy it into your feature folder and customize the copy
- Server components and route handlers use `lib/supabase/server.ts`; client components use `lib/supabase/client.ts` — mixing these causes session/cookie bugs
- Call `requireUser()` from `lib/auth/current-user.ts` at the top of every protected server component or layout; use `getCurrentUser()` when null is acceptable
- All DB mutations go through server actions or route handlers — never call Supabase directly from client components

## context
- Route groups: `(auth)` = public auth pages, `(protected)` = requires login; parentheses are invisible in the URL
- `/showcase/*` is not auth-gated — open it in the browser as a living component reference while building
- `lib/store.ts` is Zustand for UI-only state (sidebar open/close) — do not put server data here
- Prompt caching is already wired in `app/api/chat/route.ts` via `cache_control: ephemeral` — cuts repeat first-token latency ~80%
- `components/ui/` components are fully owned code (shadcn copy-paste) — customize freely, they are not library imports

## preferences
- Conventional commits: `feat / fix / refactor / docs / test / chore / perf / ci`
- Pre-push: `npm run lint && npm run format:check && npm run typecheck`
- New shadcn component: `npx shadcn add [name]` — auto-copies into `components/ui/`

## gotchas
- `lib/supabase/server.ts` client must be `await`-ed — it is async; forgetting this causes a cryptic cookies error at runtime
- `app/(protected)/layout.tsx` wraps all protected routes — put shared shell/sidebar there, not in individual pages
- Prettier runs on save via hooks — run `npm run format` to bulk-fix; do not fight the formatter manually
