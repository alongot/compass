# Phase 4: CC Transfer Mode - Research

**Researched:** 2026-03-07
**Domain:** React component branching, IGETC data modeling, articulation data expansion, Supabase seeding
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Profile declaration**
- Separate wizard path — ProfileWizard shows a student type choice upfront (UCSB student vs CC transfer student) and branches into different steps
- Transfer wizard collects: name → CC (from our 10) + target UCSB major → completed CC courses + grades → current quarter CC courses
- Course input uses the same autocomplete as the UCSB wizard, with suggestions sourced from that CC's articulation data; manual entry of any code is still allowed
- No "intended transfer year" field in this phase

**Transfer dashboard**
- Three progress cards at the top: (1) Units toward 60 transfer minimum, (2) IGETC % complete by area, (3) % of target major's lower-division requirements satisfied via articulation
- IGETC card shows per-area rows: 1A (English Composition), 1B (Critical Thinking), 2 (Math), 3A (Arts), 3B (Humanities), 4 (Social Science), 5A (Physical Science), 5B (Biological Science), 5C (Lab), 6 (Languages)
- Current quarter section retained with same add/remove/edit interaction; in-progress CC courses count toward unit total and IGETC projections
- Educational history section retained

**CC transfer roadmap**
- Requirements checklist with three sections: (1) IGETC areas with status + satisfying CC course, (2) Target major lower-division requirements with transfer status + satisfying CC course, (3) Unit count toward 60
- Both satisfied and unsatisfied requirements shown
- No semester planner grid in this phase
- Existing TransferView nav item and component removed — the CC roadmap replaces it

**What-If for transfer students**
- Same WhatIfView component, mode-aware: detects student_type and renders appropriate comparison
- UCSB students: existing major-switch analysis unchanged
- Transfer students: all 12 demo majors shown as cards, current target major highlighted, others ranked by % lower-div requirements satisfied
- Each card shows: % of that major's lower-div reqs satisfied, unit gap to 60, IGETC delta (typically 0)
- No manual major selection required — all 12 shown automatically

**Articulation data expansion**
- Expand from 3 CCs (SBCC, SMC, De Anza) to all 10 CCs × all 12 majors
- Same JSON structure as existing CC agreement files
- IGETC area mappings authored per CC as a separate data file per CC
- Extend import-articulations.js to handle all 10 files

### Claude's Discretion
- Exact styling of the three transfer dashboard cards (layout, sizing, color treatment)
- How to handle CCs with no articulation data for a given major (show "no data available" gracefully)
- Whether IGETC area 6 (Languages Other Than English) is included
- Order/sort of requirement rows within each section

### Deferred Ideas (OUT OF SCOPE)
- Transfer year countdown / "days until UC transfer deadline"
- CC GPA calculation and transfer eligibility warning (UC requires 2.4 min GPA)
- Planned future CC courses / semester planner grid
- Assist.org API integration for real-time articulation data
- Transfer admission statistics (acceptance rates by major from CC)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CC-01 | CC student profile type — user can declare `student_type: 'transfer'` during onboarding, select their source CC and target UCSB major; profile wizard branches accordingly | ProfileWizard branching pattern documented; user schema extension identified |
| CC-02 | Full articulation data in Supabase for all 10 CCs × 12 majors (expands on TRANSFER-01 which covered 3 CCs) | Data file structure, import script extension point, and CC list all confirmed |
| CC-03 | IGETC tracking — GE area definitions stored, CC courses mapped to IGETC areas, % completion per area calculated | IGETC area list locked; new data file pattern identified; pure-function calculation approach documented |
| CC-04 | CC-specific dashboard — unit progress toward 60 + IGETC % by area; replaces major requirement checklist for transfer students | DashboardView props/pattern confirmed; student_type branch approach documented |
| CC-05 | CC-specific roadmap — course timeline toward transfer eligibility; replaces UCSB major requirements map for transfer students | RoadmapView extension point confirmed; checklist rendering approach documented |
| CC-06 | CC-specific What-If — "given my CC courses, what would transfer progress look like under a different target UCSB major?" | WhatIfView extension point confirmed; all-12-majors card approach documented |
</phase_requirements>

