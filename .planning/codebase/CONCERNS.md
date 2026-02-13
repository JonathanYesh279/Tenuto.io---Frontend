# Codebase Concerns

**Analysis Date:** 2026-02-13

## Tech Debt

**Massive monolithic API service:**
- Issue: `src/services/apiService.js` is 5336 lines with ~130+ methods, making it difficult to navigate, test, and modify
- Files: `src/services/apiService.js`
- Impact: Any API change requires careful line-counting; lack of modularity increases bug risk; testing is impractical at this scale
- Fix approach: Break into domain-specific services (e.g., `teacherApi.ts`, `studentApi.ts`, `orchestraApi.ts`) with shared `ApiClient` base; gradually migrate methods into specialized services; maintain backward compatibility via facade pattern

**Duplicate cascade deletion implementations:**
- Issue: Both `src/services/cascadeDeletionService.js` (19KB) and `src/services/cascadeDeletionService.ts` (14KB) exist; unclear which is active
- Files: `src/services/cascadeDeletionService.js`, `src/services/cascadeDeletionService.ts`
- Impact: Maintenance confusion; potential for divergent behavior; double the code to maintain
- Fix approach: Determine which is canonical (likely .ts); delete the .js version; audit all imports to ensure they point to the active implementation

**Disabled CI quality gates:**
- Issue: TypeScript type checking disabled (~753 errors across 143 files); ESLint disabled; test stage disabled
- Files: `.github/workflows/ci.yml`
- Impact: Pre-existing TypeScript errors will accumulate; no lint enforcement; zero test coverage gating; bugs ship freely
- Fix approach: Enable linting first (set reasonable warning threshold like --max-warnings 50), then progressively fix TypeScript errors per feature phase (F3-F6), enable tests as suite grows; mark gate conditions in CI comments

**Missing error handling boundaries:**
- Issue: Many async operations use `.catch(() => [])` or `.catch(() => null)` to silence errors (e.g., `src/services/apiService.js:2274`, line 2297)
- Files: `src/services/apiService.js`
- Impact: Silent failures make debugging difficult; UI shows empty lists when API fails, no user feedback; cascading failures hide root causes
- Fix approach: Establish error handling strategy: (1) HTTP failures should emit toast/notification to user, (2) optional data (enrichment calls) can fall back to null/[], (3) critical data must propagate errors; use middleware pattern in ApiClient

**Validation constants vs. backend mismatch:**
- Issue: `src/utils/validationUtils.ts` line 33 defines VALID_DURATIONS = [30, 45, 60] which matches backend, but VALID_INSTRUMENTS has 25 entries while backend now has 27
- Files: `src/utils/validationUtils.ts`
- Impact: Form will reject valid instrument values that backend accepts; creates false validation errors; inconsistent with implementation guide (F1 phase completed but list remains at 25)
- Fix approach: Add remaining 2 instruments to VALID_INSTRUMENTS array; add unit test to verify count matches backend schema

**Temporary disabled grade recalculation:**
- Issue: `src/hooks/useBagrutActions.ts` line 64 TODO comment indicates CALCULATE_COMPUTED_VALUES reducer logic is broken; grade recalculation disabled (lines 65-67 commented out)
- Files: `src/hooks/useBagrutActions.ts`
- Impact: Bagrut grades may not update after form changes; computed fields like `finalGrade`, `totalPoints` become stale; users see incorrect summaries
- Fix approach: Investigate BagrutContext reducer to understand why recalculation causes loading loops; likely infinite re-render or timing issue; add logging to trace state transitions

## Known Bugs

**Student Management Tab missing students:**
- Symptoms: Teacher's student list sometimes shows empty/no students after page navigation
- Files: `src/features/teachers/details/components/tabs/StudentManagementTab.tsx`
- Trigger: Navigate to teacher details page, check student list; add/remove student then immediately refresh
- Root cause: useEffect dependency array line 104 only depends on `[teacherId]`, but `teacher.personalInfo` used in line 72 for logging; if teacher object updates without ID change, fetch is skipped
- Workaround: Hard refresh page (F5) to re-fetch student list
- Fix: Add `teacher` to dependency array or refactor to fetch teacher data independently

**Toast notifications don't always appear:**
- Symptoms: User action succeeds (API returns 200) but no confirmation message shown
- Files: `src/features/teachers/details/components/tabs/StudentManagementTab.tsx` line 281 TODO comment
- Trigger: Add/remove student; look for toast message that should appear in bottom-right
- Root cause: No toast/notification implementation in StudentManagementTab; only console.logs exist
- Workaround: Check browser console to confirm action succeeded
- Fix: Import toast library (react-hot-toast) and emit notifications on success/failure

