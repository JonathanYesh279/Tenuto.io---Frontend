# Phase 5: Audit Claude Skills & GSD Workflow Agents - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Full audit of the `.claude/` configuration ecosystem and `.planning/` project artifacts. Identify redundancy, stale content, and architectural misalignment. Produce a report with verifiable criteria, implement fixes, and create an architecture document. GSD internals (workflows, agents, templates) are treated as a black box — only audit configuration and usage, not GSD's own code.

</domain>

<decisions>
## Implementation Decisions

### Audit scope
- Full audit: everything under `.claude/` — commands, hooks, plugins, settings, memory files, agents directory
- Include `.planning/` directory: STATE.md, ROADMAP.md, phase artifacts — check for consistency and staleness
- GSD system treated as config-only: audit how it's configured and which parts are used, NOT its internal workflow/template files
- General health check — no specific known pain points, systematic review

### Desired outcome
- Report + implement fixes: document findings AND make actual changes (delete stale files, restructure, clean up)
- Report lives in `.planning/phases/05-*/` alongside other phase artifacts
- Moderate cleanup aggression: remove dead things, simplify redundant things, preserve anything that might still be useful
- Verifiable success criteria: concrete pass/fail checks (e.g., "no duplicate command/workflow pairs", "no stale status references")

### Redundancy handling
- Single source of truth principle: when the same data exists in multiple places, pick one canonical location and have others reference it
- STATE.md is canonical for project progress — MEMORY.md should reference it, not duplicate progress data
- Fix ALL stale documentation: `.planning/` files, `CLAUDE.md`, and `.claude/memory/MEMORY.md` should all be consistent and current
- CLAUDE.md should be split: stable project instructions only, status/progress lives elsewhere

### Claude's Discretion
- Command ↔ workflow wrapper evaluation: Claude evaluates each case — some thin wrappers may add value as entry points, others may be pure indirection
- Layer hierarchy decisions: Claude evaluates each command → workflow → agent chain and recommends where layers add value vs add complexity
- `.agents/` directory: investigate contents and recommend keep/remove based on what's found

</decisions>

<specifics>
## Specific Ideas

- CLAUDE.md currently has F3-F6 marked as incomplete checkboxes when they're all done — this is a concrete example of stale info to fix
- MEMORY.md duplicates progress tracking that STATE.md already covers — consolidate so MEMORY.md focuses on patterns/gotchas, not status
- Create a `.claude/ARCHITECTURE.md` (or similar) after cleanup that maps: what each layer does, where things live, how they connect
- `.agents/` directory is untracked in git and of unknown origin — investigate before deciding

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-audit-claude-skills-and-gsd-workflow-agents*
*Context gathered: 2026-02-14*
