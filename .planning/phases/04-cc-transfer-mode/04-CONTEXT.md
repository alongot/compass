# Phase 4: CC Transfer Mode - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

A CC transfer student gets a tailored Compass experience: onboarding declares transfer intent, and all views adapt to show CC course progress toward UCSB transfer eligibility. This phase introduces a `student_type` flag that gates which version of Dashboard, Roadmap, and What-If a user sees. It also expands articulation data from 3 CCs to all 10 × 12 majors and adds IGETC area tracking. The existing standalone TransferView panel is removed — the CC Roadmap replaces it entirely.

UCSB students are unaffected: their existing Dashboard, Roadmap, and What-If remain unchanged.

</domain>

<decisions>
## Implementation Decisions

### Profile declaration
- Separate wizard path — ProfileWizard shows a student type choice upfront (UCSB student vs CC transfer student) and branches into different steps
- Transfer wizard collects: name → CC (from our 10) + target UCSB major → completed CC courses + grades → current quarter CC courses
- Course input uses the same autocomplete as the UCSB wizard, with suggestions sourced from that CC's articulation data; manual entry of any code is still allowed
- No "intended transfer year" field in this phase — not used by core views

### Transfer dashboard
- Three progress cards at the top: (1) Units toward 60 transfer minimum, (2) IGETC % complete by area, (3) % of target major's lower-division requirements satisfied via articulation
- IGETC card shows per-area rows with completion status — Area 1A (English Composition), Area 1B (Critical Thinking), Area 2 (Math), Area 3A (Arts), Area 3B (Humanities), Area 4 (Social Science), Area 5A (Physical Science), Area 5B (Biological Science), Area 5C (Lab), Area 6 (Languages) — student sees which areas are done vs outstanding
- Current quarter section retained — same add/remove/edit interaction as UCSB dashboard; in-progress CC courses count toward unit total and IGETC projections
- Educational history section retained (completed CC courses + grades)

### CC transfer roadmap
- Requirements checklist structure with three sections:
  1. IGETC areas — each area with status + which CC course satisfies it
  2. Target major lower-division requirements — each UCSB course with transfer status + which CC course covers it (e.g. "MATH 3A — Satisfied by MATH 150 (SBCC)" or "CMPSC 16 — Not satisfied — take CS 110 at SBCC")
  3. Unit count toward 60 (summary)
- Both satisfied and unsatisfied requirements shown — student sees what to take, not just what they've done
- No semester planner grid in this phase
- Existing TransferView nav item and component removed — the CC roadmap replaces it

### What-If for transfer students
- Same WhatIfView component, mode-aware: detects student_type and renders appropriate comparison
  - UCSB students: existing major-switch analysis (unchanged)
  - Transfer students: target-major comparison using their CC courses
- Transfer comparison shows all 12 demo majors pre-loaded as cards, current target major highlighted, others ranked by % lower-division requirements satisfied
- Each comparison card shows: % of that major's lower-div reqs satisfied, unit gap to 60, and IGETC delta (IGETC doesn't change by target major, so delta is typically 0 — note this in the UI)
- No manual major selection required — all 12 shown automatically

### Articulation data expansion
- Expand from 3 CCs (SBCC, SMC, De Anza) to all 10 CCs × all 12 majors
- Focus on gateway/lower-division courses relevant to each major's requirements
- Same JSON structure as existing CC agreement files — extend import-articulations.js to handle all 10 files
- IGETC area mappings authored per CC (which CC course satisfies which IGETC area) as a separate data file per CC

### Claude's Discretion
- Exact styling of the three transfer dashboard cards (layout, sizing, color treatment)
- How to handle CCs with no articulation data for a given major (show "no data available" gracefully)
- Whether IGETC area 6 (Languages Other Than English) is included — it's often optional for UC transfer; Claude decides based on what makes the demo most useful
- Order/sort of requirement rows within each section

</decisions>

<specifics>
## Specific Ideas

- "The What-If should answer: what would my progress towards transferring to UCSB look like if I decide to transfer under a different UCSB major given my completed and in-progress CC courses?"
- "The Dashboard should display % transfer unit credit progress and % IGETC, basically GE, requirements"
- "Instead of the traditional roadmap as you see for a UCSB student's major progress, it would just show all completed, in-progress, and to-be-taken-in-the-future classes, and how close they are to transferring in terms of unit credits"
- User was a CC transfer student themselves — authenticity matters; the experience should feel like it was built for someone who actually went through the process

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useArticulations.js` — `useInstitutions()` and `useArticulations(institutionId)` hooks already exist and work; reuse directly in CC roadmap and dashboard
- `transferUtils.js` — `mapCcCoursesToUcsbRequirements()` already exists and is tested; the CC roadmap and dashboard build on this function
- `ProfileWizard.jsx` — existing 4-step wizard; the transfer path is a parallel branch within the same component (or a new TransferWizard component that shares steps)
- `WhatIfView.jsx` — existing major comparison view; extend with student_type branching rather than creating a new component
- `DashboardView.jsx` — existing dashboard; detect student_type and render transfer variant or UCSB variant
- `RoadmapView.jsx` — existing roadmap; detect student_type and render CC checklist or UCSB prerequisite map
- `src/data/articulations/` — existing data directory with institutions.json and 3 CC agreement files; expand to 10 CCs
- `MAJOR_CONFIGS` in majorConfigs.js — already has all 12 majors with requirements; CC roadmap and What-If consume this directly

### Established Patterns
- Student type stored on user object in data/users.json (add `student_type: 'ucsb' | 'transfer'`, `source_institution_id`, `target_major_id`)
- All views receive `user` prop and derive behavior from it — same pattern for transfer mode detection
- Inline styles using `theme.colors.*` — no raw hex (enforced by existing test)
- Named exports from all components
- Hooks follow useState + useEffect pattern matching useDeptCourses.js

### Integration Points
- ProfileWizard: add student_type selection at step 1; branch to transfer path if selected
- CompassDemo.jsx (composition root): passes `user` to all views; no structural change needed — views self-adapt
- Sidebar.jsx: remove "Transfer Credits" nav item (added in Phase 3, now superseded); ensure "Roadmap" nav item works for both student types
- data/users.json user schema: add `student_type`, `source_institution_id` fields
- POST /api/users and PUT /api/users/:id in server.js: no changes needed — already stores arbitrary user fields

</code_context>

<deferred>
## Deferred Ideas

- Transfer year countdown / "days until UC transfer deadline" — future phase
- CC GPA calculation and transfer eligibility warning (UC requires 2.4 min GPA) — could be added to Phase 5 Degree Auditor
- Planned future CC courses / semester planner grid — future phase
- Assist.org API integration for real-time articulation data — v2 (commercial API, out of scope for demo)
- Transfer admission statistics (acceptance rates by major from CC) — future phase

</deferred>

---

*Phase: 04-cc-transfer-mode*
*Context gathered: 2026-03-07*