**Race condition in student enrollment workflow:**
- Symptoms: Student appears in "all students" dropdown but enrollment fails; appears added then disappears on refresh
- Files: `src/features/teachers/details/components/tabs/StudentManagementTab.tsx` lines 171-182 (handleAddStudent)
- Trigger: Rapidly add multiple students; check student list before page finishes loading
- Root cause: handleAddStudent updates local state (setStudents) immediately but doesn't wait for re-fetch of full student list; stale data shown
- Workaround: Wait for console log "✅ StudentManagementTab - Fetched students" before assuming data is fresh
- Fix: After addStudentToTeacher succeeds, re-call fetchStudents() to get authoritative state instead of appending optimistic update

## Security Considerations

**localStorage/sessionStorage token handling:**
- Risk: Auth tokens stored in plain browser storage accessible via JavaScript; no HttpOnly flag; XSS can steal tokens
- Files: `src/services/apiService.js` line 37, 45, 54; `src/services/errorHandler.ts` line 335
- Current mitigation: Token cleared on 401 response; no explicit session timeout
- Recommendations: (1) Switch to HttpOnly cookies for token storage (requires backend `Set-Cookie` header), (2) Implement token refresh logic with silent renewal, (3) Add token expiry checks before API calls, (4) Implement logout-on-window-blur to clear sensitive data if tab left unattended

**No input sanitization for Hebrew text:**
- Risk: User-supplied names, notes, addresses not sanitized before display/export; could enable injection via special Unicode sequences
- Files: Affects all `src/features/*/details/` forms that accept `personalInfo` or `notes` fields
- Current mitigation: Zod validation regex checks for Hebrew Unicode range (line 43 in validationUtils.ts) but doesn't sanitize
- Recommendations: (1) Add DOMPurify for output sanitization, (2) Use innerText instead of dangerouslySetInnerHTML (not applicable here but good practice), (3) Validate against known injection patterns for Hebrew text, (4) Consider HTML entity encoding for exported data

**API error responses may leak sensitive data:**
- Risk: Backend error messages in `src/services/apiService.js` line 109-112 pass through directly to UI; might reveal database structure, query details, or user info
- Files: `src/services/apiService.js` lines 98-134 (handleResponse)
- Current mitigation: Some errors wrapped in generic "שגיאה" messages
- Recommendations: (1) Implement error code mapping (e.g., map VALIDATION_ERROR to user-friendly message), (2) Log full error server-side only, show sanitized message to user, (3) Whitelist allowed error messages, reject unknown ones

## Performance Bottlenecks

**StudentManagementTab fetches all students on every mount:**
- Problem: Fetching entire school student list just to show dropdown in teacher details adds 2-3 second delay for large schools
- Files: `src/features/teachers/details/components/tabs/StudentManagementTab.tsx` line 94 (allStudents)
- Cause: useEffect with teacherId dependency fetches both assigned students AND all students; no pagination or server-side filtering
- Load example: School with 500 students = 500 student records loaded + 30-50 assigned students; wasteful
- Improvement path: (1) Implement server-side search in dropdown (fetch-on-type), (2) Lazy-load student list with infinite scroll, (3) Cache all-students list in React Query with staleTime: 5min to avoid refetches

**Bagrut context recalculation disabled (incomplete):**
- Problem: Grade calculations commented out (useBagrutActions.ts lines 65-67) means bagrut summaries lag behind form edits
- Files: `src/hooks/useBagrutActions.ts`, `src/contexts/BagrutContext.tsx`
- Cause: Reducer logic causes excessive re-renders or infinite loops; disabling is workaround, not fix
- Impact: Users see stale totals until explicit save+reload; confusing UX
- Improvement path: (1) Profile renders using React DevTools Profiler to identify bottleneck, (2) Memoize reducer with useMemo, (3) Debounce recalculation calls, (4) Split computed values into separate context to avoid cascading updates

**Lesson status check O(n) per student:**
- Problem: checkStudentHasLessons (line 52-62) iterates through teacherAssignments for EVERY student in list
- Files: `src/features/teachers/details/components/tabs/StudentManagementTab.tsx`
- Cause: No indexed lookup; repeated array searches
- Scale impact: 50 students × 3 lessons each = 150 checks per component render
- Improvement path: (1) Compute lesson status map on backend or during fetch, return as field on student object, (2) Use Map/Set for O(1) lookups instead of array.some()