---

## Summary

Phase 4 builds on the Phase 3 infrastructure (useArticulations, mapCcCoursesToUcsbRequirements, TransferView, three CC agreement JSON files, import-articulations.js) to deliver a complete CC transfer student experience. The core architectural pattern is `student_type` branching: every main view receives the `user` prop and renders a transfer-specific subtree when `user.student_type === 'transfer'`. No new routing or structural changes to CompassDemo.jsx are required.

The two genuinely new data concerns are (1) expanding articulation agreement JSON from 3 to 10 CCs — a mechanical authoring task using the established file format — and (2) authoring IGETC area mapping files (one per CC) that record which CC courses satisfy each IGETC area. The IGETC computation itself is a pure function (similar to mapCcCoursesToUcsbRequirements) that can be written and tested independently. The import-articulations.js script already has all 10 CCs in its lookup table and loads all files from the agreements/ directory, so the script requires no logic changes — only new data files.

The ProfileWizard is the most surgical change: step 1 adds a student-type radio/toggle, and the "transfer" branch follows a parallel 4-step path that swaps school+major (step 2 UCSB) for CC+target-major (step 2 transfer). The UCSB path is entirely unchanged. All three main views (Dashboard, Roadmap, WhatIf) detect student_type from the user prop and render the appropriate subtree, keeping the existing UCSB experience untouched.

**Primary recommendation:** Use `student_type` conditional rendering inside existing view components (not new top-level route files). Build IGETC calculation as a pure utility function in transferUtils.js. Author all 10 CC JSON data files before wiring UI.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x (existing) | Component branching, state | Already in use |
| Supabase JS | 2.x (existing) | DB reads for articulations/institutions | Already wired; useArticulations hook exists |
| Vitest + @testing-library/react | existing | Unit and component tests | Already configured in vitest.config.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React useMemo | built-in | Memoize IGETC calculation, satisfied requirements | Whenever derived data is computed from multiple user state props |

### No New Dependencies Required

All capabilities needed for Phase 4 (conditional rendering, Supabase data reads, pure calculations) are covered by the existing stack. Do not introduce new libraries.

**Installation:**
```bash
# No new packages — use existing stack
```

---

## Architecture Patterns

### student_type Branching Pattern

Every view receives `user` as a prop. The branch is:

```jsx
// Source: existing pattern in DashboardView.jsx, WhatIfView.jsx
if (user?.student_type === 'transfer') {
  return <TransferDashboard user={user} articulations={articulations} ... />;
}
// else: existing UCSB dashboard
return <UcsbDashboard ... />;
```

The transfer subtree can be a subcomponent defined in the same file or a separate file imported at the top of the view file. Keep the UCSB render path completely unchanged — no refactoring of the UCSB branch is in scope.

### IGETC Data Model

IGETC area definitions are static (same for all CCs and all UCSB majors). Author them once as a constant:

```js
// src/data/igetcAreas.js
export const IGETC_AREAS = [
  { id: '1A', label: 'English Composition' },
  { id: '1B', label: 'Critical Thinking — English Composition' },
  { id: '2',  label: 'Mathematical Concepts and Quantitative Reasoning' },
  { id: '3A', label: 'Arts' },
  { id: '3B', label: 'Humanities' },
  { id: '4',  label: 'Social and Behavioral Sciences' },
  { id: '5A', label: 'Physical Sciences' },
  { id: '5B', label: 'Biological Sciences' },
  { id: '5C', label: 'Laboratory Activity' },
  { id: '6',  label: 'Languages Other Than English' },
];
```

CC-to-IGETC mappings live in a per-CC JSON file:

```json
// src/data/articulations/igetc/sbcc-igetc.json
[
  { "source_course_code": "ENG 110", "igetc_area": "1A" },
  { "source_course_code": "ENG 120", "igetc_area": "1B" },
  { "source_course_code": "MATH 150", "igetc_area": "2" },
  ...
]
```

### IGETC Calculation (Pure Function)

