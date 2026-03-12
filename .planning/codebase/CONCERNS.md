# Codebase Concerns

**Analysis Date:** 2026-03-02

## Tech Debt

**Monolithic Demo Component:**
- Issue: All UI, state management, and logic consolidated in single 3991-line file (`CompassDemo.jsx`)
- Files: `CompassDemo.jsx`
- Impact: Hard to test, maintain, and extend. Changes to one feature risk breaking others. Component reuse impossible.
- Fix approach: Decompose into separate files following feature/domain structure. Move mock data to separate module. Extract hooks for wizard, dashboard, roadmap views.

**Hardcoded Mock Data:**
- Issue: Course requirements, quarter plans, and known courses defined inline at module level in `CompassDemo.jsx` (lines 18-130)
- Files: `CompassDemo.jsx` (lines 18-130)
- Impact: Demo data duplicates across multiple places; difficult to synchronize with database. Catalog descriptions duplicated from JSON file.
- Fix approach: Load mock data from separate files and create factory functions for test data. Use dynamic require/import.

**Deep Copy for State Updates:**
- Issue: Using `JSON.parse(JSON.stringify())` pattern for cloning objects in multiple handlers (lines 3827, 3847, 3870, 3886, 3908)
- Files: `CompassDemo.jsx` (lines 3825-3922)
- Impact: Inefficient, fragile with complex objects, doesn't preserve functions/symbols. Loses data on circular references.
- Fix approach: Use immer library or structured state management (Redux/Zustand). Create specific update functions instead of generic cloning.

**Prerequisite Parsing Incomplete:**
- Issue: 20 courses identified requiring manual prerequisite review due to non-standard formats (consent, standing, major restrictions)
- Files: `docs/PREREQUISITES_MANUAL_REVIEW.md`, `scripts/parse-prerequisites.js`
- Impact: Prerequisite chain validation incomplete for ~2.4% of courses. Users may not see all blocking requirements.
- Fix approach: Implement parsers for remaining patterns: quantity-based ("3 prior courses"), standing ("Sophomore standing or higher"), employment requirements. See `docs/PREREQUISITES_MANUAL_REVIEW.md` lines 22-44 for full list.

## Known Bugs

**Recursive Prerequisite Chain Not Implemented:**
- Symptoms: Only direct prerequisites fetched; transitive prerequisites (prerequisites of prerequisites) not shown
- Files: `src/hooks/useDatabase.js` (line 305)
- Trigger: Viewing prerequisite chain for any course with nested prerequisites
- Workaround: None—users see incomplete prerequisite trees
- Fix: Create PostgreSQL RPC function with recursive CTE as noted in TODO comment. Query structure ready at lines 306-332.

**Silent Network Failures in User Updates:**
- Symptoms: User edits transcript (add/remove/grade change) but server request fails silently. UI updates locally while backend remains stale.
- Files: `CompassDemo.jsx` (lines 3833-3841, 3858-3865, 3874-3881, 3896-3902, 3914-3921)
- Trigger: Network outage, server down, or API timeout during handleAddCourse, handleRemoveCourse, handleEditCourseGrade, handleMarkComplete, handleAddInProgress
- Workaround: Manually refresh app to restore state from server
- Impact: User thinks changes are saved but are only local. Reopening app loses data.
- Fix: Add explicit error handling and user feedback. Queue updates locally and retry on reconnect. Show "offline" status.

**Unvalidated User State in Handlers:**
- Symptoms: Functions assume currentUser exists and transcript structure is correct without validation
- Files: `CompassDemo.jsx` (lines 3825-3922)
- Trigger: Race condition or async timing issue where currentUser becomes null between dispatch and handler execution
- Workaround: None
- Fix: Add guards for transcript structure. Validate required fields before mutations. Use optional chaining consistently.

## Security Considerations

**Supabase Anon Key Exposed in .env:**
- Risk: Anonymous public key hardcoded in CLAUDE.md and scripts allows direct database access
- Files: `src/lib/supabase.js` (lines 17-18), `CLAUDE.md` (environment variables section), `scripts/parse-prerequisites.js` (line 27)
- Current mitigation: Supabase RLS policies on tables (assumed, need to verify). Anonymous key has read-only access by design.
- Recommendations:
  1. Verify RLS policies restrict modifications to authenticated users
  2. Rotate keys if ever committed with write permissions
  3. Never include in client-side code if write access needed—use backend proxy (already doing for UCSB API)
  4. Add secrets scanning to pre-commit hooks

**UCSB API Key in Environment Variable:**
- Risk: API key stored in `.env` file; unencrypted on disk and in memory
- Files: `server.js` (line 26)
- Current mitigation: Key kept server-side only, never sent to frontend
- Recommendations:
  1. Move to secure secret manager (AWS Secrets Manager, HashiCorp Vault)
  2. Implement key rotation policy
  3. Add API rate limiting on `/api/courses` endpoint to prevent key abuse
  4. Monitor usage for anomalies

