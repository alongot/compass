# Phase 2: UI Redesign - Research

**Researched:** 2026-03-06
**Domain:** React inline-style UI refactor, design system, UX flows, list virtualization/pagination
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | UI redesigned using Anthropic frontend-design skill — visual polish, layout, typography | Design system section, typography + color findings, frontend-design skill rules |
| UI-02 | Quarter-end flow — user can input final grades and enroll in next quarter courses in one flow | Quarter-end flow section, existing handler analysis, modal/wizard pattern |
| UI-03 | Course browser paginated (20/page) instead of rendering all 800+ at once | Pagination section, current CourseBrowserView analysis, no-library approach |
</phase_requirements>

---

## Summary

Phase 2 has three distinct tracks that can proceed in parallel: (1) a visual redesign pass guided by the Anthropic `frontend-design` skill, (2) a new "End Quarter" UX flow that converts in-progress courses to completed courses with grades and then enrolls the next quarter's courses, and (3) simple client-side pagination for `CourseBrowserView` to avoid rendering 800+ DOM nodes on load.

The project uses **inline `style={}` props throughout** — there is no CSS file, no CSS modules, no Tailwind. The only global CSS is a box-reset and `font-family: Inter` in `index.html`. All redesign work must stay within this inline-style paradigm; introducing a new CSS methodology mid-project would require touching every component. The `theme.js` file is the single source of design tokens and must be expanded as part of UI-01.

The `frontend-design` skill is available at `.claude/plugins/marketplaces/anthropic-agent-skills/skills/frontend-design/SKILL.md`. Its directive is **bold, distinctive aesthetics** with strong typography, committed color palette, motion/micro-interactions, and textured/layered backgrounds. It explicitly forbids generic AI aesthetics: Inter as the body font, purple-gradient-on-white, flat cookie-cutter layouts. The current app uses Inter + UCSB Navy/Gold, which is safe as a brand anchor but needs a stronger display font and richer visual texture. The skill's constraints shape UI-01 more than any library choice.

**Primary recommendation:** Execute the three tracks as three separate plans — design system + visual pass (UI-01), quarter-end modal flow (UI-02), pagination (UI-03) — in that order, since the design system changes affect every component and should land first.

---

## Standard Stack

### Core (existing — no new installs required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2 | UI rendering | Already in project |
| Vite | 5.0 | Dev server + build | Already in project |
| Google Fonts | (CDN) | Typography | Already wired in index.html |

### What NOT to add

The project explicitly avoids CSS frameworks. **Do not add:**
- Tailwind CSS — requires build plugin, conflicts with inline-style paradigm
- CSS Modules — requires file restructure, no tooling currently set up
- Framer Motion / React Spring — the frontend-design skill says "CSS-only solutions for HTML; use Motion library for React **when available**." Motion is not installed. For this project, use CSS transitions via inline `style` + React state, and CSS keyframe animations injected via a `<style>` tag in the root. This keeps zero new dependencies.
- A UI component library (MUI, Chakra, Radix) — would override existing styles and introduce heavy dependencies

**Installation:** No new packages needed for any of UI-01, UI-02, UI-03.

---

## Architecture Patterns

### Recommended Project Structure (unchanged from Phase 1 output)

```
src/
├── styles/
│   └── theme.js          # Expand with full token set (typography, spacing, shadows, radii)
├── components/
│   ├── shared/           # StatusBadge, DifficultyBadge, ProgressRing, SearchableSelect
│   ├── DashboardView.jsx # Add EndQuarterModal trigger (UI-02)
│   ├── CourseBrowserView.jsx # Add pagination state (UI-03)
│   └── ...               # Other views receive visual pass (UI-01)
└── main.jsx
```

### Pattern 1: Expanded Design Token System (UI-01)

**What:** Replace the current minimal `theme.js` (8 color values) with a full token set covering typography scale, spacing scale, shadow levels, border radii, and animation durations. All components reference `theme.*` — never hardcode design values.

