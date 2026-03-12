# Phase 1: Demo Refactor - Research

**Researched:** 2026-03-05
**Domain:** React component architecture, code splitting, state management patterns
**Confidence:** HIGH

## Summary

CompassDemo.jsx is a 5,086-line React monolith (as of this analysis — the git snapshot says 3991, but the actual file is larger) containing all views, hooks, utilities, mock data, and the composition root in a single file. Every view component (DashboardView, RoadmapView, CourseBrowserView, WhatIfView, ProfileWizard, LoginScreen, Sidebar), every utility function (extractCourseId, buildUserRequirements, buildUserQuarterPlan, buildKnownCourses), and the entire MAJOR_CONFIGS data object (which duplicates what now lives in `src/data/demo/majors.json`) are co-located. The app has no Redux, no Zustand, no Context API — all state lives in the root `CompassDemo()` function, passed down as props.

The refactor goal is decomposition without behavioral change. This is a pure structural refactoring: move code to better-named files, replace JSON.parse/stringify deep copies with proper spread patterns or structuredClone, and ensure the composition root (`CompassDemo.jsx`) is a thin orchestrator. No new features, no API changes, no styling changes.

The key structural facts that govern the plan: (1) `src/main.jsx` imports `CompassDemo` as a default export — this must remain intact. (2) `src/data/demo/majors.json` already exists with 12 majors in a richer schema than what MAJOR_CONFIGS has inline, but the two schemas differ (JSON has `sections` key, inline uses direct requirement category keys with `defaultQuarterPlan` and `prereqEdges`). (3) The inline MAJOR_CONFIGS must be reconciled with or replaced by the JSON file. (4) The `catalogDescriptions` object is built at module load from a 22,694-line JSON file — this should move with the data layer.

**Primary recommendation:** Extract files in dependency order (utils first, then data, then hooks, then views, then root cleanup) to avoid circular import issues. Do not use Immer — structuredClone or targeted spread patterns are sufficient and add no dependency.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REFACTOR-01 | CompassDemo.jsx decomposed into separate component files (views, hooks, data, utils) | Component line-range map and dependency graph below enable direct task-per-component planning |
| REFACTOR-02 | Mock data moved from inline module-level code to imported JSON/module files | MAJOR_CONFIGS reconciliation strategy and catalogDescriptions lazy-init pattern documented below |
| REFACTOR-03 | State management uses proper patterns (no JSON.parse/stringify deep copies) | Five handler sites identified; structuredClone replacement pattern documented below |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | Component model | Already in use |
| Vite | 5.0.0 | Build/dev server | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| structuredClone | Native (Node 17+, modern browsers) | Deep copy without JSON roundtrip | Replaces JSON.parse/stringify in all 5 handler sites |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| structuredClone | Immer | Immer is better for complex nested updates but adds a dependency; for this codebase the objects are shallow enough that structuredClone is sufficient |
| structuredClone | lodash cloneDeep | Same issue — new dependency, no benefit over native |
| Flat file extraction | Feature-folder structure | Feature folders would group by domain (e.g., `src/features/dashboard/`); valid for larger codebases, but the project is small enough that a flat `src/components/` + `src/hooks/` + `src/utils/` + `src/data/` split is simpler and matches the existing directory scaffolding |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Target Project Structure

