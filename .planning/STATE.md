---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 04.1-transfer-experience-polish-03-PLAN.md
last_updated: "2026-03-09T21:51:46.988Z"
last_activity: 2026-03-05 — Roadmap created; all 16 v1 requirements mapped across 5 phases
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 23
  completed_plans: 22
  percent: 87
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Completed 04-cc-transfer-mode-05-PLAN.md
last_updated: "2026-03-07T18:42:29.247Z"
last_activity: 2026-03-05 — Roadmap created; all 16 v1 requirements mapped across 5 phases
progress:
  [█████████░] 87%
  completed_phases: 4
  total_plans: 19
  completed_plans: 19
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-05)

**Core value:** A student can see exactly where they stand in their degree — what's done, what's next, and what changes if they switch their plan — in under a minute.
**Current focus:** Phase 1 — Demo Refactor

## Current Position

Phase: 1 of 5 (Demo Refactor)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-05 — Roadmap created; all 16 v1 requirements mapped across 5 phases

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: -

*Updated after each plan completion*
| Phase 01-demo-refactor P01 | 15 | 2 tasks | 5 files |
| Phase 01-demo-refactor P02 | 1 | 2 tasks | 2 files |
| Phase 01-demo-refactor P03 | 2 | 2 tasks | 4 files |
| Phase 01-demo-refactor P04 | 9 | 2 tasks | 10 files |
| Phase 01-demo-refactor P05 | 8 | 2 tasks | 1 files |
| Phase 02-ui-redesign P01 | 3 | 2 tasks | 8 files |
| Phase 02-ui-redesign P04 | 15 | 1 tasks | 3 files |
| Phase 02-ui-redesign P03 | 30 | 2 tasks | 3 files |
| Phase 03-transfer-logic P01 | 5 | 2 tasks | 3 files |
| Phase 03-transfer-logic P03 | 4 | 2 tasks | 4 files |
| Phase 03-transfer-logic P02 | 3 | 2 tasks | 5 files |
| Phase 03-transfer-logic P04 | 6 | 2 tasks | 4 files |
| Phase 04-cc-transfer-mode P01 | 7 | 2 tasks | 6 files |
| Phase 04-cc-transfer-mode P05 | 15 | 2 tasks | 3 files |
| Phase 04.1-transfer-experience-polish P01 | 58 | 3 tasks | 3 files |
| Phase 04.1-transfer-experience-polish P02 | 5 | 2 tasks | 2 files |
| Phase 04.1-transfer-experience-polish P03 | 253 | 1 tasks | 2 files |

## Accumulated Context

### Roadmap Evolution

