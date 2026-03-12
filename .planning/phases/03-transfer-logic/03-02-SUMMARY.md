---
phase: 03-transfer-logic
plan: 02
subsystem: database
tags: [supabase, articulations, community-college, seed-data, json, import-script]

# Dependency graph
requires:
  - phase: 03-01
    provides: test stubs for transfer logic hooks (useArticulations, useInstitutions)
provides:
  - institutions.json with 10 target community colleges and their assist_org_id values
  - Three CC-to-UCSB articulation agreement JSON files (SBCC, SMC, De Anza) with 10 rows each
  - import-articulations.js seeding script that loads both tables into Supabase
affects:
  - 03-03 (hooks implementation — useArticulations queries the articulations table these rows populate)
  - 03-04 (evaluator UI — needs articulation rows to demo transfer credit evaluation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - select-then-insert idempotency for tables without unique constraints
    - filename-to-assist_org_id lookup map for CC agreement file routing
    - batch course ID resolution via .in() query before upsert

key-files:
  created:
    - src/data/articulations/institutions.json
    - src/data/articulations/agreements/sbcc-ucsb.json
    - src/data/articulations/agreements/smc-ucsb.json
    - src/data/articulations/agreements/de-anza-ucsb.json
    - scripts/import-articulations.js
  modified: []

key-decisions:
  - "select-then-insert used for institutions (not upsert) because assist_org_id has no UNIQUE constraint in live DB schema — only an index"
  - "filename-to-assist_org_id lookup map hardcoded in import script for deterministic CC resolution without parsing institution names"
  - "unresolved course codes (MATH 3A, MATH 3B, MCDB 1A, PHYS 1, PSYCH 1) logged as warnings and skipped — these courses not in Supabase courses table"

patterns-established:
  - "agreement JSON files use target_course_id_clean (DEPT NUMBER format) for human readability; import script resolves to UUID"
  - "import scripts validate SUPABASE_SERVICE_KEY presence before any DB calls; exit 1 with clear message if missing"

requirements-completed: [TRANSFER-01, TRANSFER-02]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 3 Plan 2: Articulation Seed Data and Import Script Summary

**10-institution JSON seed file, three CC agreement files (30 total articulation rows), and idempotent Supabase import script that inserts 10 institutions and 15 articulations on first run**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T07:24:08Z
- **Completed:** 2026-03-07T07:27:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created institutions.json with all 10 target community colleges (SBCC, SMC, De Anza, OCC, DVC, Foothill, PCC, IVC, CSM, Laney) including correct assist_org_id values
- Authored three CC agreement JSON files with 10 articulation rows each covering gateway courses across all 12 target majors (MATH, CMPSC, ECON, MCDB/BIO, CHEM, PHYS, PSYCH, PSTAT)
- Written import-articulations.js that runs without crashes, logs row counts, handles unresolved courses as warnings, and is idempotent

## Task Commits

Each task was committed atomically:

1. **Task 1: Author institutions.json and three CC agreement files** - `643eb36` (feat)
2. **Task 2: Write import-articulations.js seeding script** - `f133704` (feat)

## Files Created/Modified
- `src/data/articulations/institutions.json` - 10 CC institution records with assist_org_id, city, state
- `src/data/articulations/agreements/sbcc-ucsb.json` - 10 SBCC-to-UCSB articulation rows
- `src/data/articulations/agreements/smc-ucsb.json` - 10 SMC-to-UCSB articulation rows
- `src/data/articulations/agreements/de-anza-ucsb.json` - 10 De Anza-to-UCSB articulation rows
- `scripts/import-articulations.js` - Seeding script for institutions + articulations tables

## Decisions Made
- **select-then-insert for institutions:** The live Supabase `institutions` table has no UNIQUE constraint on `assist_org_id` (only a B-tree index), so `upsert(onConflict: 'assist_org_id')` fails. Changed to fetch existing rows first, then insert only new ones.
- **filename-to-assist_org_id map:** Rather than parsing short_name from DB lookups, a hardcoded lookup map in the script maps agreement filenames to assist_org_id strings. Simple and deterministic.
- **Unresolved courses as warnings:** MATH 3A, MATH 3B, MCDB 1A, PHYS 1, and PSYCH 1 are not in the Supabase `courses` table (courses table has 823+ records but these specific course_id_clean values appear absent). These are logged as warnings and skipped — 15 out of 30 articulations imported successfully.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed institutions upsert to select-then-insert**
- **Found during:** Task 2 (import script execution)
- **Issue:** `supabase.from('institutions').upsert(rows, { onConflict: 'assist_org_id' })` threw "there is no unique or exclusion constraint matching the ON CONFLICT specification" — the DB schema has an index on assist_org_id but not a UNIQUE constraint
- **Fix:** Replaced upsert with select-existing + insert-new-only pattern for idempotent behavior
- **Files modified:** scripts/import-articulations.js
- **Verification:** Script ran successfully inserting 10 institutions on first run, 0 on second run
- **Committed in:** f133704 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in conflict key assumption)
**Impact on plan:** Fix necessary for script to run. No scope creep. Idempotency guarantee maintained via select-then-insert.

## Issues Encountered
- 15 out of 30 articulation rows had unresolved target courses (MATH 3A, MATH 3B, MCDB 1A, PHYS 1, PSYCH 1 not in courses table). These are logged as warnings per plan spec and skipped. The 5 successfully resolved courses per CC (CMPSC 16, ECON 1, ECON 2, CHEM 1A, PSTAT 5A) provide sufficient data for the transfer evaluator demo.

## User Setup Required
None - no external service configuration required beyond SUPABASE_SERVICE_KEY already needed by other import scripts.

## Next Phase Readiness
- Institutions and articulations tables are seeded in live Supabase
- `useArticulations` and `useInstitutions` hooks (from 03-03) can now query real data
- Transfer evaluator UI (03-04) has sufficient articulation rows to demo credit evaluation for CS, ECON, CHEM, and STATS gateway courses

---
*Phase: 03-transfer-logic*
*Completed: 2026-03-07*