```
src/
├── components/
│   ├── ProfileWizard.jsx     # Lines 1524-2440
│   ├── LoginScreen.jsx       # Lines 2444-2553
│   ├── Sidebar.jsx           # Lines 2557-2854
│   ├── DashboardView.jsx     # Lines 2858-3543
│   ├── RequirementsView.jsx  # Lines 3547-3677
│   ├── QuarterPlannerView.jsx # Lines 3681-3834
│   ├── WhatIfView.jsx        # Lines 3838-4046
│   ├── RoadmapView.jsx       # Lines 4052-4513
│   ├── CourseBrowserView.jsx # Lines 4514-4807
│   ├── LoadingScreen.jsx     # Lines 4811-4834
│   └── shared/
│       ├── StatusBadge.jsx   # Lines 1316-1339
│       ├── DifficultyBadge.jsx # Lines 1340-1364
│       └── ProgressRing.jsx  # Lines 1365-1407
├── hooks/
│   ├── useDatabase.js        # Already exists (Supabase hooks)
│   ├── useDeptCourses.js     # Lines 1226-1252 (extract from CompassDemo)
│   └── useMajorRequirements.js # Lines 1253-1301 (extract from CompassDemo)
├── utils/
│   ├── ucsbApi.js            # Already exists
│   ├── courseUtils.js        # extractCourseId (line 1146), buildKnownCourses (line 1076)
│   └── requirementsUtils.js  # buildUserRequirements (1151), buildUserQuarterPlan (1180)
├── data/
│   ├── demo/
│   │   ├── majors.json       # Already exists (589 lines, 12 majors) — extend to include defaultQuarterPlan + prereqEdges
│   │   └── catalogDescriptions.js # Lazy singleton wrapping courses-with-prereqs.json lookup
│   └── datasets/
│       └── courses-with-prereqs.json # Already exists (22,694 lines)
├── styles/
│   └── theme.js              # Lines 1121-1140 (UCSB color theme object)
├── hooks/
│   └── useDatabase.js        # Already exists
├── lib/
│   └── supabase.js           # Already exists
└── main.jsx                  # Already exists — no changes needed
CompassDemo.jsx               # Becomes thin composition root (~150 lines)
```

### Pattern 1: Thin Composition Root
**What:** CompassDemo.jsx retains only: imports, state declarations (`useState`/`useEffect`/`useMemo`), event handlers, and the `renderView()` switch + JSX return. All component definitions are imported.
**When to use:** Any time a file is both the entry point and contains implementation — the entry point should only orchestrate.
**Example:**
```jsx
// CompassDemo.jsx after refactor — ~150 lines
import { DashboardView } from './src/components/DashboardView';
import { RoadmapView } from './src/components/RoadmapView';
import { MAJOR_CONFIGS } from './src/data/demo/majorConfigs';
import { getMajorId } from './src/utils/courseUtils';
// ... etc.

export default function CompassDemo() {
  const [activeView, setActiveView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  // ... all state
  // ... all handlers
  return (...renderView()...);
}
```

### Pattern 2: Named Exports for All Extracted Modules
**What:** Every extracted file uses named exports, not default exports (except view components which may use either). This keeps imports explicit and refactor-friendly.
**When to use:** Utilities, hooks, data modules.
**Example:**
```js
// src/utils/courseUtils.js
export function extractCourseId(courseString) { ... }
export function buildKnownCourses(requirements, quarterPlan) { ... }
```

### Pattern 3: structuredClone for Deep Copies
**What:** Replace all `JSON.parse(JSON.stringify(x))` calls with `structuredClone(x)`.
**When to use:** Whenever a full deep copy is needed before mutation.
**Example:**
```js
// Before (5 occurrences in handlers):
const updated = JSON.parse(JSON.stringify(currentUser));

// After:
const updated = structuredClone(currentUser);
```
**Note:** `structuredClone` is supported in all modern browsers and Node 17+. Vite 5 targets modern browsers by default. No polyfill needed. It handles dates, arrays, and nested objects correctly — unlike JSON.parse/stringify which drops undefined values and cannot handle Date objects.

### Pattern 4: Lazy Singleton for catalogDescriptions
**What:** The `catalogDescriptions` object (built from a 22,694-line JSON file) is currently rebuilt on every module load at the top of CompassDemo.jsx. Extract it to a module that builds the lookup map once.
**When to use:** Any expensive computation at module init that doesn't change at runtime.
**Example:**
```js
// src/data/demo/catalogDescriptions.js
import courseCatalog from '../datasets/courses-with-prereqs.json';

let _cache = null;
export function getCatalogDescriptions() {
  if (_cache) return _cache;
  _cache = {};
  for (const c of courseCatalog) {
    if (c.courseIdClean && c.description) {
      _cache[c.courseIdClean] = c.description.replace(/\s{2,}/g, ' ').trim();
    }
  }
  return _cache;
}
```
Or simply as a module-level const in its own file (module caching handles singleton behavior automatically in ES modules).

