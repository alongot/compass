# Coding Conventions

**Analysis Date:** 2026-03-02

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `CompassDemo.jsx`, `ProfileWizard`, `StatusBadge`)
- Hooks: Prefix with `use` in camelCase (e.g., `useCourses.js`, `useDatabase.js`, `useCourse`, `usePrograms`)
- Utilities: camelCase with descriptive names (e.g., `ucsbApi.js`, `supabase.js`)
- Scripts: kebab-case or camelCase (e.g., `import-courses.js`, `parse-prerequisites.js`, `transcriptparser.py`)
- Data files: kebab-case (e.g., `courses-with-prereqs.json`)

**Functions:**
- camelCase for all functions
- Prefix with `get`/`fetch`/`use` based on purpose (e.g., `fetchCourses()`, `getUsersDb()`, `extractCourseId()`)
- Internal helper functions are not prefixed with underscore; they're documented in comments
- Async functions use `async`/`await` pattern, not callbacks

**Variables:**
- camelCase for all variables and state
- Boolean flags prefixed with `is`, `has`, `can`, `should` (e.g., `isOpen`, `hasError`, `canBeVisible`, `shouldFetch`)
- State setters follow React convention: `const [state, setState]`
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `UCSB_API_KEY`, `USERS_FILE`, `PROXY_BASE_URL`)

**Types/Objects:**
- Object properties: camelCase (e.g., `courseIdClean`, `deptCode`, `unitsFixed`)
- API responses from Supabase use snake_case (e.g., `course_id_clean`, `dept_code`, `units_fixed`) — not transformed in code
- Status values: lowercase with underscore (e.g., `not_started`, `in_progress`, `completed`)

## Code Style

**Formatting:**
- No Prettier config found
- No ESLint config found
- Use 2-space indentation (observed in all files)
- Line length: No strict limit observed, but keep readable (typically under 100 chars)
- JSX attributes: Multi-line for clarity (see CompassDemo component)

**Comments:**
- JSDoc style for functions and hooks: `/** @param {type} name - description */`
- Block comments for sections: `// ============================================================================`
- Inline comments explain "why" not "what"
- TODO/FIXME comments used for future work (e.g., `// TODO: Create RPC function for recursive prerequisite chain` in `useDatabase.js`)

## Import Organization

**Order (observed pattern):**
1. React imports (`import React, { useState, ... } from 'react'`)
2. Third-party dependencies (express, cors, dotenv, etc.)
3. Internal utility imports (./utils, ./hooks, ./lib)
4. Data/JSON imports (./src/data)

**Path Aliases:**
- No aliases configured; all imports use relative paths
- Consistent use of explicit extensions in imports (e.g., `.js`, `.jsx`)
- Example: `import CompassDemo from '../CompassDemo'` in `src/main.jsx`

## Error Handling

**API/Async Patterns:**
- Try-catch blocks with finally for cleanup
- Error messages logged to console with context (e.g., `console.error('Error fetching courses:', error.message)`)
- User-facing errors returned as JSON with error key: `{ error: 'message' }`
- Supabase errors handled by `handleSupabaseError()` utility in `src/lib/supabase.js`

**React Hook Patterns:**
- State initialized with null/empty values: `const [state, setState] = useState(null)`
- Error state always set alongside loading: `setError(null); setLoading(true);`
- Async functions inside useEffect wrapped in inner async function (not direct async useEffect)
- Dependency arrays always specified explicitly

## Logging

**Framework:** console methods (no logging library)

**Patterns:**
- `console.error()` for errors with context message
- `console.log()` for informational messages in scripts
- No logging in components; only in utilities and server
- Server logs request types and status (e.g., `console.log('Proxy server running on http://localhost:${PORT}')`)

## Structure Pattern: Frontend Components

**Component Pattern (CompassDemo.jsx):**
1. Imports at top
2. Module-level constants (theme, mock data)
3. Utility functions (extractCourseId, buildUserRequirements)
4. Custom hooks (useEconBARequirements)
5. Smaller reusable components (StatusBadge, DifficultyBadge, ProgressRing)
6. Larger container components (SearchableSelect, ProfileWizard)
7. Main App component (CompassDemo)

**Component Patterns:**
- Inline styles using object literals `style={{ ... }}`
- Props destructuring in function parameters
- Hooks used for state management (useState, useEffect, useCallback, useRef)
- No prop validation (PropTypes not used)
- No TypeScript (JavaScript only)

## Structure Pattern: Backend/Scripts

**Server Patterns (server.js):**
1. Imports and configuration setup
2. Middleware setup (cors, express.json)
3. Helper functions (callUcsbApi, getUsersDb, saveUsersDb)
4. Route definitions organized by feature (API proxying, user management, transcript parsing)
5. Error handling in try-catch blocks for each route

**Data Manipulation Functions:**
- Synchronous helpers for file I/O (readFileSync, writeFileSync)
- Async functions for API calls and database operations
- Transform functions that map from one data format to another (e.g., `transformCourse()` in import scripts)

## Database Query Patterns

**Supabase Hook Pattern (useDatabase.js):**
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  if (!condition) {
    setLoading(false);
    return;
  }

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: queryError } = await supabase
        .from('table')
        .select('...')
        .filters();

      if (queryError) throw queryError;
      setData(result);
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, [dependencies]);

return { data, loading, error, refetch };
```

## Configuration

**Environment Variables:**
- Frontend: prefixed with `VITE_` (Vite convention): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Server: unprefixed: `UCSB_API_KEY`, `SUPABASE_SERVICE_KEY`, `PYTHON_CMD`
- Loaded via `dotenv` in Node, accessed via `import.meta.env` in frontend

**Validation:**
- Configuration checked at startup with early `process.exit(1)` if required keys missing
- Silent fallback to empty strings if optional config missing, with console.error warning

## Special Conventions

**Course ID Format:**
- Always "DEPT NUMBER" with a space: `"ECON 1"`, `"CMPSC 16"` (not `ECON1`)
- Normalized by `extractCourseId()` function which handles various input formats

**Transcript Data Structure:**
- Consistent shape: `{ completed: [], failed: [], withdrawn: [], in_progress: [] }`
- Each entry: `{ course: "DEPT NUM", grade?: "A", units: 4, quarter?: "Winter 2026" }`

**Status Values:**
- For courses: `"not_started"`, `"in_progress"`, `"completed"`, `"planned"`
- For uploads: `"idle"`, `"uploading"`, `"success"`, `"error"`

---

*Convention analysis: 2026-03-02*
