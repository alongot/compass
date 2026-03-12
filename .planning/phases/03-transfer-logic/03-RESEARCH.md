# Phase 3: Transfer Logic - Research

**Researched:** 2026-03-06
**Domain:** articulation agreement data acquisition, Supabase storage, React UI for transfer credit evaluation
**Confidence:** HIGH (data sources confirmed live; schema pre-exists; approach validated by open-source precedents)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRANSFER-01 | Articulation agreements scraped/parsed for 10 target community colleges from assist.org PDFs | assist.org public API returns agreement lists as JSON; individual agreement detail requires Puppeteer or curated JSON seed data; see Data Acquisition section |
| TRANSFER-02 | CC-to-UCSB course equivalency data stored in Supabase | `institutions` and `articulations` tables already exist in the schema — no migration required; confirmed in 001_initial_schema.sql |
| TRANSFER-03 | Transfer credit evaluator — student selects CC + completed courses, app maps to UCSB equivalents | React UI pattern: CC selector dropdown + checklist of CC courses + result panel showing satisfied UCSB requirements; can use existing `buildUserRequirements()` logic with articulation overlay |
</phase_requirements>

---

## Summary

Phase 3 adds transfer credit evaluation: a student from one of the 10 target community colleges can select their school, check off completed CC courses, and see which UCSB degree requirements those courses satisfy.

The Supabase schema is already prepared. Tables `institutions` and `articulations` exist and are indexed correctly. Row-level security is configured with public read access on both tables. No new database migration is required — the entire work is (1) populating data, (2) adding Express API routes, and (3) building the React UI.

The data acquisition challenge is real but tractable. The assist.org website exposes public (unauthenticated) REST endpoints that return agreement metadata as JSON. These endpoints are used by the website's own SPA and are stable. The per-agreement course-level detail requires either (a) Puppeteer to drive the browser and extract the rendered HTML, or (b) hand-authored JSON seed files. Given the limited demo scope (10 CCs, 12 majors = at most 120 agreements, likely fewer have all 12 majors), hand-authored seed data per major is the most reliable approach. Several open-source projects (oshaw/assist-flowchart, jacobtbigham/ccc_transfers) have reverse-engineered the Puppeteer route and can serve as reference for any automated parsing.

**Primary recommendation:** Author curated JSON seed data for the 10 target CCs × 12 target majors, load into Supabase, then build the React evaluator UI. Do not rely on a live assist.org API call at runtime — data is too sensitive to pull-on-demand in a demo context.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.91.0 (already installed) | Read institutions + articulations from Supabase | Already in use; RLS configured |
| React 18 | 18.2.0 (already installed) | Transfer evaluator UI component | Project standard |
| Vitest | 4.0.18 (already installed) | Unit tests for articulation matching logic | Already configured |
| node-fetch / native fetch | built-in (Node 22) | Data import script to seed Supabase | Already used in import-*.js pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Puppeteer | 24.35.0 (already installed) | Automate assist.org browsing if scraping needed | Only if manual seed data is too large |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-authored JSON seed | Puppeteer scraper | Scraper is fragile; hand-authored data is auditable and demo-safe |
| Hand-authored JSON seed | assist.org formal API | API keys not publicly available until 2026-2027; gated to institution admins only |
| In-memory CC data | Supabase articulations table | Supabase already has the schema; survives reload (satisfies TRANSFER-02 and TRANSFER-03) |

**Installation:**
No new packages needed. All required dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── import-articulations.js   # Seeds institutions + articulations into Supabase
src/
├── data/
│   └── articulations/
│       ├── institutions.json           # 10 CC records with assist.org IDs
│       └── agreements/
│           ├── sbcc-ucsb.json         # CC code → UCSB course mappings
│           ├── smc-ucsb.json
│           └── ...                    # one file per CC
├── hooks/
│   └── useArticulations.js           # Supabase hook for fetching CC articulations
└── views/
    └── TransferView.jsx              # New view: CC selector + course checklist + results
```

### Pattern 1: Institutions JSON Schema

Each CC seed file for `institutions.json`:
```json
[
  {
    "name": "Santa Barbara City College",
    "short_name": "SBCC",
    "institution_type": "community_college",
    "assist_org_id": "92",
    "city": "Santa Barbara",
    "state": "CA"
  }
]
```

### Pattern 2: Articulations JSON Schema

Each per-CC agreement file (e.g., `sbcc-ucsb.json`):
```json
[
  {
    "source_course_code": "MATH 150",
    "source_course_title": "Calculus I",
    "source_units": 5,
    "target_course_id_clean": "MATH 3A",
    "articulation_type": "equivalent",
    "notes": null,
    "effective_start_date": "2024-01-01",
    "effective_end_date": null
  }
]
```

The import script resolves `target_course_id_clean` to a Supabase `courses.id` UUID using `.eq('course_id_clean', ...)`. The `source_institution_id` FK is resolved similarly from the pre-inserted institutions.

### Pattern 3: Supabase Hook for Articulations

```javascript
// src/hooks/useArticulations.js
export function useArticulations(institutionId) {
  // Queries articulations table, joins with courses
  // Returns array of { source_course_code, source_course_title, target_course_id_clean }
}

