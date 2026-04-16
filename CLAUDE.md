# Baseplate Mobile — Claude Code Context

AI hackathon project. React Native + Expo, 5-person team, fast iteration.

## Stack

- **Expo SDK 51** + **Expo Router v3** (file-based routing)
- **NativeWind v4** (Tailwind CSS classes in React Native)
- **Zustand** for global state
- **Anthropic API** via fetch (model: `claude-sonnet-4-6`)
- **TypeScript strict mode**

## Project Structure

```
app/                    ← Expo Router screens (add new screens as files here)
  _layout.tsx           ← root layout, font loading, SafeAreaProvider
  index.tsx             ← redirects to (tabs)/home
  (tabs)/
    _layout.tsx         ← tab bar config
    home.tsx            ← home screen
    chat.tsx            ← AI chat screen
components/
  ui/                   ← Button, Card, Input, Badge, Avatar, Skeleton, Sheet
services/
  ai.ts                 ← Anthropic API fetch wrapper — edit here for AI behavior
store/
  aiStore.ts            ← Zustand store: messages, isLoading, sendMessage
types/
  index.ts              ← Message, AnthropicMessage types
constants/
  env.ts                ← typed env access (throws if EXPO_PUBLIC_ANTHROPIC_API_KEY missing)
global.css              ← all design tokens (colors, fonts, spacing, radius)
```

## Adding Things

| Task | Where |
|------|-------|
| New screen | Create `app/(tabs)/yourscreen.tsx` |
| New tab | Add `<Tabs.Screen>` in `app/(tabs)/_layout.tsx` |
| New AI feature | Edit `services/ai.ts` + `store/aiStore.ts` |
| New global state | Add slice to `store/aiStore.ts` or create `store/yourStore.ts` |
| New UI component | Add to `components/ui/` following existing pattern |
| Change AI system prompt | `useAIStore.getState().setSystemPrompt('...')` |

## Fonts

- **Body**: `PlusJakartaSans_400Regular` / `_500Medium` / `_600SemiBold` / `_700Bold`
- **Display/Headers**: `Syne_700Bold` / `Syne_800ExtraBold`
- **Mono (AI output)**: `JetBrainsMono_400Regular`

In Tailwind: `font-sans`, `font-medium`, `font-semibold`, `font-bold`, `font-display`, `font-display-xl`, `font-mono`

## Design Tokens

All tokens live in `global.css` `:root`. Colors: `--color-{name}-{100-900}`.
Semantic: `--color-primary`, `--color-background`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`.

## Env Setup

```bash
cp .env.example .env
# add your EXPO_PUBLIC_ANTHROPIC_API_KEY
```

## CI

Three GitHub Actions run on every push/PR: `lint`, `prettier`, `typecheck`.
Run locally: `npm run lint`, `npm run format:check`, `npm run type-check`.

## Key Decisions

- **Expo Router** over React Navigation: file-based routing means adding screens = creating a file, no config
- **Zustand** over Context: zero boilerplate, works with async actions out of the box
- **fetch over Anthropic SDK**: no Node.js polyfill issues in React Native bundler
- **NativeWind v4**: allows sharing Tailwind vocabulary across the whole team
