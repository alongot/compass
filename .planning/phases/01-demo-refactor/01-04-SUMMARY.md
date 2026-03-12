---
phase: 01-demo-refactor
plan: 04
subsystem: frontend-components
tags: [react, component-extraction, refactor, views]
dependency_graph:
  requires:
    - 01-01 (theme, courseUtils, requirementsUtils, majorConfigs, catalogDescriptions)
    - 01-02 (useDeptCourses, useMajorRequirements hooks)
    - 01-03 (StatusBadge, DifficultyBadge, ProgressRing, SearchableSelect shared components)
  provides:
    - src/components/LoadingScreen.jsx
    - src/components/LoginScreen.jsx
    - src/components/Sidebar.jsx
    - src/components/RequirementsView.jsx
    - src/components/QuarterPlannerView.jsx
    - src/components/DashboardView.jsx
    - src/components/WhatIfView.jsx
    - src/components/RoadmapView.jsx
    - src/components/CourseBrowserView.jsx
    - src/components/ProfileWizard.jsx
  affects:
    - 01-05 (Plan 05 will trim CompassDemo.jsx to thin composition root using these files)
tech_stack:
  added: []
  patterns:
    - Named exports on all view components
    - getCatalogDescriptions() called inside component body (not module-level)
    - API_BASE defined locally in ProfileWizard (empty string, proxied by Vite)
key_files:
  created:
    - src/components/LoadingScreen.jsx
    - src/components/LoginScreen.jsx
    - src/components/Sidebar.jsx
    - src/components/RequirementsView.jsx
    - src/components/QuarterPlannerView.jsx
    - src/components/DashboardView.jsx
    - src/components/WhatIfView.jsx
    - src/components/RoadmapView.jsx
    - src/components/CourseBrowserView.jsx
    - src/components/ProfileWizard.jsx
  modified: []
decisions:
  - "API_BASE (empty string) defined as module-level const in ProfileWizard.jsx rather than importing from a shared module — no shared API config module exists yet"
  - "catalogDescriptions assigned via getCatalogDescriptions() at component function body start (not module-level) to match plan spec and avoid stale reference issues"
  - "CourseBrowserView imports MAJOR_CONFIGS and buildKnownCourses directly (plan spec only listed getCatalogDescriptions but component requires both for difficultyLookup)"
metrics:
  duration_minutes: 9
  completed_date: "2026-03-05"
  tasks_completed: 2
  files_created: 10
  files_modified: 0
---

# Phase 1 Plan 04: Extract View Components Summary

All 10 view components extracted from CompassDemo.jsx into individual files under src/components/. Each file has proper import blocks referencing the leaf modules, hooks, and shared components created in Plans 01-03. CompassDemo.jsx remains unchanged at 5086 lines.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extract simpler views | b1f6d8a | LoadingScreen.jsx, LoginScreen.jsx, Sidebar.jsx, RequirementsView.jsx, QuarterPlannerView.jsx |
| 2 | Extract complex views | 095982f | DashboardView.jsx, WhatIfView.jsx, RoadmapView.jsx, CourseBrowserView.jsx, ProfileWizard.jsx |

## Verification Results

- `npm run build`: green (no errors, only pre-existing chunk size warning)
- All 10 view files present in `src/components/`
- Every non-shared view imports `theme` from `../styles/theme.js`
- `RoadmapView` imports `RequirementsView` and `QuarterPlannerView` from their new files
- `CourseBrowserView` uses `getCatalogDescriptions()` from `src/data/demo/catalogDescriptions.js`
- `CompassDemo.jsx` line count: 5086 (unchanged)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing import] CourseBrowserView needs MAJOR_CONFIGS and buildKnownCourses**
- **Found during:** Task 2
- **Issue:** The plan's import block for CourseBrowserView did not include `MAJOR_CONFIGS` or `buildKnownCourses`, but the component body uses both (`config = MAJOR_CONFIGS[majorId]` and `buildKnownCourses(config.requirements, ...)` for difficultyLookup)
- **Fix:** Added `import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js'` and `import { buildKnownCourses } from '../utils/courseUtils.js'` to CourseBrowserView.jsx
- **Files modified:** src/components/CourseBrowserView.jsx
- **Commit:** 095982f

**2. [Rule 2 - Missing const] ProfileWizard needs API_BASE**
- **Found during:** Task 2
- **Issue:** ProfileWizard uses `API_BASE` in fetch calls; it is defined in CompassDemo.jsx but not in any extracted module
- **Fix:** Added `const API_BASE = '';` as a module-level constant in ProfileWizard.jsx (matches CompassDemo.jsx definition at line 1309)
- **Files modified:** src/components/ProfileWizard.jsx
- **Commit:** 095982f

**3. [Rule 2 - Missing import] ProfileWizard needs buildKnownCourses and extractCourseId**
- **Found during:** Task 2
- **Issue:** ProfileWizard uses both `buildKnownCourses` (step 3 manual entry, step 4 current quarter) and `extractCourseId` (handleComplete, step 3 alreadyAddedIds), which were not in the plan's import block
- **Fix:** Added both to `import { buildKnownCourses, extractCourseId } from '../utils/courseUtils.js'`
- **Files modified:** src/components/ProfileWizard.jsx
- **Commit:** 095982f

## Self-Check: PASSED

All 10 component files found on disk. Both task commits (b1f6d8a, 095982f) verified in git log.
