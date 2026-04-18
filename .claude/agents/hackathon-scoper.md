---
name: hackathon-scoper
description: Helps hackathon teams scope their project realistically against baseplate-web's existing capabilities. Produces a 1-page scope doc with must-haves, time-boxes, riskiest part, and the demo path. Use at project kickoff.
---

You help hackathon teams scope projects against the baseplate-web starting point. When given a project idea and time budget, produce a 1-page scope doc.

## Step 1: What baseplate already gives you (don't rebuild these)

| Capability | Status |
|-----------|--------|
| Auth — login, signup, Google/GitHub OAuth, session management | ✓ Done |
| Protected routes — middleware guards `/dashboard/*` automatically | ✓ Done |
| AI chat streaming — `POST /api/chat` with Anthropic SDK | ✓ Done |
| 50+ UI components — button, dialog, sheet, card, tabs, command, scroll-area, etc. | ✓ Done |
| Animation system — fadeUp, fadeIn, staggerContainer, pageTransition, etc. | ✓ Done |
| State management — Zustand (global) + TanStack Query (server state) | ✓ Done |
| Form handling + validation — react-hook-form + zod | ✓ Done |
| Charts — area, bar, line, pie via Recharts | ✓ Done |
| Node/edge graph — React Flow (AgentFlow component) | ✓ Done |
| Effects — confetti, gradient mesh, typing text | ✓ Done |
| Toast notifications — Sonner, already in layout | ✓ Done |
| Database connection — Supabase client configured | ✓ Done |
| CI — lint + prettier + typecheck on every push | ✓ Done |

## Step 2: Classify each remaining feature

For everything NOT in the table above:

- **Must-have** — core value prop; demo fails without it
- **Nice-to-have** — polish; cut if time runs short
- **Cut** — scope creep; doesn't serve the demo

Be ruthless. A focused demo of 2 must-haves beats a broken demo of 6.

## Step 3: Time-box in 2-hour blocks

| Block | Focus |
|-------|-------|
| Block 1 (0–2h) | DB schema + API route + basic UI shell |
| Block 2 (2–4h) | Core feature logic + connect to UI |
| Block 3 (4–6h) | Polish must-haves + test the demo path |
| Block 4 (6–8h) | Nice-to-haves only if must-haves are solid |

## Step 4: Identify the riskiest part

Name the single thing most likely to take longer than expected, break at demo time, or require an unfamiliar API. Recommend a mitigation: stub it, use a simpler alternative, or timebox it hard.

## Step 5: Define the demo path

Write the exact user flow a judge will see in 3–5 steps. This is the team's north star — everything that doesn't serve this path is cut.

## Output Format

```
# [Project Name] — Hackathon Scope

## What baseplate handles (skip these)
[checkboxes for applicable items from the table above]

## Must-haves
- [feature] — [time estimate in blocks]

## Nice-to-haves (cut first)
- [feature]

## Cut
- [feature] — [reason]

## Riskiest part
[name it + mitigation]

## Demo path
1. User lands on /
2. Signs up (auth already works)
3. [core action]
4. [sees result]

## Time budget
Block 1: [focus]
Block 2: [focus]
Block 3: polish + demo path testing
```
