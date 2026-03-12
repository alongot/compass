# Testing Patterns

**Analysis Date:** 2026-03-02

## Test Framework

**Status:** No test framework currently configured.

**Framework:** Not detected
- No Jest, Vitest, or other test runner in `package.json`
- No test configuration files (`jest.config.*`, `vitest.config.*`)
- No test scripts in `package.json` (only `dev`, `build`, `preview`, `server`)
- No test files found in codebase (0 `.test.*` or `.spec.*` files)

## Test Coverage

**Current State:** 0% (untested codebase)

**Critical Untested Areas:**
- React components (CompassDemo.jsx, ProfileWizard, SearchableSelect, etc.) — no unit tests
- Hooks (useCourses, useDatabase, useProgram) — no hook tests
- API utilities (ucsbApi.js) — no API call tests or mocks
- Backend routes (server.js) — no route tests or integration tests
- Data transformation (import scripts) — no validation tests
- Supabase integration — no database query tests

## Recommendation: Setup Path

**To add testing, follow this sequence:**

1. **Install test framework** (recommend Vitest for speed with Vite):
   ```bash
   npm install --save-dev vitest @vitest/ui happy-dom
   ```

2. **Install assertion library:**
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom
   ```

3. **Create vitest.config.js:**
   ```javascript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'happy-dom',
       setupFiles: [],
     },
   });
   ```

4. **Add test script to package.json:**
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:coverage": "vitest --coverage"
   ```

## High-Priority Test Coverage Goals

**Hooks (src/hooks/):**
- `useDatabase.js` — mock Supabase client, test data fetching with loading/error states
- `useCourses.js` — mock API calls, test quarter/subject filtering
- Test dependency arrays to prevent infinite re-renders

**Utilities (src/utils/):**
- `ucsbApi.js` — mock fetch, test endpoint construction, error handling
- `supabase.js` — test `handleSupabaseError()` with various error codes

**Components (CompassDemo.jsx):**
- `extractCourseId()` — unit test with various input formats
- `buildUserRequirements()` — test transcript merging and course status updates
- Component rendering in DashboardView, RoadmapView, CourseBrowserView

**Backend (server.js):**
- POST /api/users — test user creation with valid/invalid payloads
- DELETE /api/users/:id — test deletion and error cases
- GET /api/users/:id — test 404 when user not found
- API proxy routes — test error handling when UCSB API fails

## Suggested Test Structure

**Test File Locations (co-located pattern recommended):**
```
src/
├── hooks/
│   ├── useDatabase.js
│   ├── useDatabase.test.js          ← Next to source
│   ├── useCourses.js
│   └── useCourses.test.js
├── utils/
│   ├── ucsbApi.js
│   ├── ucsbApi.test.js
│   └── ...
└── lib/
    ├── supabase.js
    └── supabase.test.js
```

**Test Command Structure:**
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --ui     # Interactive UI
npm run test:coverage # Coverage report
```

## Mock Patterns to Implement

**Supabase Mock (for hooks):**
```javascript
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      }),
    }),
  },
  isSupabaseConfigured: vi.fn(() => true),
  handleSupabaseError: vi.fn((err) => err.message),
}));
```

**Fetch Mock (for utilities):**
```javascript
global.fetch = vi.fn((url) => {
  if (url.includes('/courses')) {
    return Promise.resolve(new Response(JSON.stringify(mockCourses)));
  }
  return Promise.reject(new Error('Not mocked'));
});
```

**React Hook Testing Pattern:**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useCourses } from '../useCourses';

describe('useCourses', () => {
  it('fetches courses with loading and data', async () => {
    const { result } = renderHook(() => useCourses('20251', 'ECON'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.courses).toBeDefined();
  });
});
```

## What NOT to Test

**Avoid testing:**
- Inline styles in components (brittle, low value)
- Exact CSS values
- Third-party library internals (Supabase, Express, React)
- External API behavior (test error handling, not the API)
- Static mock data configuration

## Error Testing Strategy

**Backend API Routes (server.js pattern):**
```javascript
describe('POST /api/users', () => {
  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ firstName: 'John' }); // Missing lastName, school, major
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('returns 201 and user object on success', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ firstName: 'John', lastName: 'Doe', school: 'UCSB', major: 'Econ' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });
});
```

**Hook Error States (useCourses pattern):**
```javascript
it('sets error when fetch fails', async () => {
  global.fetch = vi.fn(() => Promise.reject(new Error('API down')));

  const { result } = renderHook(() => useCourses('20251', 'ECON'));

  await waitFor(() => {
    expect(result.current.error).toBe('API down');
    expect(result.current.courses).toEqual([]);
  });
});
```

## Future Test Infrastructure

**When adding tests, consider:**
- Coverage target: Aim for 80%+ on critical paths (hooks, utilities, routes)
- CI/CD integration: Run tests on pull requests
- Snapshot testing: Use sparingly for component output only
- Performance testing: Monitor hook re-render counts with @testing-library/react

**Testing dependencies to add later:**
- `supertest` for API testing (for server.js routes)
- `@testing-library/user-event` for interaction testing
- `@vitest/coverage-v8` for coverage reports

---

*Testing analysis: 2026-03-02*
