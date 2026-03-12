# Compass

## What This Is

Compass is a UCSB academic intelligence platform that helps students navigate degree planning, course selection, and transfer credit evaluation. It combines real UCSB course/program data (823 courses, 329 programs via Supabase) with an interactive React frontend to give students a visual, proactive degree audit — showing exactly where they stand, what's next, and how their plan changes if they switch majors.

## Core Value

A student can see exactly where they stand in their degree — what's done, what's next, and what changes if they switch their plan — in under a minute.

## Requirements

### Validated

- User profile creation wizard (name, school/major, transcript upload, current quarter) — existing
- Dashboard with progress cards, current quarter editing, educational history — existing
- Roadmap view with prerequisite map and requirements checklist — existing
- Course browser with filterable catalog and difficulty scores — existing
- What-If major comparison view — existing
- 12 majors supported with structured requirement data in `src/data/demo/majors.json` — existing
- UCSB Academic Curriculums API integration (proxied via Express, port 3001) — existing
- Supabase PostgreSQL backend (823 courses, 329 programs, schema migrated) — existing
- Transcript PDF parsing via Python/pdfplumber — existing
- User CRUD via REST API, persisted in `data/users.json` — existing

### Active

- [ ] Refactor CompassDemo.jsx monolith into component/feature file structure
- [ ] UI redesign using Anthropic frontend-design skill for better visual polish
- [ ] Phase 2: Scrape/parse assist.org articulation agreements for 10 target CCs
- [ ] Phase 2: Build CC-to-UCSB course equivalency mapping (transfer credit evaluator)
- [ ] Phase 3: Real degree audit engine replacing mock requirement matching logic
- [ ] Phase 3: Prerequisite validation — warn users if prerequisites unmet when adding courses
- [ ] Phase 3: Recursive prerequisite chain (transitive prerequisites via PostgreSQL RPC)
- [ ] Phase 3: GPA calculation and tracking from transcript data
- [ ] Phase 4: Quarter-end flow — input grades, roll over to next quarter
- [ ] Phase 4: Proactive notifications — alert when a required course is offered next quarter
- [ ] Phase 4: Advisor booking with auto-generated progress report

### Out of Scope

- UCSB NetID / SSO — requires UCSB IT partnership; deferred until institutional deal
- Multi-institution scaling (UCLA, UCB) — template exists; not in current cycle
- Mobile native app — web-first; mobile browser is acceptable for now
- Real-time chat / messaging — not core to academic planning value
- Video content — no use case in academic planning context

## Context

- Demo is fully functional with mock data; `CompassDemo.jsx` is a 3991-line monolith — the primary structural debt
- 12 major configs are defined inside CompassDemo.jsx and also in `src/data/demo/majors.json`; these need consolidation
- assist.org prohibits commercial data extraction without permission — plan should include a data-partnership request or scraping of only public/PDF formats for demo scope
- Difficulty scores derived from Daily Nexus grade distribution data (A/B/C/D/F rates)
- Prerequisite parsing is ~97.6% complete; 20 courses still need manual review (see `docs/PREREQUISITES_MANUAL_REVIEW.md`)
- Users stored in flat `data/users.json` — must migrate to Supabase before any production or shared deployment
- Anthropic frontend-design skill downloaded from `/anthropic/skills` GitHub repo — to be used for UI redesign phase

## Constraints

- **Tech Stack**: React 18 + Vite (frontend), Express (backend proxy, port 3001), Supabase PostgreSQL — no framework changes
- **Data**: Demo scope is 12 UCSB majors + 10 California community colleges per `docs/DEMO_ROADMAP.md`
- **Legal**: assist.org ToS restricts commercial data use without permission — scraping limited to demo/research context
- **Python dependency**: Transcript parsing requires Python 3 + pdfplumber; plan should eventually migrate to Node.js PDF library

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep CompassDemo.jsx as entry point during refactor | Avoids breaking `src/main.jsx` import; refactor incrementally | — Pending |
| Use Anthropic frontend-design skill for UI | Structured design approach rather than ad hoc CSS tweaks | — Pending |
| Scrape assist.org PDFs for demo (not commercial API) | Public PDFs are fair use for educational/demo purpose | — Pending |
| Migrate users to Supabase before Phase 4 | JSON file storage breaks under concurrent writes and multi-instance deploys | — Pending |

---
*Last updated: 2026-03-05 after initialization*