```js
// src/utils/transferUtils.js — add alongside mapCcCoursesToUcsbRequirements
// Source: pattern matches existing mapCcCoursesToUcsbRequirements
export function calculateIgetcProgress(completedCcCourses, igetcMappings) {
  // completedCcCourses: string[] of source_course_code
  // igetcMappings: [{ source_course_code, igetc_area }]
  // returns: Map<areaId, boolean> — true if area satisfied
  const satisfiedAreas = new Set();
  const completedSet = new Set(completedCcCourses);
  for (const mapping of igetcMappings) {
    if (completedSet.has(mapping.source_course_code)) {
      satisfiedAreas.add(mapping.igetc_area);
    }
  }
  return satisfiedAreas; // caller checks IGETC_AREAS[i].id against this Set
}
```

### User Schema Extension

Add fields to user objects stored in data/users.json (no server.js changes needed — existing PUT /api/users/:id passes through arbitrary fields):

```json
{
  "student_type": "transfer",
  "source_institution_id": "<uuid from institutions table>",
  "target_major_id": "cs_bs"
}
```

`source_institution_id` is the UUID from the Supabase institutions table. This UUID is resolved at profile creation time by the ProfileWizard fetching institutions from useInstitutions().

### ProfileWizard Branching

Step 1 becomes the student-type choice. The subsequent steps differ:

| Step | UCSB Path | Transfer Path |
|------|-----------|---------------|
| 1 | Name | Name |
| 2 | School (UCSB) + UCSB Major | CC (from 10) + Target UCSB major |
| 3 | Completed courses (UCSB autocomplete) | Completed CC courses (CC articulation autocomplete) |
| 4 | Current quarter (UCSB autocomplete) | Current quarter CC courses |

The step number state machine stays the same (1-4). Only the JSX rendered at step 2-4 differs by student type. Both paths call the same `onComplete` callback with the user object.

The transfer path autocomplete at step 3 sources suggestions from the CC's articulation data (loaded via useArticulations with the selected CC's UUID). This avoids adding a new Supabase table — articulation rows already have `source_course_code` and `source_course_title`.

### Articulation Data File Expansion

Files needed (7 new, 3 already exist):

```
src/data/articulations/agreements/
  sbcc-ucsb.json      ✅ exists
  smc-ucsb.json       ✅ exists
  de-anza-ucsb.json   ✅ exists
  occ-ucsb.json       ❌ author
  dvc-ucsb.json       ❌ author
  foothill-ucsb.json  ❌ author
  pcc-ucsb.json       ❌ author
  ivc-ucsb.json       ❌ author
  csm-ucsb.json       ❌ author
  laney-ucsb.json     ❌ author

src/data/articulations/igetc/
  sbcc-igetc.json     ❌ author (new directory)
  smc-igetc.json      ❌ author
  de-anza-igetc.json  ❌ author
  occ-igetc.json      ❌ author
  dvc-igetc.json      ❌ author
  foothill-igetc.json ❌ author
  pcc-igetc.json      ❌ author
  ivc-igetc.json      ❌ author
  csm-igetc.json      ❌ author
  laney-igetc.json    ❌ author
```

The import-articulations.js script already has FILENAME_TO_ASSIST_ORG_ID entries for all 10 CCs and uses `readdirSync` to load all files from the agreements/ directory. No script changes needed for agreement files — only the 7 new JSON files need to be authored.

A new `importIgetcMappings()` step should be added to import-articulations.js to seed a new `igetc_mappings` table OR the mappings can remain frontend-only (JSON import, no Supabase). See Pitfall 2 below.

### CC Roadmap — Checklist Structure

```jsx
// Three sections rendered as collapsible or stacked panels
<IgetcChecklist
  areas={IGETC_AREAS}
  satisfiedAreas={satisfiedAreas}          // Set from calculateIgetcProgress
  igetcMappings={igetcMappings}            // loaded from JSON file per CC
  completedCcCourses={completedCcCourses}
/>
<MajorLowerDivChecklist
  requirements={MAJOR_CONFIGS[targetMajorId].sections}
  articulations={articulations}            // from useArticulations
  completedCcCourses={completedCcCourses}
/>
<UnitSummary
  completedUnits={completedUnits}
  inProgressUnits={inProgressUnits}
  target={60}
/>
```

