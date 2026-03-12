---
phase: 2
slug: ui-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — Wave 0 installs vitest |
| **Config file** | vite.config.js (add `test: { environment: 'jsdom' }`) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | UI-01 | unit | `npx vitest run src/styles/theme.test.js` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | UI-01 | lint/unit | `npx vitest run src/components/__tests__/theme-usage.test.js` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 0 | UI-02 | unit | `npx vitest run src/components/__tests__/EndQuarterModal.test.jsx` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 0 | UI-02 | unit | `npx vitest run src/components/__tests__/CompassDemo.test.jsx` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | UI-02 | unit | `npx vitest run src/components/__tests__/EndQuarterModal.test.jsx` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 1 | UI-03 | unit | `npx vitest run src/components/__tests__/CourseBrowserView.test.jsx` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 1 | UI-03 | unit | `npx vitest run src/components/__tests__/CourseBrowserView.test.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — add `"test": "vitest run"` script and install `vitest @testing-library/react @testing-library/jest-dom jsdom` as devDependencies
- [ ] `vite.config.js` — add `test: { environment: 'jsdom' }` to Vite config
- [ ] `src/styles/theme.test.js` — validates token shape exported from theme.js
- [ ] `src/components/__tests__/EndQuarterModal.test.jsx` — covers UI-02 behaviors
- [ ] `src/components/__tests__/CourseBrowserView.test.jsx` — covers UI-03 behaviors
- [ ] `src/components/__tests__/CompassDemo.test.jsx` — covers handleEndQuarter bulk logic
- [ ] `src/components/__tests__/theme-usage.test.js` — verifies no hardcoded hex values in view components

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual design passes Anthropic frontend-design skill review | UI-01 | Aesthetic judgment cannot be automated | Run `/gsd:verify-work` and apply `.claude/plugins/marketplaces/anthropic-agent-skills/skills/frontend-design/SKILL.md` criteria manually |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