**Current state of `src/styles/theme.js`:**
```js
// Only 8 color values exist today. Hardcoded values scattered in every component:
// borderRadius: '16px', padding: '24px', fontSize: '0.875rem', etc.
```

**When to use:** Always. The token system is the foundation for the entire visual pass.

**Example expanded shape:**
```js
// src/styles/theme.js — expanded
export const theme = {
  colors: {
    primary: '#003660',      // UCSB Navy — brand anchor, keep
    secondary: '#FEBC11',    // UCSB Gold — brand anchor, keep
    // ... expand accent, surface, text tokens
  },
  typography: {
    display: "'Playfair Display', Georgia, serif",   // distinctive display — NOT Inter
    body: "'DM Sans', system-ui, sans-serif",        // refined body alternative to Inter
    mono: "'JetBrains Mono', monospace",
    scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '2rem' },
    weight: { normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
  },
  spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px' },
  radii: { sm: '6px', md: '10px', lg: '16px', xl: '24px', full: '9999px' },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 32px rgba(0,0,0,0.12)',
    primary: '0 4px 16px rgba(0,54,96,0.25)',
  },
  transitions: { fast: '0.12s ease', base: '0.2s ease', slow: '0.35s ease' },
};
```

**Source:** Derived from design system best practices and the frontend-design skill's emphasis on CSS variables for consistency (verified via skill SKILL.md).

### Pattern 2: Typography Injection (UI-01)

**What:** The frontend-design skill forbids Inter as a body font. The app currently uses Inter everywhere via `font-family: 'Inter'` in index.html. Strategy: keep Inter as a fallback body font (brand familiarity), add a **distinctive display font** for headings. Best candidates given UCSB's institutional identity:

- `Playfair Display` — editorial, authoritative; pairs well with clean body text (HIGH confidence — widely used for academic/institutional dashboards)
- `DM Sans` or `Plus Jakarta Sans` as body replacement for Inter (MEDIUM confidence — both on Google Fonts, both have better optical sizing than Inter)

**Implementation:** Add Google Fonts `<link>` for chosen display font in `index.html`. Reference via `theme.typography.display` in component heading styles. Body font remains DM Sans or similar via `theme.typography.body`. Apply `fontFamily` inline where headings appear (h1, h2 in DashboardView, Sidebar, etc.).

**Warning sign:** Inter is already loaded in index.html. The new font must be added there too — not just referenced in theme.js.

### Pattern 3: End Quarter Modal Flow (UI-02)

**What:** A two-step modal launched from Dashboard:
1. **Step 1 — Grade Entry:** List every `in_progress` course; user inputs final grade for each via a grade selector (A, A-, B+, ..., F). "Confirm Grades" advances to step 2.
2. **Step 2 — Next Quarter Enrollment:** Shows `localKnownCourses` not yet completed or in-progress; user selects courses for the next quarter. "Enroll in Next Quarter" closes modal.

**When to use:** Triggered by an "End Quarter" button on DashboardView (top-right of the Current Quarter card, visible only when `currentQuarter` exists and has courses).

**Data flow:**
- Step 1 calls `handleMarkComplete(courseId, grade)` for each graded course (already exists in CompassDemo.jsx — moves course from `transcript.in_progress` to `transcript.completed`)
- Step 2 calls `handleAddInProgress(courseId)` for each selected next-quarter course (already exists)
- The modal receives both handlers as props; no new server endpoints needed

**Implementation:** A modal overlay component (`EndQuarterModal.jsx`) placed in `src/components/`. Use inline positioning (`position: 'fixed', inset: 0`) for backdrop, `position: 'fixed'` centered card for the modal body. No portals or external library needed; React 18 renders fixed-position elements correctly.