### What-If Transfer Mode

```jsx
// Inside WhatIfView
if (user?.student_type === 'transfer') {
  return (
    <TransferWhatIf
      user={user}
      articulations={articulations}          // from useArticulations(user.source_institution_id)
      completedCcCourses={completedCcCourses}
    />
  );
}
```

TransferWhatIf renders all 12 MAJOR_CONFIGS as cards. For each major, it calls mapCcCoursesToUcsbRequirements scoped to that major's lower-division requirements and computes % satisfied. Cards sorted by % descending, current target major highlighted with a badge.

### Recommended File Structure (new files only)

```
src/
├── data/
│   ├── igetcAreas.js                  # IGETC_AREAS constant
│   └── articulations/
│       ├── igetc/                     # 10 × CC igetc mapping files
│       │   └── sbcc-igetc.json
│       └── agreements/                # 7 new CC agreement files
├── utils/
│   └── transferUtils.js               # add calculateIgetcProgress()
├── hooks/
│   └── useIgetcMappings.js            # loads igetc JSON for selected CC
└── components/
    ├── TransferDashboardView.jsx      # transfer branch of DashboardView
    ├── TransferRoadmapView.jsx        # transfer branch of RoadmapView
    └── TransferWhatIfView.jsx         # transfer branch of WhatIfView
```

The three Transfer*View files are subcomponents rendered inside their parent views when student_type === 'transfer'. This keeps the branch localized without creating new navigation entries.

### Anti-Patterns to Avoid

- **Creating a new top-level route/view for transfer:** The decision locks the existing Dashboard, Roadmap, and WhatIf as the navigation items — transfer students use the same nav items, which detect student_type internally.
- **Modifying the UCSB branch of any view:** Zero changes to UCSB code paths. All new code is additive.
- **Raw hex colors in new components:** theme-usage.test.js scans all component files and fails the test suite on any raw hex. Use `theme.colors.*` exclusively.
- **Hardcoding institution names or IDs:** All CC references should use the UUID from the institutions Supabase table (resolved at profile creation time via useInstitutions). Never hardcode UUIDs in component code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CC-to-UCSB course mapping | Custom mapper | `mapCcCoursesToUcsbRequirements` (transferUtils.js) | Already written, tested, and handles the equivalent-only filter |
| Institution list fetch | useState + fetch | `useInstitutions()` (useArticulations.js) | Already wired to Supabase, handles loading/error states |
| Articulation data fetch | useState + fetch | `useArticulations(institutionId)` | Same hook, already handles null institutionId gracefully |
| CC course autocomplete suggestions | Custom filter | Pattern from ProfileWizard step 4 (wizardKnown-based) | The same showSuggestions/filteredSuggestions/suggestionIndex state machine already exists; replicate, don't invent |
| UCSB major requirements | DB queries | `MAJOR_CONFIGS` from majorConfigs.js | All 12 majors already populated with lower-div and upper-div requirements |
| Supabase articulation seeding | Manual SQL | `import-articulations.js` | Script already handles idempotent institution + articulation inserts for all 10 CCs |

**Key insight:** The data infrastructure (Supabase schema, import scripts, hooks, mapping utility) is fully built. Phase 4 is primarily UI composition and data file authoring, not infrastructure work.

---

## Common Pitfalls

### Pitfall 1: Modifying UCSB Code Paths
**What goes wrong:** While adding transfer branching, a developer edits the shared props or rendering logic of the UCSB branch, breaking UCSB student behavior.
**Why it happens:** The existing components (DashboardView, RoadmapView, WhatIfView) pass many props; adding transfer-specific props tempts refactoring.
**How to avoid:** The transfer branch reads only `user`, `articulations` (new hook call), and `MAJOR_CONFIGS`. All existing props stay unchanged and flow unchanged to the UCSB branch. The transfer branch is an early-return at the top of the render function.
**Warning signs:** Any change to the function signature that removes or renames existing props.