### Pattern 5: MAJOR_CONFIGS Reconciliation
**What:** `MAJOR_CONFIGS` in CompassDemo.jsx and `src/data/demo/majors.json` have different schemas. The JSON file uses `sections` as the key for requirement categories; the inline object uses direct keys (`preMajor`, `preparationForMajor`, etc.). The JSON also lacks `defaultQuarterPlan` and `prereqEdges`.
**Decision:** Extend majors.json to include `defaultQuarterPlan` and `prereqEdges` for each major, and update the schema to match what the components expect — OR create a `majorConfigs.js` module that imports majors.json and transforms it to the runtime shape. The second approach is less risky because it doesn't require updating a 589-line JSON file that may be used by other tooling.
**When to use:** When two data sources for the same concept have diverged.
**Example:**
```js
// src/data/demo/majorConfigs.js
import MAJORS_DATA from './majors.json';

// Inline the defaultQuarterPlan and prereqEdges that the JSON doesn't have
const QUARTER_PLANS = { econ_ba: [...], cs_bs: [...], ... };
const PREREQ_EDGES  = { econ_ba: [...], cs_bs: [...], ... };

export const MAJOR_CONFIGS = Object.fromEntries(
  Object.entries(MAJORS_DATA).filter(([k]) => k !== '_meta').map(([id, data]) => [
    id,
    {
      name: data.name,
      browseDeptCodes: data.browseDeptCodes,
      requirements: transformSections(data.sections),
      prereqEdges: PREREQ_EDGES[id] ?? [],
      defaultQuarterPlan: QUARTER_PLANS[id] ?? [],
    }
  ])
);
```

### Anti-Patterns to Avoid
- **Barrel re-exports (index.js files):** Adds indirection without benefit for a project this size. Import directly from source files.
- **Moving handlers into view components:** The handlers (`handleAddCourse`, `handleRemoveCourse`, etc.) must stay in CompassDemo because they call `setCurrentUser` which lives at the root. Do not push them into DashboardView.
- **Splitting before extracting utilities:** If you extract DashboardView before extracting `extractCourseId` and `buildKnownCourses`, the view file will have unresolved imports. Extract utils first.
- **Changing props interfaces during refactor:** This is a structural refactor only. Component props must remain identical to pre-refactor to avoid regressions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deep object copy | Custom recursive clone | `structuredClone()` (native) | Handles edge cases (Date, typed arrays, circular references) |
| ES module caching | Custom singleton pattern | Native ES module caching | Modules are cached by the runtime after first import — a module-level `const` is automatically a singleton |

**Key insight:** The biggest risk in this refactor is circular imports. If `courseUtils.js` imports from `majorConfigs.js` and `majorConfigs.js` imports from `courseUtils.js`, Vite will error at build time. The extraction order must respect the dependency graph (see Common Pitfalls).

---

## Common Pitfalls

### Pitfall 1: Circular Import Chains
**What goes wrong:** Two extracted modules import from each other, causing Vite to throw "circular dependency" warnings or runtime errors where an import is `undefined`.
**Why it happens:** In a monolith, functions call each other freely. When split into files, the import graph must be a DAG.
**How to avoid:** Extract in dependency order:
1. `theme.js` (no dependencies)
2. `courseUtils.js` (`extractCourseId`, `buildKnownCourses` — no local dependencies)
3. `requirementsUtils.js` (`buildUserRequirements`, `buildUserQuarterPlan` — depends on `extractCourseId`)
4. `majorConfigs.js` (depends on `majors.json` only)
5. `catalogDescriptions.js` (depends on `courses-with-prereqs.json` only)
6. Hooks (`useDeptCourses`, `useMajorRequirements` — depend on utils and supabase)
7. Shared components (`StatusBadge`, `DifficultyBadge`, `ProgressRing` — depend on theme)
8. View components (depend on shared components, utils, hooks, theme)
9. CompassDemo.jsx cleanup (depends on everything above)
**Warning signs:** TypeScript/JS console showing "Cannot access X before initialization" or Vite circular dependency warning.

