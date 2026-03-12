---
phase: 1
slug: demo-refactor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test runner in project |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run dev` (manual smoke) |
| **Estimated runtime** | ~10 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + manual smoke test all views
- **Before `/gsd:verify-work`:** Build green + all views render correctly
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| theme/utils extraction | 01 | 1 | REFACTOR-01 | build | `npm run build` | ✅ | ⬜ pending |
| hooks extraction | 01 | 1 | REFACTOR-01 | build | `npm run build` | ✅ | ⬜ pending |
| data extraction | 01 | 2 | REFACTOR-02 | build | `npm run build` | ✅ | ⬜ pending |
| views extraction | 01 | 3 | REFACTOR-01 | build | `npm run build` | ✅ | ⬜ pending |
| structuredClone replace | 01 | 4 | REFACTOR-03 | grep+build | `grep -rn "JSON.parse(JSON.stringify" src/ CompassDemo.jsx` | ✅ | ⬜ pending |
| root cleanup | 01 | 4 | REFACTOR-01 | build+smoke | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no test framework installation required. Build verification via `npm run build` is sufficient for a structural refactor with no behavioral changes.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 4 views render correctly after extraction | REFACTOR-01 | No automated UI tests | Start dev server, navigate to Dashboard, Roadmap, CourseBrowser, WhatIf — verify no visual regressions |
| Profile wizard completes successfully | REFACTOR-01 | No automated UI tests | Create new profile through all 4 wizard steps — verify data saves and dashboard loads |
| Mock data visible in UI after extraction | REFACTOR-02 | No automated UI tests | Check Dashboard shows major requirements, Roadmap shows prereq map |
| No JSON.parse/stringify in handlers | REFACTOR-03 | Grep check | Run: `grep -rn "JSON.parse(JSON.stringify" src/ CompassDemo.jsx` — expect 0 results |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
