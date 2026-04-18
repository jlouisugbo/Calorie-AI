# Distill Project Memory

Promote learnings from this session into `MEMORY.md`.

## When to use

Run `/distill-memory` at the end of any session where you discovered something non-obvious:
a gotcha, an architectural decision, a pattern the team should follow, or a rule that
prevented a mistake.

## What belongs in MEMORY.md

- Rules that prevented or would prevent real mistakes
- Gotchas not documented elsewhere (not in CLAUDE.md, not obvious from the code)
- Architectural decisions that are load-bearing and easy to violate by accident
- Team conventions explicitly agreed on

## What does NOT belong

- Things already in CLAUDE.md
- One-off task details ("today I fixed X")
- Anything that changes week to week
- Generic best practices not specific to this codebase

## Process

1. Review what was learned or decided in this session
2. Read the current `MEMORY.md` to check for duplicates
3. For each candidate fact, ask: "Would a new team member starting tomorrow benefit from knowing this?"
4. If yes: add it under the right section (`rules`, `context`, `preferences`, or `gotchas`)
5. Keep each entry to one clear sentence
6. Keep the total file under 10,000 characters — trim stale entries if needed
7. Write the update to `MEMORY.md`

## Sections

- **rules** — must-follow constraints (violations cause bugs or broken conventions)
- **context** — stable facts about how the project is structured or why decisions were made
- **preferences** — how the team likes things done (tooling, commit style, patterns)
- **gotchas** — non-obvious traps that have bitten or would bite someone

## Personal vs team memory

If the learning is personal (your own preferences, not team-wide), use the `#` key
during a Claude Code session to save it to your personal project memory instead.
That goes to `~/.claude/projects/.../memory/` and is never shared with teammates.
