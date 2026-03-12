---
phase: 01-demo-refactor
plan: 02
subsystem: ui
tags: [react, hooks, supabase, refactor, modules]

requires:
  - "src/data/demo/majorConfigs.js — MAJOR_CONFIGS (from plan 01)"
  - "src/lib/supabase.js — supabase client"
provides:
  - "src/hooks/useDeptCourses.js — React hook for fetching Supabase courses by dept codes"
  - "src/hooks/useMajorRequirements.js — React hook for fetching and enriching major requirements"
affects: [01-03, 01-04, 01-05]

tech-stack:
  added: []
  patterns:
    - "Extract-then-replace: hooks created standalone first, import updates deferred to plan 03+"
    - "Wave 2 ordering: hooks depend on Wave 1 leaf modules (majorConfigs.js) — extracted after leaves"

key-files:
  created:
    - src/hooks/useDeptCourses.js
    - src/hooks/useMajorRequirements.js
  modified: []

key-decisions:
  - "CompassDemo.jsx left fully intact (5086 lines) — hooks created alongside the monolith, not replacing it"
  - "useMajorRequirements imports MAJOR_CONFIGS from majorConfigs.js (Plan 01 leaf) — confirms Wave 2 dependency chain is intact"

requirements-completed: [REFACTOR-01]

duration: 1min
completed: 2026-03-05
---

# Phase 1 Plan 2: Extract Data-Fetching Hooks Summary

**Two standalone React hooks extracted to src/hooks/ — useDeptCourses (Supabase dept course fetch) and useMajorRequirements (major requirements enrichment with live course data) — with verified green npm build and CompassDemo.jsx untouched**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-05T22:46:10Z
- **Completed:** 2026-03-05T22:46:58Z
- **Tasks:** 2 of 2
- **Files modified:** 2 created, 0 modified

## Accomplishments

- Created `src/hooks/useDeptCourses.js` with named export — fetches courses from Supabase by dept codes using LIKE filter, returns `{ courses, loading, error }`
- Created `src/hooks/useMajorRequirements.js` with named export — fetches live Supabase course data and merges over hardcoded MAJOR_CONFIGS structure (title, units, description), returns `{ requirements, error }`
- Both hooks are importable alongside existing `useDatabase.js` and `useCourses.js` in `src/hooks/`
- npm run build exits 0 with no new errors or warnings
- CompassDemo.jsx remains untouched at 5086 lines

## Task Commits

1. **Task 1: Extract useDeptCourses** - `b970ea7` (feat)
2. **Task 2: Extract useMajorRequirements** - `a7762fe` (feat)

## Files Created/Modified

- `src/hooks/useDeptCourses.js` — React hook; imports supabase; returns `{ courses, loading, error }`
- `src/hooks/useMajorRequirements.js` — React hook; imports supabase + MAJOR_CONFIGS; returns `{ requirements, error }`

## Decisions Made

- Both hooks follow the extract-then-replace pattern established in Plan 01 — standalone files created first, actual import-site updates in CompassDemo.jsx deferred to Plan 03+
- `useMajorRequirements` falls back to `MAJOR_CONFIGS.econ_ba` when `majorId` is unknown — matches behavior in CompassDemo.jsx

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Both builds succeeded on first attempt.

## Self-Check: PASSED

- `src/hooks/useDeptCourses.js` — FOUND
- `src/hooks/useMajorRequirements.js` — FOUND
- Commit `b970ea7` — FOUND
- Commit `a7762fe` — FOUND

---
*Phase: 01-demo-refactor*
*Completed: 2026-03-05*
