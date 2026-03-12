# External Integrations

**Analysis Date:** 2026-03-02

## APIs & External Services

**UCSB Academic Curriculums API v1:**
- Provides course catalog, class search, and academic program data
- SDK/Client: Native `fetch` API via proxy
- Auth: `UCSB_API_KEY` (server-side only, kept in `UCSB_API_BASE_URL` header)
- Endpoint: `https://api.ucsb.edu/academics/curriculums/v1`
- Used for: `/api/courses`, `/api/course`, `/api/departments`, `/api/search` routes
- Accessed via Express proxy in `server.js` to protect API key from frontend

**UCSB Catalog Web Scraping:**
- Manual course data extraction via `Puppeteer` browser automation
- Scripts: `scripts/scrape-programs.js`, `scripts/scrape-prereqs.js`
- Purpose: Extract prerequisite text, course descriptions, requirement mappings when API data is incomplete

## Data Storage

**Databases:**

- **Supabase (PostgreSQL)**
  - Connection: `VITE_SUPABASE_URL` (frontend), `SUPABASE_URL` (scripts)
  - Client: `@supabase/supabase-js` 2.91.0
  - Auth keys: `VITE_SUPABASE_ANON_KEY` (frontend), `SUPABASE_SERVICE_KEY` (admin scripts)
  - Schema: `public` (default)
  - Tables: 11 total
    - `courses` - 823+ UCSB courses with prerequisites and GE areas
    - `course_prerequisites` - Parsed prerequisite relationships
    - `course_ge_areas` - General Education requirement mappings
    - `programs` - 329+ UCSB academic programs
    - `program_group_versions` - Program variants by term
    - `requirement_categories` - Major requirement groupings
    - `requirement_rules` - Specific course/credit requirements
    - `students` - Student profiles
    - `transcript_entries` - Student completed/in-progress courses
    - `articulations` - Community college course mappings
    - Additional support tables
  - Real-time subscriptions: Enabled via Supabase config in `src/lib/supabase.js`
  - Features: UUID extension enabled, GIN indexes for JSONB queries, RLS policies

- **Local JSON Storage**
  - User profiles: `data/users.json` (simple JSON file)
  - User CRUD via Express endpoints: GET/POST/PUT/DELETE `/api/users[/:id]`
  - Format: Array of user objects with transcript data

**File Storage:**
- Local filesystem only
  - Directory: `uploads/` (created by Multer on first upload)
  - Type: PDF transcript files (10MB max per CLAUDE.md)
  - Lifecycle: Uploaded via POST `/api/transcript/parse`, deleted after Python parsing

**Caching:**
- Not explicitly integrated
- React state via `useState` hooks in components
- Supabase client handles connection pooling

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no third-party SSO)
- User creation: POST `/api/users` with `firstName, lastName, school, major`
- Session persistence: `localStorage.setItem('compass_last_user_id', id)`
- User lookup: GET `/api/users/:id` or GET `/api/users` (list all)
- No password/email authentication; profile-based switching

## Monitoring & Observability

**Error Tracking:**
- Not integrated (No Sentry, Rollbar, etc.)
- Console logging: `console.error()` in Express routes and React components

**Logs:**
- Express: Console output to stdout (e.g., "Proxy server running on http://localhost:3001")
- Python: Subprocess stderr output captured and logged in Express response
- Frontend: Browser console (no log aggregation)

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase
- Vite static build output: `dist/` directory
- Express backend: Node.js server process

**CI Pipeline:**
- Not configured (no GitHub Actions, Travis CI, or equivalent detected)
- Manual deployment likely required

## Environment Configuration

**Required env vars:**
- `UCSB_API_KEY` - UCSB Academic Curriculums API key (backend only)
- `UCSB_API_BASE_URL` - UCSB API base URL (default in `server.js`)
- `VITE_SUPABASE_URL` - Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (frontend)
- `SUPABASE_URL` - Supabase URL for import scripts (backend)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (backend data imports only)

**Optional env vars:**
- `PYTHON_CMD` - Python executable name (default: `python`, set in `server.js` line 244)

**Secrets location:**
- `.env` file (development)
- Environment variables (production)
- Service role key stored securely, used only for `node scripts/import-*.js` data pipelines

## Webhooks & Callbacks

**Incoming:**
- POST `/api/transcript/parse` - Accepts PDF file upload, triggers Python parsing
- Health check: GET `/api/health` (returns `{ status: 'ok', apiKeyConfigured: true/false }`)

**Outgoing:**
- None detected (no external webhook calls to third-party services)
- Python transcript parser runs as subprocess (child_process.execFile), outputs JSON to stdout

## Data Flow Integration

**UCSB Course → Supabase Flow:**
1. `scripts/import-courses.js` reads `src/data/datasets/courses-with-prereqs.json`
2. Transforms course objects and inserts into Supabase `courses` table
3. Uses `SUPABASE_SERVICE_KEY` to bypass RLS during batch import
4. Frontend queries via `useCourses()`, `useCourse()` hooks in React

**Transcript Upload Flow:**
1. Frontend POSTs PDF to `/api/transcript/parse`
2. Multer saves file to `uploads/` directory
3. Express spawns Python subprocess: `python scripts/transcriptparser.py [file] --json`
4. Python returns JSON to stdout (requires `pdfplumber` library)
5. Express returns parsed JSON to frontend
6. File deleted after parsing completes

**Program Data Flow:**
1. `scripts/import-programs.js` reads program JSON
2. Inserts into `programs` table via Supabase service key
3. Frontend queries via `usePrograms()`, `useProgram()` hooks
4. Requirement categories and rules fetched via nested queries with joins

---

*Integration audit: 2026-03-02*
