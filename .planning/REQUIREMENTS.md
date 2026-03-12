# Requirements: Compass

**Defined:** 2026-03-05
**Core Value:** A student can see exactly where they stand in their degree — what's done, what's next, and what changes if they switch their plan — in under a minute.

## v1 Requirements

### Demo Refactor

- [x] **REFACTOR-01**: CompassDemo.jsx decomposed into separate component files (views, hooks, data, utils)
- [x] **REFACTOR-02**: Mock data moved from inline module-level code to imported JSON/module files
- [x] **REFACTOR-03**: State management uses proper patterns (no JSON.parse/stringify deep copies)

### UI Redesign

- [x] **UI-01**: UI redesigned using Anthropic frontend-design skill — visual polish, layout, typography
- [x] **UI-02**: Quarter-end flow — user can input final grades and enroll in next quarter courses
- [x] **UI-03**: Course browser paginated (20/page) instead of rendering all 800+ at once

### Transfer Logic

- [x] **TRANSFER-01**: Articulation agreements scraped/parsed for 3 representative community colleges (SBCC, SMC, De Anza) from assist.org PDFs and stored in Supabase
- [x] **TRANSFER-02**: CC-to-UCSB course equivalency data stored in Supabase
- [x] **TRANSFER-03**: Transfer credit evaluator — student selects CC + completed courses, app maps to UCSB equivalents

### CC Transfer Mode

- [x] **CC-01**: CC student profile type — user can declare `student_type: 'transfer'` during onboarding, select their source CC and target UCSB major; profile wizard branches accordingly
- [ ] **CC-02**: Full articulation data in Supabase for all 10 CCs × 12 majors from DEMO_ROADMAP.md (expands on TRANSFER-01 which covered 3 CCs only)
- [x] **CC-03**: IGETC tracking — GE area definitions stored, CC courses mapped to IGETC areas (1A/1B/2/3A/3B/4/5A/5B/5C), % completion per area calculated
- [x] **CC-04**: CC-specific dashboard — shows unit progress toward 60 transfer credits + IGETC % by area; replaces major requirement checklist for transfer students
- [x] **CC-05**: CC-specific roadmap — course timeline (completed/in-progress/planned CC courses) toward transfer eligibility; replaces UCSB major requirements map for transfer students
- [x] **CC-06**: CC-specific What-If — "given my CC courses, what would transfer progress look like under a different target UCSB major?" answers using real articulation data

### Degree Auditor

- [ ] **AUDIT-01**: Real degree audit engine replaces mock requirement-matching — reads from Supabase requirements table
- [ ] **AUDIT-02**: Prerequisite validation — warns user when adding a course with unmet prerequisites
- [ ] **AUDIT-03**: Recursive prerequisite chain implemented via PostgreSQL RPC (transitive prerequisites)
- [ ] **AUDIT-04**: GPA calculated and displayed from transcript grades
- [ ] **AUDIT-05**: What-If comparison uses real audit engine, not mock data

### Scale & UX

- [ ] **SCALE-01**: Users migrated from `data/users.json` to Supabase `profiles` table
- [ ] **SCALE-02**: Proactive alert when a required course is offered in the upcoming quarter
- [ ] **SCALE-03**: Advisor booking flow with auto-generated progress report PDF/summary

## v2 Requirements

### Authentication

- **AUTH-01**: UCSB NetID SSO integration — requires UCSB IT partnership
- **AUTH-02**: Multi-device session management with server-side sessions or JWT refresh

### Scaling

- **SCALE-V2-01**: Multi-institution support (UCLA, UCB) using same data template
- **SCALE-V2-02**: Transcript parsing migrated from Python/pdfplumber to Node.js PDF library
- **SCALE-V2-03**: Mobile-first redesign with PWA support

### Data Quality

- **DATA-01**: 20 remaining courses with incomplete prerequisite parsing fixed (see `docs/PREREQUISITES_MANUAL_REVIEW.md`)
- **DATA-02**: UCSB API migrated from v1 to v3 endpoints

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat/messaging | Not core to academic planning; adds complexity |
| Video content | No use case in academic planning context |
| Mobile native app | Web-first; mobile browser acceptable for demo |
| Commercial assist.org API partnership | Out of reach for demo phase; public PDFs only |
| Full test suite | Valuable but not blocking demo/product goals for this cycle |

## Traceability

| Requirement | Phase | Phase Name | Status |
|-------------|-------|------------|--------|
| REFACTOR-01 | Phase 1 | Demo Refactor | Pending |
| REFACTOR-02 | Phase 1 | Demo Refactor | Pending |
| REFACTOR-03 | Phase 1 | Demo Refactor | Pending |
| UI-01 | Phase 2 | UI Redesign | Pending |
| UI-02 | Phase 2 | UI Redesign | Pending |
| UI-03 | Phase 2 | UI Redesign | Pending |
| TRANSFER-01 | Phase 3 | Transfer Logic | Pending |
| TRANSFER-02 | Phase 3 | Transfer Logic | Complete |
| TRANSFER-03 | Phase 3 | Transfer Logic | Complete |
| CC-01 | Phase 4 | CC Transfer Mode | Pending |
| CC-02 | Phase 4 | CC Transfer Mode | Pending |
| CC-03 | Phase 4 | CC Transfer Mode | Pending |
| CC-04 | Phase 4 | CC Transfer Mode | Pending |
| CC-05 | Phase 4 | CC Transfer Mode | Pending |
| CC-06 | Phase 4 | CC Transfer Mode | Pending |
| AUDIT-01 | Phase 5 | Degree Auditor | Pending |
| AUDIT-02 | Phase 5 | Degree Auditor | Pending |
| AUDIT-03 | Phase 5 | Degree Auditor | Pending |
| AUDIT-04 | Phase 5 | Degree Auditor | Pending |
| AUDIT-05 | Phase 5 | Degree Auditor | Pending |
| SCALE-01 | Phase 6 | Scale & UX | Pending |
| SCALE-02 | Phase 6 | Scale & UX | Pending |
| SCALE-03 | Phase 6 | Scale & UX | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-06 — TRANSFER-01 scoped to 3 representative CCs (SBCC, SMC, De Anza) for demo*
