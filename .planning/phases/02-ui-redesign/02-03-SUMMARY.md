---
phase: 02-ui-redesign
plan: 03
subsystem: ui
tags: [react, modal, end-quarter, grade-entry, enrollment, vitest]

# Dependency graph
requires:
  - phase: 02-ui-redesign/02-01
    provides: vitest test infrastructure with jsdom and @testing-library/react
  - phase: 02-ui-redesign/02-02
    provides: theme token system used throughout EndQuarterModal styling

provides:
  - EndQuarterModal.jsx: two-step modal for grade entry and next-quarter enrollment
  - handleEndQuarter bulk handler in CompassDemo.jsx: one structuredClone/saveUser atomic update
  - End Quarter button wired in DashboardView.jsx with modal conditional render

affects:
  - 03-transfer-logic
  - 04-degree-auditor

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-step modal pattern: step 1 (grade entry) advances to step 2 (enrollment picker) before committing
    - Bulk handler pattern: one structuredClone + one saveUser call for multi-course atomic updates
    - Controlled grade map state: grades initialized from inProgressCourses, updated per-select onChange

key-files:
  created:
    - src/components/EndQuarterModal.jsx
  modified:
    - CompassDemo.jsx
    - src/components/DashboardView.jsx

key-decisions:
  - "EndQuarterModal uses named export (not default) for consistency with other shared components"
  - "handleEndQuarter uses extractCourseId() for normalization, matching existing handler pattern in CompassDemo.jsx"
  - "Grade options array GRADE_OPTIONS = ['A','A-','B+','B','B-','C+','C','C-','D+','D','F'] defined at module level in EndQuarterModal"

patterns-established:
  - "Modal backdrop uses onClick={onClose} with stopPropagation on inner card to prevent dismiss on content click"
  - "Escape key handler attached via useEffect with cleanup on unmount, dependency array includes onClose"

requirements-completed: [UI-02]

# Metrics
duration: 30min
completed: 2026-03-06
---

# Phase 2 Plan 03: End Quarter Modal Summary

**Two-step End Quarter modal with grade entry and next-quarter enrollment picker, backed by one atomic handleEndQuarter bulk handler in CompassDemo.jsx**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-03-06
- **Completed:** 2026-03-06
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created EndQuarterModal.jsx with two-step flow: step 1 collects final grades via select dropdowns for each in-progress course; step 2 shows a scrollable checkbox enrollment picker for next-quarter courses
- Added handleEndQuarter bulk handler to CompassDemo.jsx that performs one structuredClone, graduates all in-progress courses with their grades, enrolls selected next-quarter courses, then calls saveUser once and setCurrentUser once
- Wired End Quarter button in DashboardView.jsx current-quarter card header (visible only when in_progress courses exist), with conditional EndQuarterModal render and showEndQuarter state
- All 18 tests pass green including 4 EndQuarterModal UI tests and 4 CompassDemo bulk logic tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EndQuarterModal.jsx and add handleEndQuarter to CompassDemo.jsx** - `91888d3` (feat)
2. **Task 2: Wire End Quarter button in DashboardView.jsx** - `644774b` (feat)

## Files Created/Modified

- `src/components/EndQuarterModal.jsx` - Two-step modal: grade entry (step 1) + next-quarter enrollment picker (step 2). Uses theme tokens throughout. Escape key and backdrop click both call onClose.
- `CompassDemo.jsx` - handleEndQuarter bulk handler added after handleAddInProgress; passed to DashboardView via dashProps as onEndQuarter and knownCourses
- `src/components/DashboardView.jsx` - EndQuarterModal import, showEndQuarter state, End Quarter button in current-quarter card header, conditional EndQuarterModal render at end of return

## Decisions Made

- EndQuarterModal uses named export (`export function EndQuarterModal`) matching the other shared component export style
- Grade options in modal: `['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']` — omits P/NP (quarter end implies standard grading)
- handleEndQuarter uses `extractCourseId()` for normalization so it handles both plain string and object course formats consistently with other handlers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- End Quarter UX flow fully functional end-to-end: button visible, modal opens, grades submitted, next-quarter enrollment optional, all persisted via one server call
- DashboardView now receives onEndQuarter and knownCourses props from CompassDemo dashProps
- Ready for Phase 3 transfer logic work

---
*Phase: 02-ui-redesign*
*Completed: 2026-03-06*