**State shape inside modal:**
```jsx
// Inside EndQuarterModal component
const [step, setStep] = useState(1);              // 1 = grade entry, 2 = next quarter enrollment
const [grades, setGrades] = useState(() =>
  inProgressCourses.reduce((acc, c) => ({ ...acc, [c.id]: 'A' }), {})
);
const [selectedNext, setSelectedNext] = useState(new Set());

const handleConfirmGrades = () => {
  // Validate all courses have grades, then advance
  setStep(2);
};

const handleEnroll = () => {
  // Bulk call onMarkComplete for each graded in-progress course
  // Bulk call onAddInProgress for each selected next-quarter course
  // Then close modal
  onClose();
};
```

**Source:** Derived from analysis of existing `DashboardView.jsx` handler signatures and `CompassDemo.jsx` handler implementations (lines 131-155). HIGH confidence — handlers already exist, modal is pure UI.

### Pattern 4: Client-Side Pagination (UI-03)

**What:** Add `page` and `PAGE_SIZE = 20` state to `CourseBrowserView`. Slice the filtered/sorted `courses` array to `courses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)`. Render previous/next buttons and a page indicator.

**When to use:** Always — the current implementation renders the full array regardless of size.

**Key insight:** The Supabase query via `useDeptCourses` fetches all rows for a department at once (client-side filter). This means **all 800+ courses are in memory** — pagination is purely a render optimization, not a data fetching change. This is fine for the demo scope.

**State reset on filter change:** When `areaFilter` or `difficultySortDir` changes, `page` must reset to 0. Handle this with a `useEffect` dependency or by combining filter change handlers.

```jsx
// Source: derived from CourseBrowserView.jsx analysis
const PAGE_SIZE = 20;
const [page, setPage] = useState(0);
const totalPages = Math.ceil(courses.length / PAGE_SIZE);
const visibleCourses = courses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

// Reset page when filters change
useEffect(() => { setPage(0); }, [areaFilter, difficultySortDir]);
```

**Pagination controls:** Simple previous/next buttons + "Page X of Y" text. No external pagination library needed. Place below the course list.

### Anti-Patterns to Avoid

- **Introducing a CSS methodology mid-project:** Every component uses inline `style={}`. Mixing Tailwind or CSS Modules into even one component creates a split paradigm that confuses maintainers.
- **Adding animation libraries for minimal payoff:** Framer Motion is 50KB+ gzip. CSS transitions on `opacity`/`transform` via inline style state are sufficient for this phase.
- **Fetching pages from Supabase instead of slicing client-side:** `useDeptCourses` fetches all courses for a dept. Changing it to paginated server fetches would require query param changes, new loading states per page, and cache invalidation. Client-side slicing accomplishes UI-03's success criterion at zero backend cost.
- **Putting EndQuarterModal logic inside DashboardView:** DashboardView is already 692 lines. The modal must be its own file (`EndQuarterModal.jsx`) with its own state.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal backdrop/trap focus | Custom portal + focus lock logic | Simple fixed-overlay div + `onKeyDown` Escape handler | Demo scope; full ARIA compliance is v2 |
| Pagination component | Generic reusable paginator | Inline prev/next buttons in CourseBrowserView | One use case; YAGNI |
| Animation system | Custom keyframe manager | CSS `transition` via inline style + `opacity`/`transform` toggles | No animation library installed; CSS-only is sufficient |
| Font loading | Custom font observer | Google Fonts CDN `<link>` in index.html | Already used for Inter; same pattern |

**Key insight:** The biggest risk in this phase is scope creep — adding libraries, refactoring the CSS paradigm, or building a full design system when targeted polish + two feature additions are what's needed.

---

## Common Pitfalls

### Pitfall 1: Inter Font Still Applied After Theme Change
**What goes wrong:** `theme.typography.display` is defined in theme.js, but headings still render in Inter because `index.html` sets `font-family: 'Inter'` on `body`. Inline `fontFamily` on individual elements overrides this, but it's easy to miss heading elements in nested components.
**Why it happens:** Global CSS on `body` is inherited by all elements. Inline styles only override where explicitly set.
**How to avoid:** After updating theme.js, grep for every `fontSize` usage in components — if the element is a heading (`h1`, `h2`, section title text), add `fontFamily: theme.typography.display`.
**Warning signs:** Headings look identical to body text after font change.

