---
phase: 3
slug: transfer-logic
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.js` (exists, uses jsdom, setupFiles: `src/test-setup.js`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | TRANSFER-02 | unit | `npm test -- src/components/__tests__/useArticulations.test.js` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | TRANSFER-03 | unit | `npm test -- src/components/__tests__/transferUtils.test.js` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | TRANSFER-03 | component | `npm test -- src/components/__tests__/TransferView.test.jsx` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | TRANSFER-01 | manual/smoke | `node scripts/import-articulations.js` + DB query | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | TRANSFER-02 | unit | `npm test -- src/components/__tests__/useArticulations.test.js` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | TRANSFER-03 | unit | `npm test -- src/components/__tests__/transferUtils.test.js` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | TRANSFER-03 | component | `npm test -- src/components/__tests__/TransferView.test.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/useArticulations.test.js` — stubs for TRANSFER-02 (hook reads from Supabase, not memory)
- [ ] `src/components/__tests__/transferUtils.test.js` — stubs for TRANSFER-03 (mapCcCoursesToUcsbRequirements pure function)
- [ ] `src/components/__tests__/TransferView.test.jsx` — stubs for TRANSFER-03 (CC selector + checklist renders)

*Existing infrastructure covers all phase requirements — test-setup.js and vitest.config.js already present; no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import script loads 3 CC institutions (SBCC, SMC, De Anza) and articulation rows into Supabase | TRANSFER-01 | Requires live Supabase credentials and network; not automatable in CI | Run `node scripts/import-articulations.js`, then query: `SELECT count(*) FROM institutions; SELECT count(*) FROM articulations;` — both must be > 0 |
| Transfer credit mappings survive app reload | TRANSFER-02 | End-to-end browser test | Load app, check off CC courses, reload page, verify same satisfied requirements still shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
