# Changelog

All notable changes to `agent-rules` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.3] - 2026-06-16

### Changed
- Split learner docs out of `references/` into a dedicated `qc-automation/learn/` folder
  so the human on-ramp is clearly separated from the technical rule references Claude
  follows. SKILL.md routing + pointer updated to the `learn/` paths.

## [0.1.2] - 2026-06-16

### Added
- Beginner on-ramp for manual testers moving to automation with Claude Code (now under
  `learn/`): `learn/onboarding.md` (mental model, running tests, reading the trace, glossary EN/VN),
  `learn/reviewing-ai-tests.md` (how to grade an AI-written test using QC judgment),
  `learn/manual-to-auto.md` (translate manual test cases into automation). Wired into SKILL.md routing + a human-reader pointer.

## [0.1.1] - 2026-06-16

### Changed
- ESLint starter-pack migrated to **ESLint 9 flat config** (`eslint.config.js`, typescript-eslint 8, eslint-plugin-playwright 2) — the legacy `.eslintrc.cjs` would be ignored by ESLint 9. Config is now proven to run and to catch hard-wait / XPath / floating-promise violations against the real examples.
- API example validates the response with a **zod** schema (`.parse()`), matching the contract-testing rule, instead of a loose `toMatchObject`.
- k6 perf: documented TypeScript setup (`@types/k6`, k6 ≥ v0.57 native TS or bundle); CI runs `perf/checkout.smoke.ts` (was a stale `.js` path).
- `code-structure.md` storageState snippet corrected to the idiomatic setup-project pattern.

### Added
- Examples now ship ESLint flat config + `lint`/`typecheck` npm scripts and a typecheck-validated k6 smoke example (`perf/checkout.smoke.ts`).
- Repo CI (`.github/workflows/examples.yml`) lints, typechecks, and runs the example suite plus the install.sh tests on every push/PR.

## [0.1.0] - 2026-06-16

### Added
- `qc-automation` rule set: SKILL.md gate, 6 reference rule files, runnable examples, Phase-2 starter-pack, and `install.sh` (global/project/starter modes).
- `qc-automation` composes with superpowers skills: test-driven-development (framework/test code), systematic-debugging (flaky/unclear failures), verification-before-completion (self-review gate), requesting/receiving-code-review (finished slices).
