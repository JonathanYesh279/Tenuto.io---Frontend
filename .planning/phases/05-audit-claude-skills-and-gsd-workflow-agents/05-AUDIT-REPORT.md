# .claude/ Ecosystem Audit Report

**Audit Date:** 2026-02-14
**Auditor:** Claude Sonnet 4.5 (GSD executor agent)
**Scope:** Complete audit of `.claude/`, `.agents/`, and `.planning/` configuration ecosystem

---

## Executive Summary

Comprehensive audit of the Claude Code configuration ecosystem identified **5 categories of issues** across 15+ files:
1. **Duplicates:** Exact copy of skills directory in untracked `.agents/`
2. **Wrong-project content:** Dify-specific skill in Tenuto.io repo
3. **Expired task prompts:** Completed one-time migration guide
4. **Stale documentation:** 5 files with outdated checkboxes, wrong paths, or obsolete status
5. **Settings bloat:** Duplicate permission entries and stale directory references

**Action Plan:**
- **Plan 01 (this plan):** Delete dead/duplicate files
- **Plan 02:** Fix stale documentation
- **Plan 03:** Create architecture document

---

## Section 1: Files Audited

### `.agents/` Directory (DELETED)
```
.agents/
├── component-refactoring/          [DUPLICATE] byte-identical to .claude/skills/component-refactoring/
│   ├── SKILL.md
│   └── references/
│       ├── complexity-patterns.md
│       ├── component-splitting.md
│       └── hook-extraction.md
└── ui-ux-pro-max/                  [DUPLICATE] byte-identical to .claude/skills/ui-ux-pro-max/
    ├── SKILL.md
    └── references/
        ├── aesthetics.md
        ├── design-patterns.md
        └── ux-patterns.md
```
**Verdict:** DELETE entire directory — untracked duplicate of `.claude/skills/` subset

---

### `.claude/` Directory

#### Root Files

| File | Purpose | Verdict | Issue |
|------|---------|---------|-------|
| `CLAUDE.md` | Project instructions for Claude | **FIX** | F3-F6 marked incomplete (all done), stale "What Needs Work" section |
| `FRONTEND_IMPLEMENTATION_GUIDE.md` | Complete F1-F6 specification | **KEEP** | Still useful as reference for completed work |
| `PLAYWRIGHT_TEST_GUIDE.md` | E2E testing guide | **KEEP** | Still useful, testing ongoing |
| `MULTI_TENANT_GUIDE_IMPLEMENTATION.md` | One-time migration task list | **DELETE** | All 5 tasks complete (Phase 1), expired prompt |
| `mimshak-export-upgrade-prompt (1).md` | Future v2 export work guide | **KEEP** | Needed for EXP-01/02 plans (future work) |

#### `.claude/skills/` Directory

| Skill | Purpose | Verdict | Issue |
|-------|---------|---------|-------|
| `component-refactoring/` | Component refactoring patterns | **DELETE** | Written for Dify project (pnpm commands, web/app/ paths not in this repo) |
| `docs-explorer/` | Documentation exploration | **KEEP** | Generic, relevant to any codebase |
| `frontend-aesthetics/` | General aesthetics guidance | **KEEP** | Generic but harmless |
| `frontend-tailwind/` | Tailwind CSS patterns | **KEEP** | Aligns with project's Tailwind stack |
| `ui-ux-pro-max/` | UI/UX reference | **KEEP** | Generic but useful |

---

### `.planning/` Directory

| File | Purpose | Verdict | Issue |
|------|---------|---------|-------|
| `PROJECT.md` | Project overview | **FIX** | Wrong backend path (`/mnt/c/Projects/` instead of `/mnt/c/Users/`), stale constraints section |
| `ROADMAP.md` | Phase roadmap | **FIX** | No completion markers, doesn't reflect that Phases 1-4 are complete |
| `REQUIREMENTS.md` | Requirements traceability | **FIX** | All features marked "Pending" when F1-F6 + v1.1 complete |
| `STATE.md` | Execution state tracking | **GOOD** | Most up-to-date, canonical source of truth |
| `phases/*/` | Phase artifacts (CONTEXT, PLAN, SUMMARY) | **GOOD** | Well-structured, complete for Phases 1-4 |

---

### `.claude/memory/MEMORY.md`

**Purpose:** User's private global instructions for all projects
**Verdict:** **FIX**
**Issues:**
- Duplicates STATE.md progress tracking (Phases Overview checkboxes)
- Should focus on patterns/gotchas, not status
- Backend path warning correct but redundant with PROJECT.md

---

### `settings.local.json`

**Purpose:** Claude Code workspace settings
**Verdict:** **FIX**
**Issues:**
- Stale `additionalDirectories` pointing to backup directories
- Duplicate permission entries (multiple identical read/write permissions)