### Pitfall 2: Pagination Page Not Resetting on Filter Change
**What goes wrong:** User is on page 3, changes area filter, still sees page 3 of the new (shorter) result set — or gets an empty page because the new filtered list has fewer than 60 items.
**Why it happens:** `page` state persists across filter changes unless explicitly reset.
**How to avoid:** `useEffect(() => { setPage(0); }, [areaFilter, difficultySortDir])`.
**Warning signs:** "No courses found" on non-zero pages after filtering.

### Pitfall 3: EndQuarterModal Bulk Calls Race Condition
**What goes wrong:** Calling `handleMarkComplete` in a loop for multiple courses causes each call to `structuredClone(currentUser)` from stale closure state — later calls overwrite earlier changes.
**Why it happens:** `handleMarkComplete` in CompassDemo.jsx reads `currentUser` from React state at call time. Multiple rapid calls all read the same pre-update snapshot.
**How to avoid:** The modal should collect all grade selections, then submit a single bulk payload. Either (a) add a `handleEndQuarter(grades, nextCourses)` handler to CompassDemo.jsx that does one `structuredClone` + one `saveUser`, or (b) call `handleMarkComplete` sequentially with `await` and accept that each call re-fetches state (safe if `saveUser` is atomic and state updates synchronously).
**Warning signs:** Only the last graded course appears in `transcript.completed` after "Confirm Grades."

### Pitfall 4: frontend-design Skill Produces Un-Themeable Code
**What goes wrong:** Following the skill's creative directive produces hardcoded hex values and one-off `style` blocks, bypassing `theme.js`, making future changes require hunting through all components again.
**Why it happens:** The skill is optimized for artifact generation (standalone components), not for system integration.
**How to avoid:** After the skill produces design direction/code examples, extract all color, spacing, and typography values into `theme.js` tokens before applying to actual component files. Treat skill output as a design spec, not production code.
**Warning signs:** `#1a1a2e` or `rgba(0,0,0,0.7)` appearing inline in component files.

### Pitfall 5: Large Modal Nested Inside 692-Line DashboardView
**What goes wrong:** Adding EndQuarterModal JSX inline inside DashboardView pushes it past 900 lines and makes it hard to understand the dashboard's own layout logic.
**Why it happens:** It's convenient to co-locate the modal with the button that triggers it.
**How to avoid:** Create `src/components/EndQuarterModal.jsx` as a standalone component. DashboardView imports it and renders it with `{showEndQuarter && <EndQuarterModal ... />}`.

---

## Code Examples

Verified patterns from codebase analysis:

### Existing Quarter Handlers (CompassDemo.jsx lines 131-155)
```jsx
// handleMarkComplete — moves in_progress → completed with grade
const handleMarkComplete = async (courseId, grade) => {
  const updated = structuredClone(currentUser);
  updated.transcript.in_progress = updated.transcript.in_progress.filter(
    c => extractCourseId(c.course) !== courseId
  );
  if (!updated.transcript.completed.some(c => extractCourseId(c.course) === courseId)) {
    const known = userKnownCourses.find(k => k.id === courseId);
    updated.transcript.completed.push({ course: courseId, grade, units: known?.units || 4 });
  }
  await saveUser(updated);
  setCurrentUser(updated);
};

// handleAddInProgress — enrolls in next quarter
const handleAddInProgress = async (courseId) => {
  const updated = structuredClone(currentUser);
  updated.transcript.in_progress.push({ course: courseId, units: known?.units || 4 });
  await saveUser(updated);
  setCurrentUser(updated);
};
```

