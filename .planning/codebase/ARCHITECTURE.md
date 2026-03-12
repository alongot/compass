# Architecture

**Analysis Date:** 2026-03-02

## Pattern Overview

**Overall:** Three-tier monolithic demo with hybrid frontend-backend separation. The system uses a client-side React UI (`CompassDemo.jsx`) paired with an Express proxy server (`server.js`) to protect external API credentials, backed by Supabase PostgreSQL for persistent data.

**Key Characteristics:**
- Single-component React demo file contains all UI, state management, and mock data
- Express backend acts as a middleware layer for API key protection and user management
- Vite dev proxy (`vite.config.js`) routes `/api` calls to backend during development
- Supabase hooks provide read-only access to courses, programs, and requirements
- Mock data (hardcoded requirements and quarter plans) coexists with live Supabase data

## Layers

**Frontend Layer:**
- Purpose: React UI for degree planning, course browsing, transcript management
- Location: `CompassDemo.jsx` (root level), `src/main.jsx` (entry point)
- Contains: View components (DashboardView, RoadmapView, CourseBrowserView, etc.), UI helpers (StatusBadge, DifficultyBadge, ProgressRing), form wizards (ProfileWizard)
- Depends on: Supabase hooks, UCSB API proxy, local browser storage
- Used by: Browser via Vite dev server (port 5173) or production build (dist/)

**Backend Proxy Layer:**
- Purpose: Server-side API key management, user persistence, transcript parsing
- Location: `server.js` (port 3001)
- Contains: Express routes for UCSB API proxy, user CRUD, transcript PDF parsing
- Depends on: Express, Multer (file upload), Supabase (for health checks), Python (transcript parser)
- Used by: Frontend via `/api/*` requests during development and production

**Database Layer:**
- Purpose: Persistent storage for courses, programs, requirements, students
- Location: Supabase PostgreSQL, schema in `src/data/migrations/001_initial_schema.sql`
- Contains: 11 tables covering 823+ courses, 329 programs, prerequisite relationships
- Depends on: Supabase JavaScript client
- Used by: Frontend hooks and import scripts

**Utility/Library Layer:**
- Purpose: Reusable functions for data fetching, error handling, API calls
- Location: `src/lib/supabase.js`, `src/utils/ucsbApi.js`, `src/hooks/useDatabase.js`
- Contains: Supabase client initialization, UCSB API wrappers, database query hooks
- Depends on: Supabase SDK, Fetch API
- Used by: Frontend views and components

**Data Pipeline Layer:**
- Purpose: Import and transform UCSB catalog data into Supabase
- Location: `scripts/` directory
- Contains: Course/program import scripts, prerequisite parser, transcript parser
- Depends on: Supabase client, Puppeteer (web scraping), pdfplumber (PDF parsing)
- Used by: Manual data engineering workflows

## Data Flow

**User Profile Creation:**

1. User enters name, school, major via `ProfileWizard` component (4-step form)
2. Frontend POSTs to `/api/users` with profile data
3. Backend creates user record in `data/users.json` and returns user object with ID
4. Frontend stores user ID in `localStorage` for session persistence
5. State updates to navigate away from LoginScreen

**Transcript Processing:**

1. User uploads PDF via DashboardView
2. Frontend sends to `/api/transcript/parse` (Multer handles file)
3. Backend executes `scripts/transcriptparser.py` via Node's `execFile`
4. Python extracts course/grade data using pdfplumber, returns JSON
5. Frontend receives parsed transcript, updates user state
6. User's `transcript` object updated with `{ completed: [...], in_progress: [...], failed: [], withdrawn: [] }`

**Course Requirement Display:**

1. Frontend loads user's major from state
2. `useEconBARequirements()` hook fetches hardcoded requirement structure
3. Hook queries Supabase for live course data (title, units, description)
4. Returns merged requirements with real data overlaid on mock structure
5. Views render with current live database values

**Degree Auditing (What-If):**