### Pitfall 2: MAJOR_CONFIGS Schema Mismatch
**What goes wrong:** `majors.json` uses `sections` as the key for requirements; runtime code and component props expect the flat key structure (`preMajor`, `preparationForMajor`, etc.). Naively importing the JSON breaks requirement rendering.
**Why it happens:** The JSON was created as a richer data format than what the inline object uses.
**How to avoid:** Use a `majorConfigs.js` transform layer (see Pattern 5 above). Do not directly swap MAJOR_CONFIGS with the raw JSON import without a transform.
**Warning signs:** RequirementsView renders empty or throws "Cannot read properties of undefined (reading 'courses')".

### Pitfall 3: Missing `theme` Reference in Extracted Components
**What goes wrong:** Every view component references the module-level `theme` constant. After extraction, `theme` is no longer in scope.
**Why it happens:** Module-level globals become undefined when a component is moved to a new file without updating the import.
**How to avoid:** Extract `theme` to `src/styles/theme.js` first, then add `import { theme } from '../styles/theme'` to every view component file.
**Warning signs:** Runtime error "theme is not defined" or blank UI with no visible error (if theme is accessed in style objects, React will silently render nothing for that element).

### Pitfall 4: buildUserRequirements Uses JSON.parse/stringify Internally
**What goes wrong:** `buildUserRequirements` (line 1164) itself uses `JSON.parse(JSON.stringify(baseRequirements))` internally — not just the handlers. This call is inside a pure utility function, not a state handler.
**Why it happens:** The same deep-copy anti-pattern exists in utility functions, not only event handlers.
**How to avoid:** When extracting to `requirementsUtils.js`, replace the internal clone with `structuredClone` at the same time.
**Warning signs:** None immediately — but it's wasteful and fragile for the same reasons as the handler copies.

### Pitfall 5: src/main.jsx Import Must Not Break
**What goes wrong:** `src/main.jsx` imports `CompassDemo` as `import CompassDemo from '../CompassDemo.jsx'` (or similar relative path from src/). If CompassDemo.jsx is moved or its default export is removed, the app breaks at startup.
**Why it happens:** The file is the entry point.
**How to avoid:** Keep `CompassDemo.jsx` at the root level and keep its `export default function CompassDemo()` intact. The refactor only changes what's inside the function and what's imported at the top.
**Warning signs:** Blank page with "Failed to resolve import" in browser console.

### Pitfall 6: `getMajorId` Function Uses User Object Shape
**What goes wrong:** `getMajorId` (line 1302) reads `user.major?.id ?? user.major` to map user object to a MAJOR_CONFIGS key. This logic depends on the user object shape from the server. If the function is extracted without its context, the shape assumptions are invisible to future maintainers.
**Why it happens:** Business logic embedded near data definitions.
**How to avoid:** Extract `getMajorId` to `courseUtils.js` with a JSDoc comment documenting the expected user shape.

---

## Code Examples

### Replacing JSON.parse/stringify (5 Sites)
```js
// src/utils/requirementsUtils.js — internal to buildUserRequirements
// Before:
const updated = JSON.parse(JSON.stringify(baseRequirements));

// After:
const updated = structuredClone(baseRequirements);
```

```js
// CompassDemo.jsx handlers — handleAddCourse, handleRemoveCourse,
// handleEditCourseGrade, handleMarkComplete, handleAddInProgress
// Before (repeated 5 times):
const updated = JSON.parse(JSON.stringify(currentUser));

// After:
const updated = structuredClone(currentUser);
```

### Named Export Pattern for Utilities
```js
// src/utils/courseUtils.js
export function extractCourseId(courseString) {
  if (!courseString) return '';
  const match = courseString.match(/^([A-Z]+)\s*(\d+[A-Z]?)$/i);
  if (match) return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
  return courseString.trim().toUpperCase();
}

export function buildKnownCourses(requirements, quarterPlan) {
  // ... unchanged implementation
}

export function getMajorId(user) {
  // ... unchanged implementation
}
```

### Theme Module
```js
// src/styles/theme.js
export const theme = {
  colors: {
    primary: '#003660',    // UCSB Navy
    secondary: '#FEBC11',  // UCSB Gold
    // ...
  },
  // ...
};
```

