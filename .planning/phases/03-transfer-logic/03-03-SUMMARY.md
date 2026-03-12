---
phase: 03-transfer-logic
plan: "03"
subsystem: database
tags: [supabase, react-hooks, vitest, tdd, articulations, transfer]

# Dependency graph
requires:
  - phase: 03-transfer-logic/03-01
    provides: Test stub files (useArticulations.test.js, transferUtils.test.js) with it.todo stubs
provides:
  - useInstitutions() hook backed by Supabase institutions table
  - useArticulations(institutionId) hook backed by Supabase articulations table with course join
  - mapCcCoursesToUcsbRequirements() pure function mapping CC codes to satisfied UCSB requirement IDs
affects:
  - 03-transfer-logic/03-04 (TransferView will consume useInstitutions, useArticulations, mapCcCoursesToUcsbRequirements)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useState + useEffect pattern for Supabase hooks (same shape as useDeptCourses)
    - Pure utility function with no React/Supabase imports for testability
    - TDD red-green cycle with vi.mock for Supabase in hook tests

key-files:
  created:
    - src/hooks/useArticulations.js
    - src/utils/transferUtils.js
  modified:
    - src/components/__tests__/useArticulations.test.js
    - src/components/__tests__/transferUtils.test.js

key-decisions:
  - "useArticulations returns empty array (not null) with loading=false when institutionId is falsy — avoids null-guard noise in consumers"
  - "mapCcCoursesToUcsbRequirements does not filter by majorRequirements — returns all matched UCSB IDs; caller filters — keeps function reusable"
  - "Only articulation_type === 'equivalent' rows are used for mapping — combined/partial rows excluded by design"

patterns-established:
  - "Supabase hook pattern: useState+useEffect with early-return guard for missing input; Promise .then() not async/await (matches useDeptCourses.js)"
  - "Pure transfer utilities: no React or Supabase imports — full testability without renderHook"

requirements-completed: [TRANSFER-02, TRANSFER-03]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 03 Plan 03: Transfer Logic Hooks and Mapping Summary

**Supabase-backed useInstitutions/useArticulations hooks and pure mapCcCoursesToUcsbRequirements function with 7 TDD tests green**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T07:24:48Z
- **Completed:** 2026-03-07T07:28:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `useInstitutions()` hook: fetches institutions table ordered by name, returns `{ institutions, loading, error }`
- `useArticulations(institutionId)` hook: fetches articulations with join to courses table for target_course.course_id_clean; returns empty array without fetching when institutionId is null
- `mapCcCoursesToUcsbRequirements()` pure function: builds CC-to-UCSB lookup from equivalent articulations, returns deduplicated satisfied UCSB course IDs
- 7 new tests all green; full suite advances from 18 to 25 passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useArticulations hook** - `30b5802` (feat)
2. **Task 2: Implement transferUtils pure mapping function** - `ee11eae` (feat)

**Plan metadata:** (docs commit below)

_Note: TDD tasks have test-then-implementation cycles within single commits (RED confirmed before GREEN written)_

## Files Created/Modified
- `src/hooks/useArticulations.js` - Two named exports: useInstitutions (institutions table) and useArticulations (articulations + course join)
- `src/utils/transferUtils.js` - Pure named export: mapCcCoursesToUcsbRequirements
- `src/components/__tests__/useArticulations.test.js` - 3 real tests replacing it.todo stubs; vi.mock for supabase, renderHook from @testing-library/react
- `src/components/__tests__/transferUtils.test.js` - 4 real tests replacing it.todo stubs; fixture data with mockArticulations and mockRequirements

## Decisions Made
- `useArticulations` returns `{ articulations: [], loading: false, error: null }` synchronously (no useEffect triggered) when institutionId is falsy — avoids unnecessary Supabase calls
- `mapCcCoursesToUcsbRequirements` does not filter by majorRequirements contents — returns all matched UCSB IDs so callers decide what's "in requirements" — keeps function reusable across majors
- Only `articulation_type === 'equivalent'` rows participate in mapping — combined/partial articulations excluded by design per plan spec

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useInstitutions` and `useArticulations` are ready for use in TransferView (plan 03-04)
- `mapCcCoursesToUcsbRequirements` is ready to be wired into TransferView's checked-course state
- TransferView.test.jsx has 2 remaining it.todo stubs that plan 03-04 will implement

---
*Phase: 03-transfer-logic*
*Completed: 2026-03-07*
