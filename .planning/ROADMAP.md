# Roadmap: Compass

## Overview

Compass has a working demo (CompassDemo.jsx monolith, Supabase backend, 823 courses). The path forward starts with cleaning that structural debt, then adds visual polish via Anthropic's frontend-design skill, then builds the two major feature layers — transfer logic and a real degree audit engine — and closes with the persistence and proactive UX that makes the platform production-ready.

## Phases

- [x] **Phase 1: Demo Refactor** - Decompose the 3991-line monolith into a maintainable component/feature structure (completed 2026-03-06)
- [ ] **Phase 2: UI Redesign** - Apply Anthropic frontend-design skill; add quarter-end flow and course browser pagination
- [ ] **Phase 3: Transfer Logic** - Scrape assist.org articulation agreements and build CC-to-UCSB transfer credit evaluator
- [x] **Phase 4: CC Transfer Mode** - Full CC transfer student experience: profile type, CC-specific dashboard/roadmap/what-if, and full 10×12 articulation data (completed 2026-03-07)
- [ ] **Phase 04.1: Transfer Experience Polish** - Fix crash bug, dashboard layout gaps, CC/UCSB course pairing, target major change, and UCSB transition flow
- [ ] **Phase 5: Degree Auditor** - Replace mock requirement matching with a real audit engine backed by Supabase
- [ ] **Phase 6: Scale & UX** - Migrate users to Supabase, add proactive course alerts and advisor booking

## Phase Details

### Phase 1: Demo Refactor
**Goal**: The codebase is maintainable — components can be found, changed, and reused without touching unrelated code
**Depends on**: Nothing (existing codebase is the starting point)
**Requirements**: REFACTOR-01, REFACTOR-02, REFACTOR-03
**Success Criteria** (what must be TRUE):
  1. CompassDemo.jsx is a thin composition root; no business logic or inline data lives there
  2. Each view (Dashboard, Roadmap, CourseBrowser, WhatIf) exists as its own file that can be opened and understood independently
  3. Mock data (major configs, course requirements, quarter plans) is imported from separate JSON or module files — not defined inline
  4. State updates use structured patterns (no JSON.parse/stringify deep copies in handlers)
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md — Extract leaf modules (theme, courseUtils, requirementsUtils, majorConfigs, catalogDescriptions)
- [ ] 01-02-PLAN.md — Extract hooks (useDeptCourses, useMajorRequirements)
- [ ] 01-03-PLAN.md — Extract shared components (StatusBadge, DifficultyBadge, ProgressRing, SearchableSelect)
- [ ] 01-04-PLAN.md — Extract view components (all 10 views into src/components/)
- [ ] 01-05-PLAN.md — Root cleanup: rewrite CompassDemo.jsx as composition root; replace all structuredClone sites

### Phase 2: UI Redesign
**Goal**: The app looks polished and handles two UX gaps — quarter transitions and course browser performance
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Visual design passes Anthropic frontend-design skill review — consistent typography, spacing, and color applied throughout
  2. User can end a quarter: input final grades for current courses, then enroll in next-quarter courses in one flow
  3. Course browser shows 20 courses per page with navigation controls; initial load does not render 800+ items
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Test infrastructure: install vitest, create test scaffolds for UI-01/02/03
- [ ] 02-02-PLAN.md — Design system: expand theme.js tokens, add display font, visual pass on all components (UI-01)
- [ ] 02-03-PLAN.md — End Quarter modal: EndQuarterModal.jsx, handleEndQuarter bulk handler, DashboardView wiring (UI-02)
- [ ] 02-04-PLAN.md — Course browser pagination: 20-per-page slice with Previous/Next controls (UI-03)

### Phase 3: Transfer Logic
**Goal**: A community college student can see which of their completed CC courses satisfy UCSB requirements
**Depends on**: Phase 1
**Requirements**: TRANSFER-01, TRANSFER-02, TRANSFER-03
**Success Criteria** (what must be TRUE):
  1. Articulation agreement data for 3 representative community colleges (SBCC, SMC, De Anza) is parsed and stored in Supabase (verifiable via DB query)
  2. User selects a CC and checks off completed CC courses; the app shows which UCSB requirements those courses satisfy
  3. Transfer credit mappings survive app reload — data is in Supabase, not memory
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0 test stubs: useArticulations.test.js, transferUtils.test.js, TransferView.test.jsx
- [ ] 03-02-PLAN.md — Seed data + import script: institutions.json, 3 CC agreement files, import-articulations.js (TRANSFER-01, TRANSFER-02)
- [ ] 03-03-PLAN.md — Hook + utility: useArticulations.js (Supabase-backed), transferUtils.js pure mapping function (TRANSFER-02, TRANSFER-03)
- [ ] 03-04-PLAN.md — TransferView component + CompassDemo.jsx nav wiring (TRANSFER-03)

