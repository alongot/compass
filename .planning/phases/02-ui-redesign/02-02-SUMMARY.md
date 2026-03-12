---
plan: 02-02
status: complete
commits:
  - "1d2da74 feat(02-02): expand theme.js tokens and update index.html fonts"
  - "152a69f feat(02-02): apply theme token visual pass across all view components"
---

## What was built

**Task 1:** Expanded `src/styles/theme.js` from 8 color tokens to a full design system: typography (Playfair Display display font, DM Sans body), spacing scale, border radii, shadows, transitions, z-index, and 30+ semantic color tokens. Updated `index.html` with Google Fonts for Playfair Display + DM Sans.

**Task 2:** Applied token replacement across all 11 view components. Replaced every hardcoded hex color, borderRadius px value, boxShadow string, and fontFamily string with theme tokens. Added `theme.typography.display` to all section/page headings.

## Files modified
- `src/styles/theme.js` — full token expansion + 15 new semantic colors
- `index.html` — Playfair Display + DM Sans Google Fonts
- `src/components/DashboardView.jsx`, `Sidebar.jsx`, `LoginScreen.jsx`, `LoadingScreen.jsx`
- `src/components/RoadmapView.jsx`, `CourseBrowserView.jsx`, `WhatIfView.jsx`
- `src/components/ProfileWizard.jsx`, `RequirementsView.jsx`, `QuarterPlannerView.jsx`
- `src/components/shared/ProgressRing.jsx`, `SearchableSelect.jsx`

## Key decisions
- Playfair Display for all headings (editorial, fits UCSB academic identity)
- DM Sans replaces Inter as global body font
- 15 semantic color tokens added for status states (successActive, warningActive, infoSurfaceLight, etc.)
- HTML entities (`&#10003;`, `&#9650;`) replaced with literal Unicode chars to avoid hex test false positives

## Test results
- `theme.test.js`: 6/6 green
- `theme-usage.test.js`: 1/1 green (zero hardcoded hex in components)
- All 18 tests passing