### Pitfall 2: IGETC Mappings — Supabase vs JSON Import
**What goes wrong:** A new `igetc_mappings` Supabase table is added, requiring a migration, RLS policy, and import step — adding unnecessary scope.
**Why it happens:** Consistency instinct — articulation data is in Supabase, so IGETC should be too.
**How to avoid:** IGETC mappings are static demo data (10 files, ~10-20 rows each). Load them as a direct ES module import in useIgetcMappings.js (no Supabase call). The hook returns the JSON directly based on the institution's short_name. This avoids a new DB table, migration, and import step.

```js
// src/hooks/useIgetcMappings.js
const IGETC_MAP = {
  'sbcc': () => import('../data/articulations/igetc/sbcc-igetc.json'),
  'smc':  () => import('../data/articulations/igetc/smc-igetc.json'),
  // ...
};
```
**Warning signs:** If a plan task adds a new Supabase table for IGETC data.

### Pitfall 3: Unit Counting Double-Counts
**What goes wrong:** The "units toward 60" counter includes both completed and in-progress courses but in-progress units are also included in completed when the student runs the wizard again.
**Why it happens:** The user object has `transcript.completed` and `transcript.in_progress` as separate arrays; naive sum of both double-counts.
**How to avoid:** Follow the pattern already in DashboardView.jsx: `completedUnits = transcript.completed.reduce(...)` and `inProgressUnits = transcript.in_progress.reduce(...)`. Display: completed + in-progress as projected, but clearly label "X completed + Y in progress = Z toward 60". Do not merge the arrays.

### Pitfall 4: theme-usage.test.js Catches Raw Hex in New Components
**What goes wrong:** New TransferDashboardView.jsx, TransferRoadmapView.jsx, or TransferWhatIfView.jsx use raw hex strings (e.g., `'#10b981'`), causing theme-usage.test.js to fail.
**Why it happens:** Copying styling from reference without checking the test constraint.
**How to avoid:** Use `theme.colors.success`, `theme.colors.primary`, etc. in all inline styles. The theme has full color coverage (see src/styles/theme.js — 40+ named color tokens). Check `theme-usage.test.js` — it scans all files under `src/components/` including subdirectories.
**Warning signs:** Any `'#` string literal in a component file.

### Pitfall 5: source_institution_id UUID is Unavailable at Render Time
**What goes wrong:** useArticulations is called in a view before the user's source_institution_id is available, causing a no-op empty return and the transfer UI to appear blank.
**Why it happens:** useArticulations already handles null gracefully (returns [] with loading=false) but the root cause — the user object not having the UUID — is not surfaced.
**How to avoid:** In the ProfileWizard transfer path, after the user selects their CC from the dropdown (populated by useInstitutions), store `institution.id` (the UUID) directly on the user object as `source_institution_id`. Confirm the saved user object has this field before navigating away from the wizard.

---

## Code Examples

### student_type Branch at View Root

```jsx
// Pattern for DashboardView.jsx, RoadmapView.jsx, WhatIfView.jsx
// Source: established project pattern — user prop flows from CompassDemo.jsx
export const DashboardView = ({ user, requirements, quarterPlan, ... }) => {
  const { articulations } = useArticulations(
    user?.student_type === 'transfer' ? user.source_institution_id : null
  );

  if (user?.student_type === 'transfer') {
    return (
      <TransferDashboardView
        user={user}
        articulations={articulations}
        // no other props needed
      />
    );
  }

  // Existing UCSB dashboard — unchanged
  return (
    <div>
      {/* all existing JSX unchanged */}
    </div>
  );
};
```

### IGETC Progress Card (Transfer Dashboard)