**Large file handling in cascade deletion preview:**
- Problem: Previewing cascade deletion for large orchestras (100+ students) shows 100+ deletion records in modal; UI freezes during rendering
- Files: `src/components/deletion/VirtualizedDeletionImpactList.tsx`
- Cause: Modal renders full list even if scrolled off-screen; no virtualization in impact list
- Improvement path: (1) Use react-window to virtualize impact list (already attempted via VirtualizedDeletionImpactList but may need tuning), (2) Paginate results in modal (show 20 at a time), (3) Server-side filter to show only critical impacts

## Fragile Areas

**BagrutContext with 400+ lines of reducer logic:**
- Files: `src/contexts/BagrutContext.tsx`
- Why fragile: Large reducer with multiple cascading state updates; comment on line 64 indicates reducer has bugs; touching it risks breaking grade calculations, validation errors, or async state
- Safe modification: (1) Add console.logs to trace action → state transitions, (2) Write specific unit tests for each reducer case before touching, (3) Use Immer middleware to eliminate spread operator errors, (4) Test in isolation with fixed bagrut fixtures
- Test coverage: Reducer untested; no vitest suite exists

**Teacher/Student form validation chain:**
- Files: `src/features/teachers/details/components/tabs/PersonalInfoTab.tsx`, `src/features/students/details/components/tabs/*`, multiple form components
- Why fragile: Phone validation hardcoded as regex in multiple places (PersonalInfoTab.tsx line 47, TeacherForm.tsx line 122, AddTeacherModal.tsx line 252); if format changes, must update 3+ places
- Safe modification: (1) Extract all phone/email/date validation to validationUtils.ts, (2) Use single validation schema (Zod) across all forms, (3) Test validation layer separately from form rendering
- Test coverage: Zero; no form-level unit tests

**Cascade deletion WebSocket integration:**
- Files: `src/services/cascadeWebSocket.js`, `src/components/deletion/VirtualizedDeletionImpactList.tsx`
- Why fragile: WebSocket events trigger state updates in components; if backend stops sending events, UI hangs; no timeout/retry logic visible
- Safe modification: (1) Add connection health check (ping/pong every 30s), (2) Implement reconnect with exponential backoff on disconnect, (3) Validate all event payloads against schema before using, (4) Test with mock WebSocket using MSW or jest mocks
- Test coverage: Integration test exists (tests/e2e/cascade-deletion.spec.ts) but unit tests for WebSocket service missing

## Scaling Limits

**localStorage for auth tokens (local-only):**
- Current capacity: Tokens persist across browser sessions; no auto-expiry
- Limit: If token is revoked server-side, browser still uses old token until manual logout; stale token lingers for days
- Impact: Compromised tokens remain valid until manual revocation + browser clear
- Scaling path: (1) Implement token expiry (5-15 min), (2) Add silent refresh endpoint (backend returns new token), (3) Check expiry in-memory before every API call, (4) Clear on browser close using sessionStorage fallback

**API rate limiting not implemented:**
- Current capacity: No client-side request deduplication visible (apiService.js pendingRequests map on line 29 is declared but usage unclear)
- Limit: Rapid user interactions (mashing buttons) send duplicate requests; no 429 handling
- Impact: Server may reject requests; user sees confusing errors; accidental duplicate creates (two students added instead of one)
- Scaling path: (1) Implement request deduplication map (method:endpoint:body as key), (2) Add retry-after header parsing, (3) Show "too many requests" to user, (4) Implement exponential backoff for retries

**Test suite cannot run (tests disabled):**
- Current capacity: 173 test files exist but CI stage is disabled; only 1-2 tests actively maintained (calendarDataProcessor.test.ts)
- Limit: As codebase grows, untested areas introduce bugs; no regression detection; breaking changes ship silently
- Impact: F7+ phases risk introducing regressions in F1-F6 code with no safety net
- Scaling path: (1) Enable Vitest in CI with minimal suite (10 key tests), (2) Set coverage threshold (50% minimum), (3) Add tests for critical paths (auth, API errors, cascade deletion), (4) Integrate Playwright E2E tests for user workflows

## Dependencies at Risk

**React Query v4.35.0 (slightly outdated):**
- Risk: v5+ released Dec 2024; v4 enters maintenance mode; no new features or security patches
- Impact: New performance optimizations in v5 (smart cache invalidation, better SSR) unavailable; edge cases may crop up as ecosystem evolves
- Migration plan: (1) Test v5 in dev branch (breaking changes in useQuery signature), (2) Update tanstack/react-query to ^5.0.0, (3) Audit all useQuery calls for breaking changes (cacheTime → gcTime, isLoading → isPending), (4) Add integration tests to catch regressions

