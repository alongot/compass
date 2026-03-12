---
status: awaiting_human_verify
trigger: "Blank screen after ProfileWizard when creating a transfer account with no classes. Sidebar crashes on mount reading index [0] of an undefined value."
created: 2026-03-09T00:00:00.000Z
updated: 2026-03-09T00:01:00.000Z
---

## Current Focus

hypothesis: All three source file fixes are confirmed applied. Server process still runs old code.
test: Verified server.js lines 172-179, ProfileWizard.jsx lines 203-207, Sidebar.jsx line 42 — all correct.
expecting: Restarting `npm run server` will load the patched validation; transfer user creation will succeed.
next_action: User must stop and restart the Express server (`npm run server`), then retry creating a transfer account.

## Symptoms

expected: App renders normally after creating a new account via ProfileWizard
actual: Blank screen — React error boundary triggered by crash in Sidebar component
errors: |
  Uncaught TypeError: Cannot read properties of undefined (reading '0')
    at Sidebar (Sidebar.jsx:42:22)
reproduction: Create a new account as a transfer student with no classes (skip transcript step in ProfileWizard)
started: After recent code changes (refactor into separate component files)

## Eliminated

- hypothesis: crash is caused by empty transcript arrays
  evidence: existing users with empty arrays (Luke Carango, Steve Jobs) work fine; issue is undefined firstName not empty transcript
  timestamp: 2026-03-09T00:00:30.000Z

## Evidence

- timestamp: 2026-03-09T00:00:10.000Z
  checked: Sidebar.jsx line 41-43
  found: |
    const initials = currentUser
      ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
      : '??';
    No optional chaining on firstName/lastName — if either is undefined, throws TypeError.
  implication: crash site confirmed; firstName is undefined on the currentUser object

- timestamp: 2026-03-09T00:00:20.000Z
  checked: server.js POST /api/users handler (lines 164-183)
  found: |
    Destructures { firstName, lastName, school, major } from req.body.
    Validates: if (!firstName || !lastName || !school || !major) return 400.
    Transfer payload from ProfileWizard sends student_type, source_institution_id, target_major_id — NOT school or major.
    Server returns: { error: 'firstName, lastName, school, and major are required' }
  implication: transfer user creation always returns a 400 error object

- timestamp: 2026-03-09T00:00:25.000Z
  checked: ProfileWizard.jsx transfer handleComplete (lines ~181-204)
  found: |
    const user = await res.json() — no res.ok check.
    onComplete(user) called with error object { error: '...' }.
    setCurrentUser({ error: '...' }) — object has no firstName or lastName.
  implication: error propagates silently; Sidebar receives malformed user object

## Resolution

root_cause: |
  Server POST /api/users rejects transfer user payloads with 400 because the transfer
  path sends `student_type/source_institution_id/target_major_id` instead of `school/major`.
  The error object is passed to onComplete() without res.ok checking, landing in
  currentUser state. Sidebar then crashes accessing firstName[0] on undefined.

  Two independent failure points:
  1. server.js — does not handle transfer user shape (missing school/major fallback)
  2. Sidebar.jsx — no defensive guard on firstName/lastName before indexing

fix: |
  1. server.js: Accept transfer user POST — either relax validation to allow school/major
     to be optional for transfer users, or map transfer fields to school/major equivalents.
  2. ProfileWizard.jsx: Add res.ok check before calling onComplete.
  3. Sidebar.jsx: Guard firstName/lastName with optional chaining before [0] access.

verification: self-verified — four targeted fixes confirmed in source files; server process restart required to load server.js changes
files_changed:
  - server.js
  - src/components/ProfileWizard.jsx
  - src/components/Sidebar.jsx (initials line + switch-account user list line)
