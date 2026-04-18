# Hackathon Playbook — Mobile (Expo + React Native)

A complete reference for every agent, command, skill, MCP server, and pattern available in this repo. Keep this open during hackathons.

---

## Hackathon Playbook — Exact Order

| Phase | Agent / Skill | Example Prompt |
|---|---|---|
| Kickoff | `hackathon-scoper` | "scope [idea] for [X] hours" |
| Planning | `feature-planner` | "plan [first must-have feature]" |
| Building | `/feature-dev` | per feature |
| After code | `convention-enforcer` | on new files |
| After UI | `ui-quality-reviewer` | on new screens/components |
| Before DB | `supabase-reviewer` | on schema + queries |
| Before PR | `/code-review` + `/security-review` | — |
| Pre-demo | `/verify` + `/e2e` | — |
| End session | `/distill-memory` | commit updated MEMORY.md |

---

## Essential Claude Code Commands

These are the highest-leverage built-in commands. Use them constantly — not just when things go wrong.

| Command | When | Why It Matters |
|---|---|---|
| `/context` | When responses feel slow, off-topic, or repetitive | Shows exactly where your context budget is going. Disable unused tools to free up space — bloated context is the #1 cause of degraded output quality mid-session |
| `/model` | At the start of each task type, and whenever you switch between planning and building | Switch models frequently to avoid burning tokens on the wrong model. Use a cheaper/faster model for exploration and reserve Sonnet for actual implementation |
| `/insights` | **At least once an hour** | Tracks how efficiently you're using Claude across sessions — token spend, friction patterns, what's working. The most important meta-command for improving your workflow over time |

> **Rule of thumb**: Run `/insights` every hour. Run `/context` any time a session feels sluggish. Switch `/model` whenever you change task mode (planning → building → reviewing).

---

## MCP Servers

MCP servers give Claude direct access to external systems. These are active for this repo.

### Supabase MCP — Database & Auth
**What it does**: Connects Claude directly to your Supabase project. Claude can inspect live schema, check RLS policies, run queries, and verify auth config without you copy-pasting anything.

**Why it matters**: Eliminates an entire category of deploy failures — Claude checks the *actual* remote schema instead of guessing from local files. Catches NOT NULL columns, missing RLS, realtime publication gaps, and FK mismatches before they hit production.

**Setup**:
```bash
claude mcp add supabase
```
Requires `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` (already in `.env.example`).

**Use it for**:
- "Check if our RLS policies cover the new messages table"
- "What columns does the profiles table actually have on the remote?"
- "Verify realtime is enabled for the notifications table"

---

### GitHub MCP — PRs & Feature Branches
**What it does**: Lets Claude create branches, open PRs, add comments, and push features directly through GitHub's API without needing the `gh` CLI for every action.

**Why it matters**: Closes the loop on the spec-plan-build-ship cycle. Claude can open a PR with a proper description, link issues, and tag reviewers — all in one step after finishing a feature.

**Setup**:
```bash
claude mcp add github
```

**Use it for**:
- "Open a PR for this feature with a summary of what changed"
- "Create a branch called feature/ai-chat and push these changes"
- "Add a comment to PR #42 with the test results"

---

> **Note**: No Next.js-specific MCP servers are needed for this mobile repo. The Supabase and GitHub MCPs cover everything this stack requires.

---

## Plugins

Plugins extend what Claude knows and can do. Use them deliberately — not every plugin for every task.

### Context7 — Live Documentation Access
**What it does**: Gives Claude access to up-to-date documentation for any library or framework. Prevents Claude from using outdated API patterns from training data.

**When to use**: Whenever you're working with a specific library API — especially `@supabase/supabase-js`, `@anthropic-ai/sdk`, `expo-router`, `react-native-reanimated`, `nativewind`, or any package that ships frequent breaking changes.

**How to trigger**: Just mention the library name. Claude will pull current docs automatically.

```
"How do I use streaming with @anthropic-ai/sdk v0.90?"
"What's the correct way to initialize createClient from @supabase/supabase-js with AsyncStorage in Expo?"
"How do I configure deep linking in expo-router v3?"
```