### Recommended Bulk End-Quarter Handler (new — to add to CompassDemo.jsx)
```jsx
// Avoids race condition from calling handleMarkComplete in a loop
const handleEndQuarter = async (gradeMap, nextCourseIds) => {
  // gradeMap: { [courseId]: grade }
  // nextCourseIds: string[]
  if (!currentUser) return;
  const updated = structuredClone(currentUser);
  if (!updated.transcript) updated.transcript = { completed: [], in_progress: [] };

  // 1. Graduate all in-progress courses with their grades
  for (const [courseId, grade] of Object.entries(gradeMap)) {
    updated.transcript.in_progress = updated.transcript.in_progress.filter(
      c => extractCourseId(c.course) !== courseId
    );
    if (!updated.transcript.completed.some(c => extractCourseId(c.course) === courseId)) {
      const known = userKnownCourses.find(k => k.id === courseId);
      updated.transcript.completed.push({ course: courseId, grade, units: known?.units || 4 });
    }
  }

  // 2. Enroll in next quarter courses
  for (const courseId of nextCourseIds) {
    if (!updated.transcript.in_progress.some(c => extractCourseId(c.course) === courseId)) {
      const known = userKnownCourses.find(k => k.id === courseId);
      updated.transcript.in_progress.push({ course: courseId, units: known?.units || 4 });
    }
  }

  await saveUser(updated);
  setCurrentUser(updated);
};
```

### Pagination Slice Pattern (CourseBrowserView.jsx)
```jsx
const PAGE_SIZE = 20;
const [page, setPage] = useState(0);
useEffect(() => { setPage(0); }, [areaFilter, difficultySortDir]);

const totalPages = Math.ceil(courses.length / PAGE_SIZE);
const visibleCourses = courses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

// In JSX, replace: courses.map(...) with visibleCourses.map(...)
// Add below the list:
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
  <span>Page {page + 1} of {totalPages}</span>
  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</button>
</div>
```