**Moment.js v2.30.1 (deprecated):**
- Risk: Moment maintainers recommend switching to date-fns or Day.js due to lack of tree-shaking; adds 65KB to bundle
- Impact: Large bundle size; no new features planned; security fixes only
- Replacement plan: (1) Audit moment usage (likely in calendar, schedule components), (2) Replace with date-fns (already in package.json v2.30.0), (3) Update imports from moment to date-fns functions, (4) Measure bundle size improvement with vite-bundle-analyzer

**Socket.io-client v4.8.1 (potential memory leaks):**
- Risk: Versions <4.8+ had issues with connection cleanup on page unload; multiple instances can connect simultaneously
- Impact: Cascade deletion WebSocket may leak connections; switching between pages could spawn orphaned sockets
- Mitigation plan: (1) Add connection cleanup in component unmount (useEffect cleanup), (2) Ensure single WebSocket instance (singleton pattern in cascadeWebSocket.js), (3) Test by navigating away mid-operation and checking DevTools Network tab for lingering connections

## Missing Critical Features

**No multi-tenant login UI:**
- Problem: Backend supports TENANT_SELECTION_REQUIRED response (implementation guide section 3), but frontend doesn't show tenant picker
- Blocks: Multi-school deployments; any login flow that hits tenant selection fails silently
- Impact: Blocks F3 (Auth Flow) completion; enterprise adoption impossible
- Recommendation: Implement TenantSelectionModal; show after login if response includes `tenantId` array; let user pick school before redirect to dashboard

**No hours summary / ש"ש calculation display:**
- Problem: Backend has `/api/hours-summary/` endpoints but frontend doesn't call them or display hours data in teacher/student views
- Blocks: Teachers can't see weekly obligations; students can't see commitment; no compliance tracking
- Impact: Blocks F6 (Polish) Hours Summary tab implementation; critical for Israeli music school workflow
- Recommendation: Create HoursSummaryTab component; fetch from backend weekly; display as progress bar or table; update on lesson changes

**No Excel import/export UI:**
- Problem: Backend has `/api/import/` and `/api/export/` endpoints but frontend has no UI for bulk operations
- Blocks: Large data migrations; ministry report generation; backup/restore workflows
- Impact: Blocks F5 (New Pages) - ImportData, MinistryReports pages not built
- Recommendation: Create ImportDataPage with file upload, preview modal showing matched rows, execute/rollback buttons; create MinistryReportsPage with date picker and report type selector

## Test Coverage Gaps

**API service entirely untested:**
- What's not tested: request deduplication, error handling, retry logic, auth refresh, all 130+ endpoint methods
- Files: `src/services/apiService.js`
- Risk: Regressions in HTTP layer affect entire app; bugs lurk for months; refactoring unsafe
- Priority: **High** — Core service; changes break multiple features

**Form validation not tested:**
- What's not tested: Phone number format (should be 05XXXXXXXX but hardcoded in 3 places), date validation, instrument/class selection, async field validation
- Files: `src/utils/validationUtils.ts`, all form components
- Risk: Backend rejects invalid data but no feedback to user; form submits with bad data; cascading API errors
- Priority: **High** — End users hit validation errors daily; no test coverage to catch regressions

**Bagrut context state machine untested:**
- What's not tested: Reducer logic (400+ lines); action creators; state transitions; error recovery
- Files: `src/contexts/BagrutContext.tsx`, `src/hooks/useBagrutActions.ts`
- Risk: Grade recalculation disabled due to unknown reducer bug (line 64 TODO); modifying reducer is risky; broken state machines accumulate
- Priority: **Critical** — Bagrut is complex domain; disabled features hint at deep issues

**Cascade deletion workflow untested (unit level):**
- What's not tested: Preview calculation (which entities get deleted), operation status polling, rollback recovery
- Files: `src/services/cascadeDeletionService.ts`, `src/hooks/` (if exists)
- Risk: Delete operations are irreversible; bugs cause data loss; only E2E test exists (tests/e2e/cascade-deletion.spec.ts) which is slow
- Priority: **Critical** — Data loss risk

**Student/Teacher management workflows untested:**
- What's not tested: Add student to teacher, remove student, schedule lesson, update personal info, list filtering
- Files: `src/features/teachers/details/`, `src/features/students/details/`
- Risk: Core workflows broken silently; bugs ship to production; users can't perform basic operations
- Priority: **High** — Affects 70%+ of daily usage

---

*Concerns audit: 2026-02-13*