---

### Superpowers — Deep Feature Architecture
**What it does**: Unlocks a suite of powerful planning and execution skills — brainstorming, multi-agent orchestration, spec writing, parallel execution plans.

**When to use**: Only for genuinely complex, high-stakes features that need careful architecture. Not for quick tasks, bug fixes, or anything with an obvious implementation path.

**When NOT to use**: Routine feature building, simple component edits, debugging, anything where you already know the approach. Superpowers adds significant overhead — invoking it for small tasks wastes tokens and slows you down.

**Good triggers**:
- Designing a multi-step AI pipeline with tool use
- Architecting a real-time feature using Supabase Realtime + React Native
- Planning a migration that touches 10+ files across the app

---

## Subagent Iteration Strategy

Subagents are Claude's force multiplier. The pattern that consistently ships the most with the least friction:

### The Core Pattern
```
1. Scope first          — know exactly what you're building before dispatching
2. Dispatch in parallel — independent tasks run simultaneously, not serially
3. One agent per concern — don't give one agent two jobs
4. Consolidate at the end — one final agent merges findings or resolves conflicts
```

### When to Use Subagents vs. Direct Claude

| Task Type | Approach |
|---|---|
| Auditing multiple screens/components | Parallel subagents (one per folder) |
| Building a single feature end-to-end | Direct Claude with `/feature-dev` |
| Reviewing code for multiple concerns (security + types + UI) | Parallel specialist agents |
| Debugging a specific crash or type error | Direct Claude — agents add latency you don't need |
| Scaffolding components across a design system | Parallel agents per component |
| Writing a spec or planning doc | Direct Claude with `/plan` or `/prp-plan` |

### Dispatch Pattern That Works
```
"Use 4 parallel agents:
  Agent 1 — audit components/chat/ for convention violations
  Agent 2 — audit components/ui/ for hardcoded colors or values
  Agent 3 — audit lib/ for unused exports
  Agent 4 — audit app/api/ for missing error handling
Consolidate findings into a single prioritized list."
```

### Subagent Pitfalls to Avoid
- Don't dispatch agents before you've scoped the task — vague briefs produce vague results
- Don't use Explore-type agents (read-only) when you need edits — they can't make changes
- Don't give one agent too many concerns — specificity produces better output
- Don't skip the consolidation step — parallel findings need a single owner to resolve conflicts

---

## Mandatory CLAUDE.md Files

Every project built on this baseplate **must** maintain its `CLAUDE.md`. This is what makes the repo usable for future contributors and Claude sessions without requiring long onboarding conversations.

### What Must Stay Current in CLAUDE.md

| Section | Update When |
|---|---|
| Stack table | Any new major dependency added |
| File & Folder Breakdown | New route groups, new lib files, new component categories |
| API routes table | Any new `app/api/` route or `+api.ts` file |
| Where to add new things | Any new convention established by the team |
| Env Vars | Any new required environment variable |

### How to Keep It Updated
Run `/update-docs` after any session that adds new files, routes, or conventions. This triggers the `doc-updater` agent which reads the current file tree and diffs it against `CLAUDE.md`.

### Why This Matters for Hackathons
A stale `CLAUDE.md` means every new team member or new Claude session starts with wrong assumptions about where things live. In a hackathon, that's 20 minutes of confusion per person. Keep it current.

---

## Agents — `.claude/agents/`

Run automatically when relevant, or invoke explicitly by name.

### Baseplate-Specific Agents (Custom)

| Agent | When to Use | How to Invoke |
|---|---|---|
| `hackathon-scoper` | **First thing at kickoff** — give it your idea + time budget, get a 1-page scope doc | "Use hackathon-scoper to scope [idea] for a 24h hackathon" |
| `feature-planner` | **Before writing any new feature** — maps idea to existing baseplate primitives, outputs a file list | "Use feature-planner to plan [feature]" |
| `convention-enforcer` | **After a teammate pushes code** or onboarding someone new — catches wrong imports, wrong Supabase client, hardcoded colors | "Run convention-enforcer on components/myfeature/" |
| `supabase-reviewer` | **Before committing any new table, RLS policy, or auth-touching code** | "Run supabase-reviewer on lib/supabase/ and app/api/" |
| `ui-quality-reviewer` | **After building any screen or component** — catches flat/generic UI before it ships | "Run ui-quality-reviewer on app/(protected)/dashboard/" |