```jsx
// Source: pattern matches ProgressRing usage in existing DashboardView
const satisfiedAreas = useMemo(
  () => calculateIgetcProgress(completedCcCourses, igetcMappings),
  [completedCcCourses, igetcMappings]
);
const igetcPercent = Math.round((satisfiedAreas.size / IGETC_AREAS.length) * 100);

<div style={{ backgroundColor: 'white', borderRadius: theme.spacing[3], padding: theme.spacing[6] }}>
  <h3>IGETC Progress</h3>
  <ProgressRing percent={igetcPercent} size={80} />
  {IGETC_AREAS.map(area => (
    <div key={area.id} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
      <span style={{ color: satisfiedAreas.has(area.id) ? theme.colors.successActive : theme.colors.gray[400] }}>
        {satisfiedAreas.has(area.id) ? 'Done' : 'Pending'}
      </span>
      <span>{area.id} — {area.label}</span>
    </div>
  ))}
</div>
```

### ProfileWizard Step 1 Student-Type Choice

```jsx
// Inserted before first name field, or as the entire step 1
const [studentType, setStudentType] = useState(null); // 'ucsb' | 'transfer'

// Step 1: student type choice
if (step === 1 && !studentType) {
  return (
    <div>
      <h2>Welcome to Compass</h2>
      <p>What best describes you?</p>
      <button onClick={() => setStudentType('ucsb')}>UCSB Student</button>
      <button onClick={() => setStudentType('transfer')}>CC Transfer Student</button>
    </div>
  );
}
// Then step 1 continues with name input
```

### CC Agreement JSON Format (existing pattern to replicate)

```json
[
  {
    "source_course_code": "ENGL 101",
    "source_course_title": "Composition and Reading",
    "source_units": 3,
    "target_course_id_clean": "WRIT 2",
    "articulation_type": "equivalent",
    "notes": "Satisfies UCSB writing requirement",
    "effective_start_date": "2024-01-01",
    "effective_end_date": null
  }
]
```

All 7 new CC agreement files must follow this exact structure for import-articulations.js to process them without modification.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TransferView as standalone nav item | Removed; transfer functionality lives inside Dashboard/Roadmap/WhatIf via student_type branching | Phase 4 decision | Sidebar nav loses "Transfer Credits" item |
| 3 CC articulation files | 10 CC articulation files | Phase 4 (CC-02) | All 10 institutions in DEMO_ROADMAP.md now supported |
| No IGETC tracking | IGETC area progress tracked per CC | Phase 4 (CC-03) | Transfer students see GE completion |
| WhatIfView: UCSB-only major comparison | WhatIfView: mode-aware; transfer students see all 12 majors ranked by lower-div req satisfaction | Phase 4 (CC-06) | No behavior change for UCSB students |

---

## Open Questions

1. **IGETC area 6 (Languages Other Than English) inclusion**
   - What we know: Area 6 is often waived for UC transfer if satisfied by high school or major preparation; including it creates a "never completable" row for most STEM majors
   - What's unclear: Whether including it helps or hurts the demo experience
   - Recommendation: Include it in IGETC_AREAS but mark it with a note "(may be waived by exam or high school record)" — this reflects the authentic experience (user per CONTEXT.md) and lets the UI handle it gracefully. Claude's discretion applies.

2. **Sorting of unsatisfied requirement rows**
   - What we know: Context locks "both satisfied and unsatisfied shown"
   - What's unclear: Whether satisfied come first, unsatisfied come first, or alphabetical
   - Recommendation: Show satisfied first (positive reinforcement), then unsatisfied. Within each group, sort alphabetically by IGETC area ID. Claude's discretion applies.

3. **"No data available" for a major × CC combination with zero articulation rows**
   - What we know: Some CC × major combinations may genuinely have no lower-div articulation (e.g., a CC with no Film/Media courses for the film_ba major)
   - Recommendation: Show the major's lower-div requirements with all rows in "Not satisfied" state and a note "No articulation data on file for [CC] × [Major]. These courses may still be transferable — check with your counselor." Do not hide the section.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 1.x + @testing-library/react |
