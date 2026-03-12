---
phase: 4
slug: cc-transfer-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x + @testing-library/react |
| **Config file** | `vitest.config.js` (root) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | Wave 0 | 0 | CC-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-W0-02 | Wave 0 | 0 | CC-03 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-W0-03 | Wave 0 | 0 | CC-04 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-W0-04 | Wave 0 | 0 | CC-05 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-W0-05 | Wave 0 | 0 | CC-06 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | CC-02 | manual smoke | `node scripts/import-articulations.js` | ✅ script exists | ⬜ pending |
| 4-01-02 | 01 | 1 | CC-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | CC-03 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | CC-04 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | CC-05 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-05-01 | 05 | 2 | CC-06 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 4-06-01 | 06 | 3 | UI | static | `npm test` (theme-usage.test.js) | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/ProfileWizard.test.jsx` — stubs for CC-01 (student type choice renders, transfer path saves correct user fields)
- [ ] `src/components/__tests__/TransferDashboardView.test.jsx` — stubs for CC-04 (3 cards render for transfer student)
- [ ] `src/components/__tests__/TransferRoadmapView.test.jsx` — stubs for CC-05 (IGETC checklist + major req sections render)
- [ ] `src/components/__tests__/TransferWhatIfView.test.jsx` — stubs for CC-06 (12 major cards render)
- [ ] Add `calculateIgetcProgress` test cases to `src/components/__tests__/transferUtils.test.js` — covers CC-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 10 CC agreement JSON files imported to Supabase without error | CC-02 | Script execution with real DB connection; can't mock Supabase in unit tests for import scripts | Run `node scripts/import-articulations.js`; verify exit 0 and row counts printed for all 10 CCs |
| Transfer student onboarding flow end-to-end in browser | CC-01 | Full wizard UX flow with real interactions | Create new profile, choose "CC Transfer Student", select CC, select major, add courses, complete wizard; verify user saved with student_type="transfer" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