### Vite Handles JSON Imports Natively
```js
// No configuration needed — Vite 5 resolves JSON imports out of the box
import MAJORS_DATA from './majors.json';  // returns JS object
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse/stringify for deep copy | structuredClone() | Node 17 (2021), baseline browsers 2022 | No runtime deps, handles more types |
| Everything in one file | Feature/domain folders | Ongoing React ecosystem norm | Findability, testability, reuse |
| Global theme objects | CSS-in-JS or CSS modules | Gradual (2019-present) | For this phase, keep inline style objects — Phase 2 will introduce the frontend-design skill |

**Deprecated/outdated:**
- `JSON.parse(JSON.stringify())` for cloning: Works but is an antipattern — loses Date objects, undefined values, functions; slower than structuredClone.

---

## Open Questions

1. **MAJOR_CONFIGS vs majors.json unification**
   - What we know: The JSON file is richer (has `prereqText`, `prereqs` arrays per course) but lacks `defaultQuarterPlan` and `prereqEdges`. The inline MAJOR_CONFIGS has `defaultQuarterPlan` and `prereqEdges` but fewer per-course fields.
   - What's unclear: Whether `defaultQuarterPlan` and `prereqEdges` should be added to majors.json or kept in a separate JS module.
   - Recommendation: Keep them in a `majorConfigs.js` module that transforms the JSON — this avoids making the JSON file serve too many masters and keeps it as a data source rather than a config source.

2. **Test infrastructure for verification**
   - What we know: The `tests/` directory exists but has no active test files. REQUIREMENTS.md explicitly defers a full test suite.
   - What's unclear: Whether any extraction-level smoke tests should be added in this phase.
   - Recommendation: No new tests in this phase per requirements. Verification is done by running `npm run dev` and manually confirming all views render correctly. This is acceptable given REQUIREMENTS.md's "Full test suite: Out of Scope" decision.

3. **RequirementsView and QuarterPlannerView as sub-views of RoadmapView**
   - What we know: The component map shows RequirementsView (lines 3547-3677) and QuarterPlannerView (lines 3681-3834) are rendered inside RoadmapView as tabs/sections.
   - What's unclear: Whether they warrant separate files or should be colocated in RoadmapView.jsx.
   - Recommendation: Extract as separate files — they are substantial (130 and 153 lines respectively) and the planner should be able to open them independently per ROADMAP success criteria.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed — no test runner detected in package.json or tests/ |
| Config file | None |
| Quick run command | `npm run dev` (manual smoke test — start dev server, verify all views load) |
| Full suite command | `npm run build` (Vite build catches import errors and missing modules) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REFACTOR-01 | All views render correctly after extraction | smoke | `npm run build` (catches import errors) | ✅ (build script) |
| REFACTOR-02 | Mock data loads from external modules | smoke | `npm run build` | ✅ (build script) |
| REFACTOR-03 | No JSON.parse/stringify in handlers | manual/grep | `grep -n "JSON.parse(JSON.stringify" src/ CompassDemo.jsx` | N/A (grep) |

### Sampling Rate
- **Per task commit:** `npm run build` — catches broken imports immediately
- **Per wave merge:** `npm run dev` — manual verification that all 4 views and the wizard render correctly
- **Phase gate:** `npm run build` green + manual smoke test of all views before marking phase complete

### Wave 0 Gaps
None — no test framework installation required. Build verification via `npm run build` is sufficient for a structural refactor with no behavioral changes.

---

## Component Line Map (for Planner Reference)

This table maps each component to its exact location in CompassDemo.jsx so planners can scope individual extraction tasks precisely.

| Component/Module | Lines | Size | Dependencies |
|-----------------|-------|------|-------------|
| `catalogDescriptions` build | 7-13 | 7 | courses-with-prereqs.json |
| `MAJOR_CONFIGS` inline | 18-1075 | 1,057 | (data only) |
| `buildKnownCourses` | 1076-1116 | 41 | none |
| `theme` | 1121-1140 | 20 | none |
| `extractCourseId` | 1146-1149 | 4 | none |
| `buildUserRequirements` | 1151-1178 | 28 | extractCourseId |
| `buildUserQuarterPlan` | 1180-1223 | 44 | extractCourseId |
| `useDeptCourses` hook | 1226-1252 | 27 | supabase |
| `useMajorRequirements` hook | 1253-1301 | 49 | supabase, MAJOR_CONFIGS |
| `getMajorId` | 1302-1308 | 7 | none |
| `StatusBadge` | 1316-1339 | 24 | theme |
| `DifficultyBadge` | 1340-1364 | 25 | theme |
| `ProgressRing` | 1365-1407 | 43 | theme |
| `SearchableSelect` | 1411-1514 | 104 | theme |
| `ProfileWizard` | 1524-2440 | 917 | theme, MAJOR_CONFIGS, supabase, useDeptCourses |
| `LoginScreen` | 2444-2553 | 110 | theme |
| `Sidebar` | 2557-2854 | 298 | theme |
| `DashboardView` | 2858-3543 | 686 | theme, StatusBadge, DifficultyBadge, extractCourseId, buildKnownCourses |
| `RequirementsView` | 3547-3677 | 131 | theme, StatusBadge, DifficultyBadge, ProgressRing |
| `QuarterPlannerView` | 3681-3834 | 154 | theme, DifficultyBadge |
| `WhatIfView` | 3838-4046 | 209 | theme, MAJOR_CONFIGS, buildUserRequirements, StatusBadge, ProgressRing |
| `RoadmapView` | 4052-4513 | 462 | theme, RequirementsView, QuarterPlannerView, StatusBadge, DifficultyBadge, ProgressRing |
| `CourseBrowserView` | 4514-4807 | 294 | theme, useDeptCourses, catalogDescriptions, DifficultyBadge, StatusBadge |
| `LoadingScreen` | 4811-4834 | 24 | theme |
| `CompassDemo` (root) | 4838-5086 | 249 | everything above |

**Extraction wave order** (respects dependency graph):
1. Wave 1 — Leaf modules: `theme.js`, `courseUtils.js` (extractCourseId, buildKnownCourses, getMajorId), `requirementsUtils.js` (buildUserRequirements, buildUserQuarterPlan), `majorConfigs.js` (MAJOR_CONFIGS), `catalogDescriptions.js`
2. Wave 2 — Hooks: `useDeptCourses.js`, `useMajorRequirements.js`
3. Wave 3 — Shared components: `StatusBadge.jsx`, `DifficultyBadge.jsx`, `ProgressRing.jsx`, `SearchableSelect.jsx`
4. Wave 4 — View components: `ProfileWizard.jsx`, `LoginScreen.jsx`, `Sidebar.jsx`, `DashboardView.jsx`, `RequirementsView.jsx`, `QuarterPlannerView.jsx`, `WhatIfView.jsx`, `RoadmapView.jsx`, `CourseBrowserView.jsx`, `LoadingScreen.jsx`
5. Wave 5 — Root cleanup: Trim CompassDemo.jsx to composition root only; apply structuredClone replacements

---

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of `CompassDemo.jsx` (5,086 lines) — line ranges, dependency graph, clone sites
- `src/data/demo/majors.json` — schema comparison with inline MAJOR_CONFIGS
- `package.json` — confirmed no test runner, React 18.2, Vite 5
- `.planning/codebase/CONCERNS.md` — confirmed 5 clone sites (lines 3825-3922), performance issue with catalogDescriptions
- `.planning/codebase/STRUCTURE.md` — directory scaffold confirming `src/components/` exists but is empty

### Secondary (MEDIUM confidence)
- MDN Web Docs — structuredClone browser support (baseline 2022, all modern browsers)
- Vite 5 documentation — JSON import support is native, no plugin needed

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and source analysis
- Architecture: HIGH — component boundaries identified from direct line-range analysis
- Pitfalls: HIGH — all pitfalls derived from direct code inspection, not speculation

**Research date:** 2026-03-05
**Valid until:** 2026-06-05 (stable libraries, no external API dependencies)
