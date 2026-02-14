# Claude Code Configuration Architecture

## Overview

This document maps the Claude Code configuration ecosystem for the Tenuto.io frontend project. It defines what each configuration layer does, where things live, and how they connect.

## Configuration Layers

| Layer | Location | Purpose |
|-------|----------|---------|
| Project instructions | `CLAUDE.md` (repo root) | Stable project conventions, patterns, commit workflow |
| Session memory | `~/.claude/projects/.../memory/MEMORY.md` | Patterns, gotchas, key file references |
| Project state | `.planning/STATE.md` | Canonical progress tracking (single source of truth) |
| Project context | `.planning/PROJECT.md` | What the project is, core value, constraints |
| Requirements | `.planning/REQUIREMENTS.md` | Requirement traceability |
| Roadmap | `.planning/ROADMAP.md` | Phase-level planning and status |
| Codebase docs | `.planning/codebase/*.md` | 7 documents: Architecture, Concerns, Conventions, Integrations, Stack, Structure, Testing |
| GSD config | `.planning/config.json` | GSD workflow settings (mode, models, research toggle) |
| Phase artifacts | `.planning/phases/XX-*/` | Per-phase: CONTEXT, PLAN, SUMMARY, REPORT files |
| Skills | `.claude/skills/*/SKILL.md` | Domain-specific Claude capabilities |
| Settings | `.claude/settings.json` | Plugin enablement |
| Local settings | `.claude/settings.local.json` | Permissions, allowed directories (gitignored) |
| Implementation guides | `.claude/*.md` | Reference specs (FRONTEND_IMPLEMENTATION_GUIDE, PLAYWRIGHT_TEST_GUIDE, etc.) |

## Skills Inventory

| Skill | Purpose | Relevance |
|-------|---------|-----------|
| `ui-ux-pro-max` | Design intelligence with searchable database | General — useful for UI work |
| `docs-explorer` | Browse official docs for frontend libraries | High — matches project stack |
| `frontend-aesthetics` | Distinctive UI aesthetics | Low — generic, but harmless |
| `frontend-tailwind` | Tailwind + React conventions | High — matches project stack exactly |

## GSD Workflow Integration

The Get Shit Done (GSD) workflow is a structured planning and execution system that integrates with this project through several touchpoints:

- `.planning/config.json` configures workflow behavior (mode, models, research toggle)
- `/gsd:discuss-phase` produces CONTEXT.md files that capture phase objectives and constraints
- `/gsd:plan-phase` produces PLAN.md files with executable task breakdowns
- `/gsd:execute-phase` executes plans atomically, produces SUMMARY.md documenting work completed
- `/gsd:verify-phase` checks completion and validates success criteria
- GSD internals live outside this repo (in `~/.claude/get-shit-done/`)

The workflow enables autonomous execution of well-defined tasks while maintaining checkpoints for human verification and decision-making.

## Single Source of Truth Rules

| Data | Canonical Location | Do NOT duplicate in |
|------|--------------------|---------------------|
| Current progress | `.planning/STATE.md` | MEMORY.md, CLAUDE.md |
| Phase status | `.planning/ROADMAP.md` | MEMORY.md |
| Project identity | `.planning/PROJECT.md` | CLAUDE.md |
| Patterns & gotchas | `MEMORY.md` | — |
| Stable instructions | `CLAUDE.md` | — |

When multiple files would contain the same information, always establish a canonical source and reference it from other locations. This prevents staleness and reduces maintenance burden.

## File Lifecycle

**One-time task prompts:** Delete after work is complete. These are temporary scaffolding.

**Phase artifacts:** Keep for history. SUMMARY.md files have long-term value as execution records and decision logs.

**Skills:** Keep if relevant to project stack, delete if they're for the wrong project or framework.

**Implementation guides:** Keep as reference even after work is done. These serve as specifications and onboarding material.

**Local settings:** Never commit `.claude/settings.local.json`. It contains machine-specific paths and permissions.

## Maintenance Guidelines

1. **Review STATE.md regularly** — It's the canonical progress tracker
2. **Update MEMORY.md for patterns, not progress** — Keep it focused on timeless knowledge
3. **Commit CLAUDE.md changes rarely** — Only update when stable patterns change
4. **Let GSD manage phase artifacts** — Don't manually edit PLAN/SUMMARY files
5. **Audit skills quarterly** — Remove skills that don't match your current stack
6. **Clean settings.local.json** — Remove stale path references when directories move