**No Input Validation on User Endpoints:**
- Risk: PUT /api/users/:id accepts arbitrary JSON; malformed transcript structure could break app
- Files: `server.js` (lines 202-215)
- Current mitigation: None—frontend controls input but backend trusts all updates
- Recommendations:
  1. Add schema validation (joi, zod, or class-validator)
  2. Validate transcript structure: completed/in_progress/failed/withdrawn arrays with course/grade/units fields
  3. Sanitize string fields (firstName, lastName, school, major)

**Transcript Data Stored as Plain JSON:**
- Risk: User educational history stored in JSON files (`data/users.json`) with no encryption
- Files: `server.js` (lines 44-56)
- Current mitigation: None—file system permissions only
- Recommendations:
  1. Migrate to Supabase `profiles` table with field-level encryption
  2. Encrypt sensitive transcript data in transit and at rest
  3. Audit access logs for transcript reads

**User ID Generation Predictable:**
- Risk: User IDs generated as `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)` (line 172 in server.js)
- Impact: Weak ID collisions possible; IDs somewhat guessable
- Fix: Use `crypto.randomUUID()` or Supabase UUID generation

## Performance Bottlenecks

**Courses Table Full Scan for Departments:**
- Problem: `useDepartments()` fetches all courses then extracts unique dept_code in JavaScript
- Files: `src/hooks/useDatabase.js` (lines 350-388)
- Cause: No aggregation at database level; fetches 823+ records to extract ~20 departments
- Current query (line 367-370): `select('dept_code')` but still retrieves all rows
- Improvement path: Create a dedicated `departments` table or use `SELECT DISTINCT dept_code FROM courses` in a separate endpoint

**Mock Catalog Descriptions Rebuilt on Every Mount:**
- Problem: `catalogDescriptions` object built from 22,694-line JSON file at module load time
- Files: `CompassDemo.jsx` (lines 7-13)
- Impact: Blocks component initialization; rebuilds identical object on every page reload
- Fix: Move to lazy-loaded singleton. Pre-compute if size allows, or fetch from database.

**Prerequisite Chain N+1 Query:**
- Problem: Course prerequisites fetched separately from course data; course details require second query
- Files: `src/hooks/useDatabase.js` (lines 306-332)
- Impact: Waiting for course ID lookup before fetching prerequisites
- Fix: Use Supabase RPC or batch fetch. Current workaround unnecessary given structure.

**Dense Course Browser Without Pagination:**
- Problem: CourseBrowserView renders all filtered courses in single list
- Files: `CompassDemo.jsx` (lines 3500-3720)
- Impact: Slow rendering for 800+ courses; no virtual scrolling or pagination
- Fix: Implement pagination (20 results/page) or virtual scrolling (windowing)

## Fragile Areas

**Transcript Structure Assumptions:**
- Files: `CompassDemo.jsx` (state building, lines 3825-3922)
- Why fragile: Code assumes transcript has `completed`, `in_progress`, `failed`, `withdrawn` arrays with specific object shapes (course, grade, units). No type checking.
- Safe modification:
  1. Create TypeScript interfaces or JSDoc types
  2. Add `validateTranscript()` helper that normalizes structure
  3. Add migration helpers if schema changes
- Test coverage: Gaps on edge cases (missing fields, wrong types, empty arrays)

**Course Matching Logic:**
- Files: `CompassDemo.jsx` (`extractCourseId()` function and all handlers using it)
- Why fragile: Depends on exact "DEPT NUMBER" format. Missing spaces or wrong casing breaks matching.
- Safe modification:
  1. Create centralized course ID normalizer
  2. Add tests for edge cases: "CMPSC16" → "CMPSC 16", "cmpsc 16" → "CMPSC 16"
  3. Use database course_id_clean for canonical lookups
- Test coverage: No test file for course matching logic

**Requirements Building Logic:**
- Files: `CompassDemo.jsx` (`buildUserRequirements()` function, approximate line 140-200)
- Why fragile: Calculates requirement completion by matching course IDs against fixed requirement definitions. If requirements structure changes, breaks silently.
- Safe modification:
  1. Add logging/debug output to show matching progress
  2. Move logic to database views for authoritative requirement calculations
  3. Add comprehensive tests for major switching and GPA calculations
- Test coverage: No unit tests

**User Persistence via localStorage:**
- Files: `CompassDemo.jsx` (lines 3773, 3797, 3809, 3933)
- Why fragile: localStorage can be cleared, corrupted, or disabled in private browsing
- Safe modification:
  1. Add session storage fallback
  2. Fetch user state from server on load
  3. Detect state mismatch and prompt for recovery
- Test coverage: No test for recovery scenarios