### Phase 4: CC Transfer Mode
**Goal**: A CC transfer student gets a tailored Compass experience — onboarding declares transfer intent, all views adapt to show CC course progress toward UCSB transfer
**Depends on**: Phase 3
**Requirements**: CC-01, CC-02, CC-03, CC-04, CC-05, CC-06
**Success Criteria** (what must be TRUE):
  1. During profile creation, user can declare student_type "transfer", select their CC, and choose a target UCSB major
  2. Transfer student dashboard shows unit progress toward 60 transfer units and IGETC % completion by area (not major requirement checklist)
  3. Transfer student roadmap shows CC course timeline (completed/in-progress/planned) — not UCSB major requirements map
  4. Transfer What-If answers "what would my transfer progress look like under a different target major?" using their real CC courses
  5. Articulation data covers all 10 CCs × all 12 majors from DEMO_ROADMAP.md
**Plans**: 6 plans

Plans:
- [ ] 04-01-PLAN.md — Wave 0 test scaffolds: ProfileWizard, TransferDashboardView, TransferRoadmapView, TransferWhatIfView stubs + calculateIgetcProgress stubs (CC-01, CC-03, CC-04, CC-05, CC-06)
- [ ] 04-02-PLAN.md — Data + utility layer: 7 CC agreement JSON files, 10 IGETC mapping files, igetcAreas.js, calculateIgetcProgress, useIgetcMappings (CC-02, CC-03)
- [ ] 04-03-PLAN.md — ProfileWizard transfer path: student type choice + transfer-specific steps 2-4 (CC-01)
- [ ] 04-04-PLAN.md — TransferDashboardView + DashboardView branch: 3 progress cards + retained sections (CC-04)
- [ ] 04-05-PLAN.md — TransferRoadmapView + RoadmapView branch + remove Transfer Credits nav (CC-05)
- [ ] 04-06-PLAN.md — TransferWhatIfView + WhatIfView branch: all-12-majors ranked cards (CC-06)

### Phase 04.1: Transfer Experience Polish (INSERTED)

**Goal**: Transfer students have a crash-free, visually complete experience — CC course pairing is visible in the dashboard, they can change their target major, and they have a clear path to convert to UCSB student mode after admission
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06
**Depends on**: Phase 4
**Plans**: 4 plans

Plans:
- [ ] 04.1-01-PLAN.md — Wave 0 test stubs: ProfileWizard res.ok, TransferDashboardView CC pairing + major change, Sidebar subtitle
- [ ] 04.1-02-PLAN.md — Bug fix + sidebar: verify ProfileWizard res.ok guard (POLISH-01), fix Sidebar subtitle for transfer users (POLISH-06)
- [ ] 04.1-03-PLAN.md — Dashboard card polish: CC course pairing display in Card 3 major requirements (POLISH-02, POLISH-03)
- [ ] 04.1-04-PLAN.md — Transfer flows: inline target major change + UCSB transition modal (POLISH-04, POLISH-05)

### Phase 5: Degree Auditor
**Goal**: Requirement completion, prerequisite warnings, and What-If comparisons reflect real database records — not hardcoded mock logic
**Depends on**: Phase 1, Phase 3 (articulation data feeds audit)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05
**Success Criteria** (what must be TRUE):
  1. Dashboard requirement checklist matches the Supabase requirements table — adding or removing a course updates progress correctly
  2. Adding a course with unmet prerequisites triggers a visible warning before the course is accepted
  3. GPA is calculated and displayed on the dashboard from actual transcript grades
  4. What-If major comparison uses the same audit engine as the main dashboard — results are consistent, not mocked
**Plans**: TBD

### Phase 6: Scale & UX
**Goal**: User data is safe under concurrent use, and the app proactively surfaces what students need to act on next
**Depends on**: Phase 5
**Requirements**: SCALE-01, SCALE-02, SCALE-03
**Success Criteria** (what must be TRUE):
  1. User profiles and transcripts are stored in the Supabase profiles table — data/users.json is no longer used
  2. Dashboard shows an alert when a course required for the student's major is offered in the upcoming quarter
  3. User can initiate an advisor booking and receives an auto-generated progress summary (PDF or structured text) to share
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 4.1 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Demo Refactor | 5/5 | Complete   | 2026-03-06 |
| 2. UI Redesign | 2/4 | In Progress|  |
| 3. Transfer Logic | 4/4 | Complete   | 2026-03-07 |
| 4. CC Transfer Mode | 6/6 | Complete   | 2026-03-07 |
| 4.1. Transfer Polish | 3/4 | In Progress|  |
| 5. Degree Auditor | 0/TBD | Not started | - |
| 6. Scale & UX | 0/TBD | Not started | - |