### Primary Review Agents for This Repo

| Agent | When to Use |
|---|---|
| `typescript-reviewer` | **Main code review agent.** After writing any TypeScript — catches type unsafety, missing generics, `any` escapes, and React Native-specific type issues |
| `code-reviewer` | General quality pass before committing — logic bugs, missing error handling, code smells |
| `security-reviewer` | Before any PR touching auth, API routes, or user data. Mobile-specific concerns: keychain storage, certificate pinning, `EXPO_PUBLIC_` key exposure |

### All Available Agents

| Agent | Purpose | When to Use |
|---|---|---|
| `planner` | Implementation planning | Complex features, refactoring |
| `architect` | System design | Architecture decisions |
| `tdd-guide` | Test-driven development | New features, bug fixes |
| `code-reviewer` | Code quality | After writing code |
| `typescript-reviewer` | TypeScript/React Native review | Primary review agent for this repo |
| `security-reviewer` | Security analysis | Before commits; mobile-specific: keychain, cert pinning, env key exposure |
| `build-error-resolver` | Fix build errors | When Metro bundler or `tsc` fails |
| `e2e-runner` | E2E testing | Critical user flows |
| `refactor-cleaner` | Dead code cleanup | Code maintenance |
| `doc-updater` | Documentation | Updating CLAUDE.md and related docs |

---

## Commands — `.claude/commands/`

Invoke with `/command-name` in the Claude Code prompt.

| Command | When | What It Does |
|---|---|---|
| `/context` | Session feels slow or off-track | Shows context usage, lets you disable unused tools |
| `/model` | Switching task modes | Change model to match the task — don't overspend |
| `/insights` | Every hour | Usage report — efficiency, friction, token spend |
| `/plan` | Feature kickoff | Interactive planning — breaks work into ordered tasks |
| `/feature-dev` | Starting a new feature | Full workflow: plan → implement → review |
| `/code-review` | Before every commit | Runs code-reviewer on recent changes |
| `/tdd` | Writing new logic | Enforces write-test-first workflow |
| `/build-fix` | Build is broken | Diagnoses and fixes Metro bundler, TypeScript, or native build errors |
| `/verify` | Before demo | Runs checks to confirm everything works |
| `/checkpoint` | Mid-hackathon | Saves session state so you can resume context |
| `/save-session` | End of work session | Persists context so next session starts informed |
| `/resume-session` | Start of next session | Reloads context from last checkpoint |
| `/quality-gate` | Before submitting | Full check: lint + types + tests + review |
| `/security-review` | Before any PR | Runs security-reviewer on changed files |
| `/update-docs` | After adding features | Keeps `CLAUDE.md` current |
| `/e2e` | Pre-demo | Runs E2E tests on critical user flows |
| `/prp-plan` | Complex feature | Product requirements + planning doc generation |
| `/distill-memory` | End of productive session | Promotes non-obvious learnings from the session into `MEMORY.md` — commit the result so teammates get it |

---

## Project Memory

This repo uses a two-layer memory system for Claude Code sessions.

### Layer 1 — Shared team memory (`MEMORY.md`, committed to git)

`MEMORY.md` at the project root is imported into every Claude Code session via `@MEMORY.md` in `CLAUDE.md`. It holds **iron-law rules** — the non-obvious facts, gotchas, and conventions every team member and every Claude session should know.

**What goes here:** rules that prevent real mistakes, architectural decisions that are easy to violate, gotchas not documented in CLAUDE.md, team conventions explicitly agreed on.

**What doesn't go here:** one-off task notes, things already in CLAUDE.md, generic best practices, anything that changes week to week.

**Sections:** `rules` · `context` · `preferences` · `gotchas`

**Hard cap:** 10,000 characters. Trim stale entries when adding new ones.