## Scaling Limits

**User Storage in JSON File:**
- Current capacity: ~10-50 users (file size manageable until ~1MB)
- Limit: Multi-instance deployments will lose data; concurrent writes corrupt file
- Scaling path: Migrate to Supabase PostgreSQL immediately. Replace `data/users.json` with `profiles` table.
- Timeline: Critical before any production deployment

**Course/Program Data as Static JSON:**
- Current capacity: Handles 823 courses and 329 programs in memory
- Limit: Larger catalogs (10K+ courses) will cause memory pressure and slow load times
- Scaling path: Database-backed with pagination and lazy loading already designed in schema
- Timeline: Not critical for current 12-major demo, but implement before scaling to 10+ institutions

**Transcript Parsing Single Process:**
- Current capacity: ~1-2 concurrent PDF uploads (synchronous Python execution)
- Limit: Queue fills under 5+ simultaneous uploads
- Scaling path: Implement job queue (Bull.js, RabbitMQ) with worker pool
- Timeline: Needed before campus-wide rollout

**Session Management None:**
- Current: All state in localStorage; no server-side session
- Limit: Users logged in multiple devices see stale data
- Fix: Implement server-side sessions or JWT refresh tokens

## Dependencies at Risk

**pdfplumber (Python Dependency):**
- Risk: Requires Python 3 + pdfplumber installation; not bundled with Node
- Impact: Transcript parsing fails without manual setup; error message unhelpful if missing
- Migration plan:
  1. Move to Node.js PDF library (pdf-parse, pdfjs-dist) to eliminate Python dependency
  2. Or containerize with Docker to guarantee Python availability
- Current mitigation: Error message at line 252 in server.js advises manual install

**Puppeteer Version Mismatch:**
- Risk: Package.json lists `puppeteer@^24.35.0` but it's unused in main codebase
- Impact: Unnecessary dependency increases bundle and security surface
- Fix: Remove if not used in scraping scripts, or document why needed

**UCSB API Version Pinned:**
- Risk: Using `/v1` endpoint; v3 exists but partial migration
- Files: `server.js` (line 27)
- Impact: New endpoints may break compatibility; missing features
- Fix: Plan migration to v3 API incrementally; add feature detection

## Missing Critical Features

**Authentication & Authorization:**
- Problem: No user login; anyone can view/modify any user's profile via ID
- Blocks: Multi-user production use; institutional deployment
- Priority: High (needed before any external sharing)

**Prerequisite Validation:**
- Problem: No enforcement of prerequisites when adding courses; UI doesn't warn if prerequisites unmet
- Blocks: Accurate degree auditing; "What-If" comparison
- Priority: High (core feature)

**Transfer Credit Mapping:**
- Problem: No community college articulation agreements; can't evaluate CC transfer credits
- Blocks: Phase 2 of roadmap (Transfer Logic)
- Priority: Medium (planned feature)

**GPA Calculation:**
- Problem: No GPA calculation or tracking; grade distribution used only for difficulty scoring
- Blocks: Comprehensive academic progress tracking
- Priority: Medium (nice-to-have for MVP)

## Test Coverage Gaps

**CompassDemo Component Logic (CRITICAL):**
- What's not tested:
  - buildUserRequirements() logic (requirement completion calculation)
  - buildUserQuarterPlan() logic (quarter scheduling)
  - extractCourseId() normalization
  - handleAddCourse / handleRemoveCourse / handleEditCourseGrade mutations
  - User wizard form submission
  - State persistence to localStorage/server
- Files: `CompassDemo.jsx` (entire file; 3991 lines)
- Risk: Feature changes silently break core functionality
- Priority: Critical—add unit tests for all business logic

**Server Endpoints:**
- What's not tested:
  - User CRUD operations (create, read, update, delete validation)
  - Transcript parsing error handling
  - UCSB API proxy error responses
  - Request parameter validation
- Files: `server.js`
- Risk: Breaking API changes not caught
- Priority: High—add integration tests

**Database Hooks:**
- What's not tested:
  - usePrerequisiteChain() edge cases (circular prerequisites, missing courses)
  - useCourses() filter combinations
  - Error recovery and retry logic
  - Supabase RLS enforcement
- Files: `src/hooks/useDatabase.js`
- Risk: Silent data fetch failures
- Priority: Medium—add integration tests with Supabase test instance

**Prerequisite Parser:**
- What's not tested:
  - Parse confidence scoring accuracy
  - Edge cases from PREREQUISITES_MANUAL_REVIEW.md (20 failing courses)
  - Circular prerequisite detection
  - Grade normalization (C- vs C)
- Files: `scripts/parse-prerequisites.js`
- Risk: Incorrect prerequisite data stored in database
- Priority: High—add test suite before running parser on real data

---

*Concerns audit: 2026-03-02*
