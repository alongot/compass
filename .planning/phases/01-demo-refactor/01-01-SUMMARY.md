---
phase: 01-demo-refactor
plan: 01
subsystem: ui
tags: [react, vite, refactor, modules, data]

requires: []
provides:
  - "src/styles/theme.js — UCSB color theme constant (primary #003660, secondary #FEBC11)"
  - "src/utils/courseUtils.js — extractCourseId, buildKnownCourses, getMajorId"
  - "src/utils/requirementsUtils.js — buildUserRequirements, buildUserQuarterPlan"
  - "src/data/demo/majorConfigs.js — MAJOR_CONFIGS runtime object for all 12 majors"
  - "src/data/demo/catalogDescriptions.js — getCatalogDescriptions() course description map"
affects: [01-02, 01-03, 01-04, 01-05]

tech-stack:
  added: []
  patterns:
    - "Leaf modules first: extract dependencies that have no local imports before extracting consumers"
    - "DAG import order: majorConfigs <- courseUtils <- requirementsUtils"
    - "Transform pattern: majors.json (audited data) + QUARTER_PLANS/DIFFICULTY_SCORES (inline) -> MAJOR_CONFIGS runtime shape"
    - "structuredClone instead of JSON.parse(JSON.stringify) for deep object copies"

key-files:
  created:
    - src/styles/theme.js
    - src/utils/courseUtils.js
    - src/utils/requirementsUtils.js
    - src/data/demo/majorConfigs.js
    - src/data/demo/catalogDescriptions.js
  modified: []

key-decisions:
  - "MAJOR_CONFIGS runtime shape is produced by transforming majors.json (audited requirements + prereqEdges) merged with QUARTER_PLANS and DIFFICULTY_SCORES (hardcoded in majorConfigs.js) — mirrors the post-processing block in CompassDemo.jsx exactly"
  - "CompassDemo.jsx left fully intact (5086 lines) during plan 01 — new modules are created alongside, not replacing, the monolith"
  - "Circular import risk avoided: majorConfigs.js does NOT import from courseUtils.js; courseUtils.js imports MAJOR_CONFIGS from majorConfigs.js"

patterns-established:
  - "Extract-then-replace: create standalone module files first, verify build, then update import sites in a later plan"
  - "Difficulty scores embedded as constants in majorConfigs.js since majors.json omits them"

requirements-completed: [REFACTOR-01, REFACTOR-02]

duration: 15min
completed: 2026-03-05
---

# Phase 1 Plan 1: Extract Leaf Modules Summary

**Five standalone ES modules extracted from CompassDemo.jsx (theme, courseUtils, requirementsUtils, majorConfigs, catalogDescriptions) with verified acyclic import graph and green npm build**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-05T22:28:00Z
- **Completed:** 2026-03-05T22:43:53Z
- **Tasks:** 2 of 2
- **Files modified:** 5 created, 0 modified

## Accomplishments

- Created five leaf modules that form the import foundation for the entire refactor
- Established a DAG import order (majorConfigs -> courseUtils -> requirementsUtils) with zero circular imports
- Replaced `JSON.parse(JSON.stringify())` deep clone with `structuredClone()` in requirementsUtils
- npm run build exits 0 with no circular dependency warnings

## Task Commits

1. **Task 1: Create theme, courseUtils, and requirementsUtils** - `7803a9a` (feat)
2. **Task 2: Create majorConfigs.js and catalogDescriptions.js; verify build** - `51ad9e5` (feat)

## Files Created/Modified

- `src/styles/theme.js` — UCSB color theme (primary #003660, secondary #FEBC11, grays)
- `src/utils/courseUtils.js` — extractCourseId, buildKnownCourses, getMajorId; imports MAJOR_CONFIGS
- `src/utils/requirementsUtils.js` — buildUserRequirements, buildUserQuarterPlan; imports extractCourseId
- `src/data/demo/majorConfigs.js` — MAJOR_CONFIGS for all 12 majors; transforms majors.json + inline QUARTER_PLANS + DIFFICULTY_SCORES
- `src/data/demo/catalogDescriptions.js` — getCatalogDescriptions() description lookup from courses-with-prereqs.json

## Decisions Made

- Replicated the CompassDemo.jsx post-processing block (lines 1024-1072) inside majorConfigs.js so the module produces the identical runtime shape components expect. Inline QUARTER_PLANS and DIFFICULTY_SCORES constants compensate for data that majors.json omits.
- Used `structuredClone` instead of `JSON.parse(JSON.stringify)` in requirementsUtils — same semantics, cleaner, no serialization overhead.
- CompassDemo.jsx remains untouched at 5086 lines — plan 01 only creates files, import updates happen in plan 02+.

## Deviations from Plan

None — plan executed exactly as written. The plan's suggested inline data objects (QUARTER_PLANS, PREREQ_EDGES) were implemented with the addition of DIFFICULTY_SCORES to preserve difficulty values, which aligns with the intent of the transform block in CompassDemo.jsx.

## Issues Encountered

None. Build succeeded on first attempt.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All five leaf modules are importable and verified via npm build
- Plan 02 can safely import from these modules when adding hooks (useMajorRequirements, useDeptCourses) as standalone files
- CompassDemo.jsx import sites (theme, MAJOR_CONFIGS, extractCourseId, etc.) will be updated in a later plan after all modules exist

---
*Phase: 01-demo-refactor*
*Completed: 2026-03-05*
