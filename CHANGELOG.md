# Changelog

All notable changes to `agent-rules` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