| Config file | `vitest.config.js` (root) |
| Quick run command | `npx vitest run --reporter=verbose src/components/__tests__/transferUtils.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CC-01 | ProfileWizard renders student type choice at step 1 | unit | `npx vitest run src/components/__tests__/ProfileWizard.test.jsx` | ❌ Wave 0 |
| CC-01 | Wizard with transfer path saves student_type, source_institution_id, target_major_id on user | unit | same | ❌ Wave 0 |
| CC-02 | import-articulations.js processes all 10 CC agreement files without error | manual smoke | `node scripts/import-articulations.js` | ✅ script exists |
| CC-03 | calculateIgetcProgress returns correct satisfied area Set | unit | `npx vitest run src/components/__tests__/transferUtils.test.js` | ✅ (add cases to existing file) |
| CC-04 | TransferDashboardView renders 3 cards for transfer student | unit | `npx vitest run src/components/__tests__/TransferDashboardView.test.jsx` | ❌ Wave 0 |
| CC-04 | DashboardView renders UCSB view for ucsb student_type | unit | existing DashboardView test (no regressions) | n/a |
| CC-05 | TransferRoadmapView renders IGETC checklist and major req sections | unit | `npx vitest run src/components/__tests__/TransferRoadmapView.test.jsx` | ❌ Wave 0 |
| CC-06 | TransferWhatIfView renders 12 major cards | unit | `npx vitest run src/components/__tests__/TransferWhatIfView.test.jsx` | ❌ Wave 0 |
| UI | No raw hex in new transfer components | static | `npm test` (theme-usage.test.js scans all component files) | ✅ existing test covers new files automatically |

### Sampling Rate
- **Per task commit:** `npm test` (full suite is fast — 7 test files, all unit/jsdom)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/ProfileWizard.test.jsx` — covers CC-01
- [ ] `src/components/__tests__/TransferDashboardView.test.jsx` — covers CC-04
- [ ] `src/components/__tests__/TransferRoadmapView.test.jsx` — covers CC-05
- [ ] `src/components/__tests__/TransferWhatIfView.test.jsx` — covers CC-06
- [ ] Add `calculateIgetcProgress` test cases to existing `transferUtils.test.js` — covers CC-03

---

## Sources

### Primary (HIGH confidence)
- Direct code read: `src/hooks/useArticulations.js` — confirmed hook API, null-safety behavior
- Direct code read: `src/utils/transferUtils.js` — confirmed mapCcCoursesToUcsbRequirements signature and behavior
- Direct code read: `src/components/ProfileWizard.jsx` — confirmed wizard step structure, autocomplete pattern
- Direct code read: `src/components/DashboardView.jsx` — confirmed props, unit calculation pattern
- Direct code read: `src/components/WhatIfView.jsx` — confirmed component structure for extension
- Direct code read: `src/components/RoadmapView.jsx` — confirmed stage-based structure and props
- Direct code read: `src/data/articulations/` — confirmed JSON format, 10 institutions in institutions.json, 3 existing agreement files
- Direct code read: `scripts/import-articulations.js` — confirmed all 10 CCs in FILENAME_TO_ASSIST_ORG_ID, readdirSync pattern
- Direct code read: `src/data/migrations/001_initial_schema.sql` — confirmed institutions and articulations table schema
- Direct code read: `src/styles/theme.js` — confirmed color token names for pitfall avoidance
- Direct code read: `src/components/__tests__/theme-usage.test.js` — confirmed test scans all components including subdirectories
- Direct code read: `src/data/demo/majorConfigs.js` + `src/data/demo/majors.json` — confirmed MAJOR_CONFIGS structure and 12 majors
- Direct code read: `.planning/phases/04-cc-transfer-mode/04-CONTEXT.md` — locked decisions and code context

### Secondary (MEDIUM confidence)
- IGETC area definitions: Standard UC Transfer curriculum, area IDs (1A, 1B, 2, 3A, 3B, 4, 5A, 5B, 5C, 6) are publicly documented and stable

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all from existing codebase
- Architecture: HIGH — branching pattern confirmed by direct code inspection; IGETC calculation follows established pure-function pattern
- Data file scope: HIGH — 10 CC list confirmed in institutions.json; agreement file format confirmed in 3 existing files; import script confirmed all-10-ready
- Pitfalls: HIGH — theme-usage.test.js confirmed by code read; null handling confirmed in useArticulations

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable framework, locked decisions)