**Workflow:**
1. At the end of any productive session, run `/distill-memory`
2. Claude reviews what was learned, checks for duplicates, and updates `MEMORY.md`
3. Commit and push — teammates get the update at the start of their next session

### Layer 2 — Personal memory (`~/.claude/projects/.../memory/`, never committed)

Press `#` during any Claude Code session to save something personal — your own preferences, working style, or notes that only apply to you. Claude writes these to your local project memory automatically. They are **never shared** with teammates.

---

## Skills — `.claude/skills/`

Skills are reference libraries Claude uses automatically based on context. No invocation needed.

| Skill | Purpose | Mobile Notes |
|---|---|---|
| `frontend-design` | Screen/component design | Maps to React Native screen and component design — NativeWind classes, design token usage, animation with Animated API |
| `frontend-patterns` | UI architecture patterns | Adapts to React Native: no URL state — use navigation params or Zustand instead; container/presentational split still applies |
| `database-migrations` | Supabase schema migrations | Same as web — migration structure, rollback patterns |
| `postgres-patterns` | PostgreSQL query patterns | Same as web — query optimization, indexing, RLS policies |
| `api-design` | API route design | Expo API routes use the `+api.ts` file convention instead of Next.js `route.ts` |
| `claude-api` | Anthropic SDK usage, prompt caching | Same as web — streaming, tool use, prompt caching all apply; uses `fetch` directly (no Node polyfills needed in Metro) |
| `tdd-workflow` | Test-driven development | Same as web — Jest + React Native Testing Library |
| `security-review` | Security audit | Same as web plus mobile-specific: Expo SecureStore for keychain storage, cert pinning, `EXPO_PUBLIC_` key exposure surface |
| `coding-standards` | Code style enforcement | Same as web — immutability, naming, file size limits |
| `codebase-onboarding` | Repo orientation for new teammates | Same as web — explains repo structure and conventions |
| `git-workflow` | Git conventions | Same as web — conventional commits, PR structure, branch strategy |
| `openclaw-workspace` | Memory distillation + workspace file management | OpenClaw's canonical workflow — see "Memory Distillation" section inside the skill. Run via `/distill-memory` |
| `dart-flutter-patterns` | Flutter patterns | **SKIP — wrong platform.** This repo uses React Native, not Flutter |
| `swiftui-patterns` | SwiftUI patterns | **SKIP — wrong platform.** This repo uses React Native via Expo, not native Swift |

---

## Hooks — `settings.json`

### Currently Active

| Hook | Trigger | What It Does |
|---|---|---|
| `update-tags` | Every Edit or Write | Runs `npm run update-tags` — keeps `CONTENTS.md` files current in `app/`, `components/`, `lib/` |

### Recommended Addition

Add to the `PostToolUse` array in `.claude/settings.json` to auto-format on every edit:

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null || true"
    }
  ]
}
```

---

## What Baseplate Already Provides

Before asking Claude to build something, check this list first.

| Capability | Location |
|---|---|
| Auth — login, signup, Supabase OAuth | `app/(auth)/`, `components/auth/auth-form.tsx` |
| Plug-and-play Claude chat UI | `components/chat/chat-interface.tsx` — **fork, don't edit** |
| UI primitive components | `components/ui/` |
| Animation system | `lib/animations.ts` + `components/motion/` |
| Forms + validation | react-hook-form + zod (installed) |
| Toast notifications | react-native-toast-message |
| Supabase client (AsyncStorage-backed) | `lib/supabase/client.ts` |
| Zustand UI state store | `lib/store.ts` |
| Anthropic client + defaults | `lib/anthropic.ts` |

---

## Where to Put New Things

| Task | Where |
|---|---|
| New screen (protected) | `app/(protected)/yourscreen.tsx` |
| New public screen | `app/(auth)/yourscreen.tsx` or `app/yourscreen.tsx` |
| New API route | `app/api/[name]+api.ts` |
| New feature component | `components/[feature]/ComponentName.tsx` |
| Fork of chat UI | `components/[feature]/[Name]Chat.tsx` |
| New shared utility | `lib/[name].ts` |
| New DB query | `lib/supabase/[name].ts` |