1. User selects alternate major in `WhatIfView`
2. Frontend loads alternate requirements (currently mock data)
3. System compares completed courses against new major's requirements
4. Displays progress and missing courses

**State Management:**

- User session stored in `localStorage` (last user ID)
- Active view stored in React state (DashboardView, RoadmapView, etc.)
- User transcript stored in React state (populated from `/api/users/:id`)
- Requirements and quarter plan generated fresh on each view load (hardcoded logic)
- No Redux, Context, or persistent state library—all state is local to CompassDemo

## Key Abstractions

**User Object:**
- Purpose: Represents a student profile
- Examples: Managed by `/api/users` endpoints in `server.js`
- Pattern: JSON structure with `{ id, firstName, lastName, school, major, transcript, createdAt }`

**Transcript:**
- Purpose: Student's academic history
- Examples: Structure in `server.js` line 178 defines default shape
- Pattern: `{ completed: [{course, grade, units}], in_progress: [{course, units}], failed: [], withdrawn: [] }`

**Course:**
- Purpose: Represents a single UCSB course
- Examples: `ECON 1`, `MATH 2A` — normalized with space between dept and number
- Pattern: Database table with title, units, description, prerequisites, GE areas

**Requirement Category:**
- Purpose: Groups courses within a major (e.g., "Preparation for Major", "Upper-Division")
- Examples: Hardcoded in CompassDemo for Economics BA
- Pattern: `{ name, units, courses: [{id, name, units, status, difficulty}] }`

**Quarter Plan:**
- Purpose: Student's planned schedule across terms
- Examples: Default plan in CompassDemo starting Fall 2025
- Pattern: `[{ quarter: "Fall 2025", status: "current", courses: [...], totalUnits: 12 }]`

## Entry Points

**Frontend Entry:**
- Location: `src/main.jsx`
- Triggers: Browser navigation to app URL or `npm run dev`
- Responsibilities: Renders CompassDemo as React root

**Backend Entry:**
- Location: `server.js`
- Triggers: `npm run server` or production deployment
- Responsibilities: Listens on port 3001, handles all `/api/*` requests

**API Routes (server.js):**
- `GET /api/courses?quarter=...&subjectCode=...` — proxy to UCSB API
- `GET /api/course?quarter=...&courseId=...` — fetch single course
- `GET /api/departments` — list all subject areas
- `GET /api/search?quarter=...&query=...` — keyword search
- `GET /api/users` — list all users
- `POST /api/users` — create new user
- `GET /api/users/:id` — get single user
- `PUT /api/users/:id` — update user (transcript, etc.)
- `DELETE /api/users/:id` — delete user
- `POST /api/transcript/parse` — upload and parse PDF
- `GET /api/health` — server status

## Error Handling

**Strategy:** Sync try-catch for async operations, error state tracking in React hooks, user-friendly error messages.

**Patterns:**
- UCSB API errors: Caught in `callUcsbApi()`, logged to console, returned as HTTP 500
- Supabase errors: Handled by `handleSupabaseError()` in `src/lib/supabase.js`, returns friendly message
- File upload errors: Multer validates MIME type, returns 400 if not PDF
- Transcript parsing: Python failures logged, HTTP 500 with helpful message mentioning dependencies
- React hooks: State includes `loading` and `error` flags, displayed conditionally in UI

## Cross-Cutting Concerns

**Logging:**
- Console.error for backend API failures (`server.js`)
- No structured logging framework; all errors print to stdout

**Validation:**
- Backend validates required query params on all routes
- Frontend validates form inputs before submission (ProfileWizard)
- Multer validates file type (PDF only)

**Authentication:**
- No auth system implemented—anyone with access to the server can create/edit/delete users
- Session managed via localStorage (last user ID)
- Future: Supabase Auth integration (schema includes `auth_user_id` field in students table)

**API Key Protection:**
- UCSB API key stored server-side in `.env`
- Frontend cannot see key; all UCSB API calls go through backend proxy
- Health check endpoint reveals if key is configured (for debugging)

---

*Architecture analysis: 2026-03-02*