export function useInstitutions() {
  // Returns all community colleges from institutions table
}
```

### Pattern 4: TransferView Component

```
TransferView
├── CC selector dropdown (populated from useInstitutions())
├── CC course checklist (populated from useArticulations(selectedCC.id))
│   └── Each item: "MATH 150 - Calculus I  ↔  MATH 3A"
│       Checkbox state stored in local component state
└── Results panel
    └── For each checked CC course: show which UCSB requirement(s) it satisfies
        Uses same buildUserRequirements() logic with CC completions overlaid
```

### Pattern 5: Articulation Matching Logic (pure function)

```javascript
// Pure function — testable with Vitest
function mapCcCoursesToUcsbRequirements(checkedCcCourses, articulations, majorRequirements) {
  // 1. For each checked CC course, find articulation -> UCSB course ID
  // 2. Treat those UCSB course IDs as "completed" in requirement check
  // 3. Return list of satisfied requirements
}
```

This is the critical testable unit for TRANSFER-03 validation.

### Anti-Patterns to Avoid

- **Hardcoding CC-to-UCSB mappings inline in JSX:** All mapping data must come from Supabase to satisfy TRANSFER-02 (data survives reload).
- **Calling assist.org API at runtime from the frontend:** The formal assist.org API requires auth keys not available to the project. The public `assist.org/api/*` routes are safe for one-time seeding but should not be runtime dependencies.
- **Storing articulations only in users.json or localStorage:** This fails TRANSFER-02's "survives reload" criterion.
- **Single monolithic agreements JSON:** Split by CC so import script can be run incrementally, and partial failures don't corrupt the whole dataset.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase UPSERT for seed data | Custom conflict-handling logic | `.upsert(..., { onConflict: 'source_institution_id,source_course_code,target_course_id' })` | Supabase supports it natively; the table already has a UNIQUE constraint on this triple |
| CC institution lookup | Custom ID registry | `institutions` table in Supabase | Already in schema; just insert 10 rows |
| Requirement satisfaction check | New engine | Re-use `buildUserRequirements()` from `src/data/demo/majorConfigs.js` | Already tested logic; just overlay CC completions |
| HTTP requests from import scripts | New HTTP library | Native `fetch` (Node 22) — same as existing import scripts | Already established pattern |

**Key insight:** The database schema already anticipates this entire phase. The `institutions` and `articulations` tables were designed for exactly this use case. The main work is data authoring, not engineering.

---

## Common Pitfalls

### Pitfall 1: assist.org Formal API Auth
**What goes wrong:** Attempting to call `prod.assistng.org/articulation/api/...` returns HTTP 401. The formal JSON API requires an `API-Key` header obtainable only by institution administrators.
**Why it happens:** The API is in restricted beta as of 2026; public/third-party access is not expected until 2026-2027 academic year.
**How to avoid:** Use hand-authored seed data or Puppeteer scraping of the public assist.org website for one-time data extraction.
**Warning signs:** Any plan that calls `prod.assistng.org` at runtime will fail immediately.

### Pitfall 2: Public assist.org Endpoints Returning Agreement Metadata, Not Course Detail
**What goes wrong:** `https://assist.org/api/agreements?receivingInstitutionId=128&...` returns a list of major agreements (label + key) but NOT course-level equivalency data.
**Why it happens:** Course-level detail is at the artifact/articulation endpoint which requires the API key.
**How to avoid:** Use the public metadata endpoint only to discover which majors have agreements, then use Puppeteer to scrape the rendered HTML of the agreement page for course data.
**Warning signs:** A script that only hits the `/api/agreements` endpoint will store zero course equivalencies.

### Pitfall 3: assist.org Institution IDs
**What goes wrong:** Using wrong institution IDs causes empty results.
**Verified IDs from `https://assist.org/api/institutions`:**
| CC | assist.org ID |
|---|---|
| Santa Monica College | 137 |
| Santa Barbara City College | 92 |
| Orange Coast College | 110 |
| De Anza College | 113 |
| Diablo Valley College | 57 |
| Foothill College | 65 |
| Pasadena City College | 120 |
| Irvine Valley College | 83 |
| College of San Mateo | 104 |
| Laney College | 88 |
| UCSB (receiving) | 128 |

### Pitfall 4: Academic Year ID Drift
**What goes wrong:** Using stale year IDs causes `404` or empty responses from assist.org.
**Verified year IDs:**
- 2024-2025: ID 75
- 2023-2024: ID 74
**How to avoid:** Query `https://assist.org/api/academicYears` to get current IDs rather than hardcoding. Seed data should record the academic year it was sourced from.

### Pitfall 5: Missing UCSB Courses in Supabase
**What goes wrong:** Articulation import tries to resolve `target_course_id_clean` but the UCSB course isn't in the `courses` table.
**Why it happens:** Not all courses taught may be in the 823-course import.
**How to avoid:** Import script should log unresolved course codes. For demo scope, verify that the target courses for 12 majors are all present before importing articulations.
**Warning signs:** Import script returns 0 rows for articulations even though data is present.

### Pitfall 6: Supabase RLS on Articulations
**What goes wrong:** Frontend Supabase queries return empty even though data was imported.
**Why it happens:** RLS is enabled on `articulations` with `public read` policy — this should work, but only if the anon key is used. Import scripts use the service key, which bypasses RLS.
**How to avoid:** Test the frontend read path separately from the import. Verify that `supabase.from('articulations').select('*')` returns data in browser without service key.

---

## Code Examples

### Querying Articulations from Supabase

```javascript
// Source: Supabase JS docs pattern + existing useDatabase.js conventions
const { data, error } = await supabase
  .from('articulations')
  .select(`
    source_course_code,
    source_course_title,
    source_units,
    articulation_type,
    notes,
    target_course:courses!articulations_target_course_id_fkey (
      course_id_clean,
      title,
      units_fixed
    )
  `)
  .eq('source_institution_id', institutionId);
```

### Importing Articulations in a Script

```javascript
// Source: pattern from existing scripts/import-courses.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Resolve source institution ID
const { data: institution } = await supabase
  .from('institutions')
  .select('id')
  .eq('assist_org_id', '92')  // SBCC
  .single();

// Resolve target course UUID
const { data: course } = await supabase
  .from('courses')
  .select('id')
  .eq('course_id_clean', 'MATH 3A')
  .single();

// Upsert articulation
await supabase.from('articulations').upsert({
  source_institution_id: institution.id,
  source_course_code: 'MATH 150',
  source_course_title: 'Calculus I',
  source_units: 5,
  target_course_id: course.id,
  articulation_type: 'equivalent',
  effective_start_date: '2024-01-01',
}, {
  onConflict: 'source_institution_id,source_course_code,target_course_id'
});
```

### Listing Available UCSB Majors with Agreements (public assist.org endpoint)

```javascript
// Source: confirmed live from https://assist.org/api/agreements
const response = await fetch(
  'https://assist.org/api/agreements?receivingInstitutionId=128&sendingInstitutionId=92&academicYearId=75&categoryCode=major'
);
const { reports } = await response.json();
// reports: [{ label: "Computer Science, B.S.", key: "75/92/to/128/Major/..." }, ...]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| assist.org PDFs only | assist.org JSON API for metadata | 2023-2024 | Agreement lists available without PDF parsing |
| Public JSON API for course details | API-key-gated formal API | Summer 2024 | Course-level data requires either Puppeteer or hand-authored seed |
| Scraping required for CC list | `assist.org/api/institutions` | 2023 | Institution IDs available as plain JSON |

**Deprecated/outdated:**
- PDF-based parsing of assist.org: The site migrated to a PDF-less system around 2024 per Efferescent/Assist.org-Equivalent-Classes README; Puppeteer on the rendered HTML is the current scraping approach.
- `academicYearId` enumerated as "years since 1950": This was a community observation, not official. IDs are assigned sequentially; 2024-2025 = 75 is confirmed from the academic years API.

---

## Open Questions

1. **Exact course equivalencies per CC-major pair**
   - What we know: assist.org has articulation data for all 10 target CCs with UCSB; the metadata API lists available major agreements.
   - What's unclear: Which specific courses each CC offers that articulate to the 12 target major requirements. This is data authoring work, not an engineering unknown.
   - Recommendation: Author `src/data/articulations/` seed files based on current assist.org website data for each CC. Start with 2-3 CCs for the demo to prove the pipeline.

2. **Combined articulations (multiple CC courses satisfy one UCSB course)**
   - What we know: The `articulations` table has `articulation_type` with values `'equivalent'`, `'partial'`, `'combined'`. The ASSIST agreement model supports AND/OR conjunctions.
   - What's unclear: Whether the demo needs to support combined articulations (e.g., "CC Math 120A + 120B = UCSB MATH 3A").
   - Recommendation: Support `'equivalent'` only for the demo. Document `'combined'` as a v2 enhancement.

3. **TransferView placement in navigation**
   - What we know: Current nav has Dashboard, Roadmap, Course Browser, What-If.
   - What's unclear: Should TransferView be a top-level nav item or a modal/panel within DashboardView?
   - Recommendation: Add as a top-level nav item ("Transfer Credits") alongside existing views, consistent with existing navigation pattern in `CompassDemo.jsx` sidebar.

---

## Validation Architecture

> nyquist_validation is enabled in .planning/config.json — this section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.js` (exists, uses jsdom, setupFiles: `src/test-setup.js`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRANSFER-01 | Import script loads 10 CC institutions into Supabase and articulation rows > 0 | manual/smoke | `node scripts/import-articulations.js && node -e "..."` DB query | Wave 0 |
| TRANSFER-02 | Articulation data survives reload (reads from Supabase, not memory) | unit (hook mock) | `npm test -- src/hooks/useArticulations.test.js` | Wave 0 |
| TRANSFER-03 | mapCcCoursesToUcsbRequirements() correctly identifies satisfied requirements | unit | `npm test -- src/utils/transferUtils.test.js` | Wave 0 |
| TRANSFER-03 | TransferView renders CC selector and checklist | component | `npm test -- src/views/TransferView.test.jsx` | Wave 0 |

**TRANSFER-01 Validation Strategy:** Run `import-articulations.js` and then query Supabase to verify `count > 0` in `institutions` and `articulations` tables. This is a manual smoke test, not automated (requires live Supabase credentials).

**TRANSFER-02 Validation Strategy:** Mock Supabase in `useArticulations.test.js` and assert the hook returns the mocked data (not a hardcoded array). This proves the hook reads from Supabase rather than a local constant.

**TRANSFER-03 Core Logic Test:** The key testable unit is a pure function `mapCcCoursesToUcsbRequirements(checkedCcCourses, articulations, majorRequirements)`. Test cases:
- One CC course maps to one UCSB course that satisfies a preMajor requirement
- Two CC courses needed for one UCSB course (combined) — should NOT satisfy if only one checked
- CC course with no articulation in data — should return no satisfied requirement
- Empty checked courses — returns zero satisfied requirements

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useArticulations.test.js` — covers TRANSFER-02
- [ ] `src/utils/transferUtils.test.js` — covers TRANSFER-03 core matching logic
- [ ] `src/views/TransferView.test.jsx` — covers TRANSFER-03 UI rendering

*(test-setup.js already exists; no framework install needed)*

---

## Sources

### Primary (HIGH confidence)
- Live query: `https://assist.org/api/institutions` — institution IDs for all 10 target CCs and UCSB confirmed
- Live query: `https://assist.org/api/agreements?receivingInstitutionId=128&sendingInstitutionId=137&academicYearId=75&categoryCode=major` — agreement list format confirmed
- `src/data/migrations/001_initial_schema.sql` — `institutions` and `articulations` tables confirmed with all required columns and indexes
- `package.json` — vitest 4.0.18 confirmed installed; no new deps needed
- `vitest.config.js` — test framework config confirmed present and functional

### Secondary (MEDIUM confidence)
- [ASSIST Resource Center - Data](https://assist-resource-center.azurewebsites.net/Data) — confirms JSON API is planned future, not currently public; formal API restricted to institution admins
- [ASSIST Getting Started API Docs](https://prod.assistng.org/apidocs/docs/gettingstarted) — confirms API-Key header required; third-party public access anticipated 2026-2027
- [ASSIST News 2025-2026 Live](https://assist-resource-center.azurewebsites.net/News/2025-2026-academic-year-is-now-live-on-assistorg) — 2024-2025 year ID 75 confirmed
- [GitHub - jacobtbigham/ccc_transfers](https://github.com/jacobtbigham/ccc_transfers) — Puppeteer + pdfminer approach for prior-year data extraction; confirms PDF two-column parsing complexity
- [GitHub - oshaw/assist-flowchart](https://github.com/oshaw/assist-flowchart) — confirms Puppeteer scraping of rendered HTML as viable 2024+ approach

### Tertiary (LOW confidence)
- Community-reported assist.org institution IDs for specific CCs not in the first page of institutions API response (Diablo Valley, Foothill, Pasadena, Irvine Valley, College of San Mateo, Laney) — IDs should be verified against live `https://assist.org/api/institutions` before authoring seed data

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all required packages already installed; Supabase schema already written
- Architecture: HIGH — schema, hook patterns, and import script patterns all confirmed in codebase
- Data acquisition (assist.org): MEDIUM — public metadata endpoints confirmed live; course-level detail requires hand-authoring or Puppeteer (approach validated by open-source projects but not re-verified live for 2025-2026 data)
- Institution IDs: HIGH for SMC (137), SBCC (92), UCSB (128) — confirmed from live API; MEDIUM for remaining 7 (community-reported, need verification)
- Pitfalls: HIGH — API auth wall confirmed by 401 response; public vs. formal API distinction confirmed from official docs

**Research date:** 2026-03-06
**Valid until:** 2026-09-06 (stable data schema; assist.org API access policy unlikely to change before third-party access opens in 2026-2027)
