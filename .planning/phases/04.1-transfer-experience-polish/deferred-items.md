# Deferred Items — Phase 04.1 Transfer Experience Polish

## Pre-existing Issues (Out of Scope)

### TransferDashboardView igetcMappings.find TypeError

**Discovered during:** Plan 04.1-02 execution
**Status:** Pre-existing in working tree before this plan started
**Error:** `TypeError: igetcMappings.find is not a function` at `TransferDashboardView.jsx:178`
**Root cause:** `useIgetcMappings` hook returns `{ mappings: {}, loading: false }` (object), but the component calls `igetcMappings.find(...)` treating it as an array. The test mock also returns `{ mappings: {}, loading: false }` so `find` doesn't exist.
**Files:** `src/components/TransferDashboardView.jsx` line 178, `src/components/__tests__/TransferDashboardView.test.jsx`
**Impact:** 3 test failures in TransferDashboardView.test.jsx
**Fix needed:** Either destructure `mappings` from hook return value, or change the mock/hook to return an array directly.