---

## Section 2: Findings by Category

### 2.1 Duplicates Found

**Issue:** `.agents/` directory was an exact byte-identical copy of a subset of `.claude/skills/`

**Evidence:**
```bash
$ diff -rq .agents/component-refactoring .claude/skills/component-refactoring
# No differences found (byte-identical)

$ diff -rq .agents/ui-ux-pro-max .claude/skills/ui-ux-pro-max
# No differences found (byte-identical)
```

**Impact:** Confusion, wasted disk space, unclear which directory is canonical

**Resolution:** Delete entire `.agents/` directory

---

### 2.2 Wrong-Project Content

**Issue:** `.claude/skills/component-refactoring/` skill written for "Dify frontend" project

**Evidence:**
- References `pnpm analyze-component` and `pnpm refactor-component` (not in this repo's package.json)
- References Dify-specific paths: `web/app/components/`, `web/service/`
- Tenuto.io uses npm, not pnpm
- None of the referenced scripts or paths exist in this codebase

**Impact:** Confusion, wasted time trying to use irrelevant skill

**Resolution:** Delete `.claude/skills/component-refactoring/` directory

---

### 2.3 Expired Task Prompts

**Issue:** `.claude/MULTI_TENANT_GUIDE_IMPLEMENTATION.md` is a completed one-time task list

**Evidence:**
- Lists 5 tasks: delete demo pages, fix role mapping, sync instruments, etc.
- All tasks completed in Phase 1 (v1.1 milestone)
- File is not a reference guide, it's an expired TODO list
- No longer provides value

**Resolution:** Delete `.claude/MULTI_TENANT_GUIDE_IMPLEMENTATION.md`

---

### 2.4 Stale Documentation

#### `.claude/CLAUDE.md`
**Issues:**
- F3-F6 marked as `[ ]` (incomplete) when all are done
- "Current State (What Needs Work)" section lists completed items
- Should focus on stable project instructions, not status tracking

#### `.planning/PROJECT.md`
**Issues:**
- Backend path: `/mnt/c/Projects/conservatory-app/Backend` (WRONG - this is backup directory)
- Correct path: `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend`
- "Constraints" section lists 19 instruments (now 27)

#### `.planning/ROADMAP.md`
**Issues:**
- No completion markers showing Phases 1-4 are complete
- Looks like all work is pending when milestone v1.1 is done

#### `.planning/REQUIREMENTS.md`
**Issues:**
- All features marked "Pending" in Status column
- No traceability showing F1-F6 + v1.1 completion
- Missing links to phase artifacts

#### `.claude/memory/MEMORY.md`
**Issues:**
- Duplicates progress tracking from STATE.md (Phases Overview checkboxes)
- Should reference STATE.md, not duplicate status
- Should focus on patterns, gotchas, and lessons learned

---

### 2.5 Settings Bloat

**Issue:** `settings.local.json` has stale references and duplicates

**Evidence:**
```json
"additionalDirectories": [
  "/mnt/c/Projects/conservatory-app/Backend",  // Backup directory, not current backend
  "/mnt/c/Projects/conservatory-app-BACKUP-20250826-221327",  // Old backup
  "/mnt/c/Projects/BACKUP-20250826-221714"  // Old backup
]
```

Multiple duplicate permission entries for the same files.

**Impact:** Confusion about which directories are active, performance overhead

**Resolution:** Clean up additionalDirectories (Plan 02), deduplicate permissions

---

## Section 3: Actions Taken (Plan 01)

**Executed:** 2026-02-14

### Deletions Performed

1. **`.agents/` directory** (entire tree)
   - Reason: Untracked duplicate of `.claude/skills/` subset
   - Verification: `ls .agents/ 2>/dev/null` → no output (directory gone)

2. **`.claude/skills/component-refactoring/`** (entire directory)
   - Reason: Written for Dify project, not Tenuto.io
   - Verification: `ls .claude/skills/component-refactoring/ 2>/dev/null` → no output

3. **`.claude/MULTI_TENANT_GUIDE_IMPLEMENTATION.md`**
   - Reason: Completed one-time task prompt (all tasks done in Phase 1)
   - Verification: `ls .claude/MULTI_TENANT_GUIDE_IMPLEMENTATION.md 2>/dev/null` → no output

### Files Preserved

✓ `.claude/skills/ui-ux-pro-max/` — generic UI/UX reference
✓ `.claude/skills/docs-explorer/` — relevant to project stack
✓ `.claude/skills/frontend-aesthetics/` — general aesthetics guidance
✓ `.claude/skills/frontend-tailwind/` — aligns with Tailwind stack
✓ `.claude/FRONTEND_IMPLEMENTATION_GUIDE.md` — comprehensive spec
✓ `.claude/PLAYWRIGHT_TEST_GUIDE.md` — testing guide
✓ `.claude/mimshak-export-upgrade-prompt (1).md` — needed for future EXP-01/02

**Commit:** `e64d072` — "chore(05-01): remove dead and duplicate files from .claude ecosystem"

---

## Section 4: Actions Pending (Plan 02)

### Documentation Fixes

1. **`.claude/CLAUDE.md`**
   - [ ] Mark F3-F6 as `[x]` (complete)
   - [ ] Update "Current State" section with accurate status
   - [ ] Remove stale checkboxes, focus on stable instructions

2. **`.planning/PROJECT.md`**
   - [ ] Fix backend path: `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend`
   - [ ] Update constraints: 27 instruments (not 19)
   - [ ] Reflect completed F1-F6 + v1.1 work

3. **`.planning/ROADMAP.md`**
   - [ ] Add completion markers for Phases 1-4
   - [ ] Show milestone v1.1 as complete
   - [ ] Update "Current Phase" to Phase 5

4. **`.planning/REQUIREMENTS.md`**
   - [ ] Update Status column: show completed features
   - [ ] Add traceability: link requirements to phase artifacts
   - [ ] Reference STATE.md for current position

5. **`.claude/memory/MEMORY.md`**
   - [ ] Remove duplicate progress tracking (reference STATE.md instead)
   - [ ] Focus on patterns, gotchas, lessons learned
   - [ ] Keep backend path warning (useful)

6. **`settings.local.json`**
   - [ ] Remove stale `additionalDirectories` (backup paths)
   - [ ] Keep only current backend: `/mnt/c/Users/yona2/Documents/Tenuto.io/Tenuto.io-Backend`
   - [ ] Deduplicate permission entries

---

## Section 5: Verifiable Criteria

### Completion Checklist

**After Plan 01 (file cleanup):**
- [x] No duplicate files between .agents/ and .claude/skills/
- [x] No skills reference wrong project (Dify)
- [x] No completed one-time prompts in .claude/

**After Plan 02 (documentation fixes):**
- [ ] CLAUDE.md has no stale checkboxes (F3-F6 marked complete)
- [ ] PROJECT.md has correct backend path
- [ ] ROADMAP.md shows Phases 1-4 complete
- [ ] REQUIREMENTS.md traceability shows completed phases
- [ ] MEMORY.md does not duplicate STATE.md progress tracking
- [ ] settings.local.json has no stale directory references

**After Plan 03 (architecture document):**
- [ ] Architecture document exists at `.claude/ARCHITECTURE.md`
- [ ] Document maps: layers, file locations, connections

---

## Appendix: File Inventory

### Before Cleanup
```
.agents/                                    [DELETE - duplicate]
  component-refactoring/
  ui-ux-pro-max/
.claude/
  CLAUDE.md                                  [FIX - stale checkboxes]
  FRONTEND_IMPLEMENTATION_GUIDE.md           [KEEP]
  PLAYWRIGHT_TEST_GUIDE.md                   [KEEP]
  MULTI_TENANT_GUIDE_IMPLEMENTATION.md       [DELETE - expired]
  mimshak-export-upgrade-prompt (1).md       [KEEP]
  skills/
    component-refactoring/                   [DELETE - wrong project]
    docs-explorer/                           [KEEP]
    frontend-aesthetics/                     [KEEP]
    frontend-tailwind/                       [KEEP]
    ui-ux-pro-max/                           [KEEP]
  memory/
    MEMORY.md                                [FIX - duplicate tracking]
.planning/
  PROJECT.md                                 [FIX - wrong path]
  ROADMAP.md                                 [FIX - no completion markers]
  REQUIREMENTS.md                            [FIX - all marked Pending]
  STATE.md                                   [GOOD - canonical]
settings.local.json                          [FIX - stale directories]
```

### After Plan 01 Cleanup
```
.claude/
  CLAUDE.md                                  [FIX in Plan 02]
  FRONTEND_IMPLEMENTATION_GUIDE.md           [KEEP]
  PLAYWRIGHT_TEST_GUIDE.md                   [KEEP]
  mimshak-export-upgrade-prompt (1).md       [KEEP]
  skills/
    docs-explorer/                           [KEEP]
    frontend-aesthetics/                     [KEEP]
    frontend-tailwind/                       [KEEP]
    ui-ux-pro-max/                           [KEEP]
  memory/
    MEMORY.md                                [FIX in Plan 02]
.planning/
  PROJECT.md                                 [FIX in Plan 02]
  ROADMAP.md                                 [FIX in Plan 02]
  REQUIREMENTS.md                            [FIX in Plan 02]
  STATE.md                                   [GOOD]
settings.local.json                          [FIX in Plan 02]
```

---

**Report Status:** Complete
**Next Steps:** Execute Plan 02 (documentation fixes)