### Modal Overlay Pattern (inline-style, no library)
```jsx
// EndQuarterModal.jsx — fixed overlay, keyboard-dismissible
export const EndQuarterModal = ({ inProgressCourses, knownCourses, onEndQuarter, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '560px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* modal content */}
      </div>
    </div>
  );
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic CompassDemo.jsx (3991 lines) | Composition root + extracted components | Phase 1 (2026-03) | Components can now be edited independently |
| Inter as sole font | Inter body + distinctive display font | Phase 2 target | Elevated visual hierarchy |
| All 800+ courses rendered | 20 courses per page | Phase 2 target | Eliminates DOM bloat |
| No quarter-end flow | End Quarter modal | Phase 2 target | Closes key UX gap |

**Deprecated/outdated:**
- Hardcoded design values scattered in component `style={}` props: replaced by `theme.*` tokens
- `font-family: 'Inter'` as the only font decision: replaced by display + body font pairing

---

## Open Questions

1. **Which display font for UCSB academic context?**
   - What we know: frontend-design skill forbids Inter for headings; UCSB Navy/Gold are brand-locked
   - What's unclear: Whether Playfair Display (editorial) or a geometric sans like Syne (modern academic) fits better
   - Recommendation: Planner should specify the font direction or leave as Claude's discretion at plan execution time. Both are on Google Fonts, zero cost, zero dependency.

2. **Should "End Quarter" button be on DashboardView or in the Sidebar nav?**
   - What we know: The action is contextual to the current quarter card in DashboardView
   - What's unclear: Whether users expect a global action (sidebar) or local action (dashboard card)
   - Recommendation: Place on the Current Quarter card in DashboardView — contextual placement is more discoverable. A sidebar action can be added in Phase 5.

3. **Should `handleEndQuarter` be a new bulk handler or sequential `handleMarkComplete` calls?**
   - What we know: Sequential calls have a race condition risk (see Pitfall 3)
   - What's unclear: Whether the modal's submit is fast enough to avoid the race in practice
   - Recommendation: Add `handleEndQuarter` as a new single-structuredClone bulk handler in CompassDemo.jsx. Eliminates the race definitively.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config.*, vitest.config.*, pytest.ini found |
| Config file | Wave 0 gap — none exists |
| Quick run command | `npx vitest run --reporter=verbose` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | theme.js exports full token set (colors, typography, spacing, shadows) | unit | `npx vitest run src/styles/theme.test.js` | ❌ Wave 0 |
| UI-01 | All view components import from theme.js, not hardcoded hex | lint/unit | `npx vitest run src/components/__tests__/theme-usage.test.js` | ❌ Wave 0 |
| UI-02 | EndQuarterModal renders grade inputs for all in-progress courses | unit | `npx vitest run src/components/__tests__/EndQuarterModal.test.jsx` | ❌ Wave 0 |
| UI-02 | handleEndQuarter moves in-progress to completed with correct grades | unit | `npx vitest run src/components/__tests__/CompassDemo.test.jsx` | ❌ Wave 0 |
| UI-02 | EndQuarterModal step 2 shows enrollment options after grade confirmation | unit | `npx vitest run src/components/__tests__/EndQuarterModal.test.jsx` | ❌ Wave 0 |
| UI-03 | CourseBrowserView shows max 20 courses initially | unit | `npx vitest run src/components/__tests__/CourseBrowserView.test.jsx` | ❌ Wave 0 |
| UI-03 | Page resets to 0 when filter changes | unit | `npx vitest run src/components/__tests__/CourseBrowserView.test.jsx` | ❌ Wave 0 |

> Note: Visual design quality (UI-01 "passes Anthropic skill review") is inherently manual — no automated test can verify aesthetic judgment. The automated tests above cover the structural/token aspects of UI-01 and the full logic of UI-02/UI-03.

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (all test files, fast — no DB calls)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `package.json` — add `"test": "vitest run"` script and install `vitest @testing-library/react @testing-library/jest-dom jsdom` as devDependencies
- [ ] `vite.config.js` — add `test: { environment: 'jsdom' }` to Vite config (Vitest uses Vite config)
- [ ] `src/styles/theme.test.js` — validates token shape exported from theme.js
- [ ] `src/components/__tests__/EndQuarterModal.test.jsx` — covers UI-02 behaviors
- [ ] `src/components/__tests__/CourseBrowserView.test.jsx` — covers UI-03 behaviors
- [ ] `src/components/__tests__/CompassDemo.test.jsx` — covers handleEndQuarter bulk logic

---

## Sources

### Primary (HIGH confidence)
- `src/styles/theme.js` — current token inventory (8 values; confirms expansion scope)
- `src/components/CourseBrowserView.jsx` — current render-all pattern confirmed (lines 167-168: `courses.map(course => ...)`)
- `src/components/DashboardView.jsx` — current quarter state and existing handler signatures confirmed (lines 1-55, 131-155)
- `CompassDemo.jsx` lines 100-155 — `handleMarkComplete`, `handleAddInProgress`, `handleEndQuarter` (missing) logic confirmed
- `index.html` — Inter font loading pattern confirmed; sole global CSS file
- `.claude/plugins/marketplaces/anthropic-agent-skills/skills/frontend-design/SKILL.md` — design directives verified directly

### Secondary (MEDIUM confidence)
- `package.json` — confirms no CSS framework, no animation library, no test framework installed
- `.planning/STATE.md` — decision to use Anthropic frontend-design skill for Phase 2 confirmed (line 68)
- `.planning/ROADMAP.md` — Phase 2 success criteria confirmed verbatim

### Tertiary (LOW confidence — not verified against external sources)
- Font recommendations (Playfair Display, DM Sans) — based on design knowledge; specific pairing should be validated at plan execution
- Vitest as test framework — standard for Vite projects but not verified against current Vitest docs for React 18 compatibility

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from package.json and source files; no new dependencies needed
- Architecture: HIGH — all patterns derived from direct codebase analysis
- UI-01 design direction: MEDIUM — font/aesthetic choices are directional; final aesthetic requires skill invocation at plan time
- UI-02 quarter flow: HIGH — handlers exist, modal pattern is well-understood, race condition documented
- UI-03 pagination: HIGH — trivial state addition, pattern is standard React
- Pitfalls: HIGH — all derived from direct code reading, not speculation

**Research date:** 2026-03-06
**Valid until:** 2026-06-06 (stable domain — React 18, inline styles, no third-party library churn expected)