- Phase 04.1 inserted after Phase 4: Transfer Experience Polish (URGENT) — dashboard layout, CC/UCSB course pairing, transfer-only filtering, and UCSB transition flow

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Keep CompassDemo.jsx as composition root during refactor (avoids breaking src/main.jsx import)
- Use Anthropic frontend-design skill for Phase 2 UI (not ad hoc CSS tweaks)
- Scrape assist.org PDFs for demo scope only (public PDFs, not commercial API)
- Migrate users to Supabase before Phase 5 (JSON file breaks under concurrent writes)
- [Phase 01-demo-refactor]: MAJOR_CONFIGS runtime shape produced by transforming majors.json merged with QUARTER_PLANS and DIFFICULTY_SCORES constants in majorConfigs.js
- [Phase 01-demo-refactor]: CompassDemo.jsx stays intact during plan 01 — five leaf modules created alongside the monolith, import updates deferred to plan 02+
- [Phase 01-demo-refactor]: CompassDemo.jsx left fully intact during plan 02 — hooks created alongside the monolith, import updates deferred to plan 03+
- [Phase 01-demo-refactor]: StatusBadge and DifficultyBadge use hardcoded color strings (no theme import) matching source in CompassDemo.jsx
- [Phase 01-demo-refactor]: All four shared components use named exports for explicit import ergonomics in Plan 04
- [Phase 01-demo-refactor]: API_BASE defined locally in ProfileWizard.jsx (empty string) — no shared API config module exists yet
- [Phase 01-demo-refactor]: CourseBrowserView imports MAJOR_CONFIGS and buildKnownCourses directly (plan spec omitted them but component requires both for difficultyLookup)
- [Phase 01-demo-refactor]: Extracted saveUser() helper in CompassDemo.jsx to eliminate repeated fetch boilerplate in handlers
- [Phase 02-ui-redesign]: vitest.config.js pre-existed in repo alongside vite.config.js test block — both kept since both specify jsdom with no conflict
- [Phase 02-ui-redesign]: CompassDemo.test.jsx uses extracted pure handleEndQuarterLogic so tests pass immediately without React rendering
- [Phase 02-ui-redesign]: PAGE_SIZE=20 placed as module-level const; pagination controls only render when totalPages > 1; useEffect dependency array includes all filter/sort state
- [Phase 02-ui-redesign]: EndQuarterModal uses named export and GRADE_OPTIONS module-level const; handleEndQuarter uses extractCourseId() for normalization matching existing handler pattern
- [Phase 03-transfer-logic]: it.todo stubs used (not it.skip) so tests count as todo not skipped — clearer signal in test output
- [Phase 03-transfer-logic]: useArticulations returns empty array with loading=false synchronously when institutionId is falsy — avoids unnecessary Supabase calls
- [Phase 03-transfer-logic]: mapCcCoursesToUcsbRequirements does not filter by majorRequirements — returns all matched UCSB IDs; caller decides what is in requirements — keeps function reusable across majors
- [Phase 03-transfer-logic]: Only articulation_type === equivalent rows participate in mapping — combined/partial articulations excluded by design
- [Phase 03-transfer-logic]: select-then-insert used for institutions (not upsert) because assist_org_id has no UNIQUE constraint in live DB schema
- [Phase 03-transfer-logic]: filename-to-assist_org_id lookup map hardcoded in import script for deterministic CC resolution
- [Phase 03-transfer-logic]: TransferView uses theme.colors.* for all inline styles — raw hex violates existing theme-usage.test.js enforcement
- [Phase 04-cc-transfer-mode]: calculateIgetcProgress was pre-implemented before plan 04-01 ran — committed as-is rather than downgrading to todo stubs
- [Phase 04-cc-transfer-mode]: it.todo used (not it.skip) for Wave 0 stubs — matches Phase 3 convention for clearer test output
- [Phase 04-cc-transfer-mode]: TransferRoadmapView uses MAJOR_CONFIGS[id].requirements (not .sections) - actual shape from majorConfigs.js
- [Phase 04.1-transfer-experience-polish]: it.todo used (not it.skip) matching Phase 03/04 convention for clearer test output
- [Phase 04.1-transfer-experience-polish]: userSubtitle computed in CompassDemo (not Sidebar) to keep Sidebar free of MAJOR_CONFIGS data imports
- [Phase 04.1-transfer-experience-polish]: articulation_type === equivalent only for major card CC pairing — matches Phase 03 convention; combined/partial excluded by design
- [Phase 04.1-transfer-experience-polish]: Satisfied fallback (no code) when isSatisfied but no articulation row found — handles stale data gracefully without blank/broken display

### Pending Todos

None yet.

### Blockers/Concerns

- assist.org ToS restricts commercial extraction — Phase 3 scraping limited to PDF/public formats for demo
- 20 courses with incomplete prerequisite parsing (see docs/PREREQUISITES_MANUAL_REVIEW.md) — affects Phase 4 audit accuracy
- Supabase anon key exposed in CLAUDE.md — verify RLS policies before Phase 5 deployment

## Session Continuity

Last session: 2026-03-09T21:51:46.984Z
Stopped at: Completed 04.1-transfer-experience-polish-03-PLAN.md
Resume file: None
