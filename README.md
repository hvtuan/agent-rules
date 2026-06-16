# agent-rules

Shared, versioned **agent rule sets** for Claude Code. One folder per purpose.

## Rule sets

| Folder | Purpose | Status |
|--------|---------|--------|
| `qc-automation` | Rules Claude follows when writing TS test automation (Playwright/API/mobile/visual/a11y/k6) | Active |

## What's inside

**Top level of the repo:**

| Path | What it is |
|------|-----------|
| `qc-automation/` | The QC automation rule set — the skill and everything it ships. |
| `install.sh` | Installer: `--global`, `--project <path>`, `--starter <path>`. |
| `docs/superpowers/` | The design spec and implementation plan (how this was built). |
| `CHANGELOG.md` | Version history. |

**Inside `qc-automation/`:**

| Path | Audience | What it's for |
|------|----------|---------------|
| `SKILL.md` | Claude | Entry point Claude loads when you ask for a test: trigger, mandatory checklist, self-review gate, routing, red-flags. |
| `references/` | Claude (rules) | The technical rules Claude must follow when writing tests. |
| `learn/` | You (human) | The learning path for moving from manual to automated testing. |
| `examples/` | Both | A small, **runnable** Playwright project that proves the rules (real passing tests). |
| `starter-pack/` | Your test repo | Configs you copy into a real test repo to enforce the rules by machine. |

**`qc-automation/references/` — the rules (Claude follows these):**

| File | Covers |
|------|--------|
| `code-structure.md` | Page objects, locator priority, no hard-waits, network mocking, auth reuse, config/secrets, API schema validation. |
| `test-design.md` | What/how to assert, atomic & independent tests, AAA, mandatory negative cases, data-driven, smoke/regression tiers. |
| `reporting.md` | HTML/Allure reports, on-fail evidence (trace/screenshot/video), flaky tracking, traceability matrix. |
| `process-gates.md` | PR checklist, Definition-of-Done, commit convention, CI gating order, test randomization, naming. |
| `visual-a11y.md` | Visual regression (stable screenshots, baselines) and accessibility (axe, severity gate, keyboard/ARIA). |
| `performance.md` | k6 performance: the 5 test types, thresholds as pass/fail, CI vs dedicated runs, realistic data. |

**`qc-automation/learn/` — the on-ramp (for a human learning automation):**

| File | What it helps you do | Read it when |
|------|----------------------|--------------|
| `onboarding.md` | Understand automation, run a test, read the trace, the "watch it fail first" habit, EN/VN glossary. | Start here, day one. |
| `manual-to-auto.md` | Translate your manual test cases into automated ones (with a worked example). | When you have a manual case to automate. |
| `reviewing-ai-tests.md` | Grade a test Claude wrote using your QC judgment; spot "fake green" tests. | Before accepting any test Claude writes. |

**`qc-automation/starter-pack/` — machine enforcement (copy into a real test repo via `install.sh --starter`):**

| Path | What it is |
|------|-----------|
| `eslint/eslint.config.js` | ESLint 9 flat config: bans hard-waits, XPath, floating promises, focused/skipped tests. |
| `playwright/playwright.config.ts` | Standard Playwright config: retries, trace/screenshot/video on fail, multi-browser, sharding-ready. |
| `tsconfig/tsconfig.json` | Strict TypeScript base config. |
| `git-hooks/` | `pre-commit` (lint + typecheck + changed tests) and `setup.sh` (installs the husky hook). |
| `ci/qc.yml` | GitHub Actions: lint → typecheck → sharded tests → upload report; plus a separate non-blocking smoke-perf job. |

## 1. Prerequisites

```bash
node -v   # >= 20
git --version
# Claude Code installed (CLI, desktop, or IDE extension)
```
Expected: Node 20+ and git are available.

## 2. Install — Global (your machine)

```bash
git clone https://github.com/hvtuan/agent-rules.git
cd agent-rules
chmod +x install.sh
./install.sh --global
```
Expected: `Linked ~/.claude/skills/qc-automation -> .../agent-rules/qc-automation`.
Verify: `ls -l ~/.claude/skills/qc-automation` shows a symlink. Open Claude Code and ask: "write a Playwright test for the login flow" — the `qc-automation` skill should activate.

## 3. Install — Per-project (team)

```bash
./install.sh --project /path/to/your-test-repo
```
Expected: creates `your-test-repo/.claude/skills/qc-automation/` and adds the pointer line to `your-test-repo/CLAUDE.md`. Commit both into the test repo so teammates get it on `git pull`.

## 4. Install — Starter-pack (Phase 2 machine enforcement)

```bash
./install.sh --starter /path/to/your-test-repo
cd /path/to/your-test-repo
npm i -D eslint typescript-eslint eslint-plugin-playwright husky lint-staged
mv eslint/eslint.config.js ./eslint.config.js   # ESLint auto-discovers it at repo root
bash git-hooks/setup.sh
mkdir -p .github/workflows && mv ci/qc.yml .github/workflows/qc.yml
```
Expected: copies `eslint/`, `playwright/`, `git-hooks/`, `ci/`, `tsconfig/` into the repo; the ESLint **flat config** (`eslint.config.js`, ESLint 9 + typescript-eslint 8 + eslint-plugin-playwright 2) sits at the repo root; husky pre-commit installed; CI workflow enabled at `.github/workflows/qc.yml`. For k6 perf, also `npm i -D @types/k6` and use k6 ≥ v0.57 (see `qc-automation/references/performance.md`).

## 5. Usage after install

Ask Claude (with the skill installed): *"Write a Playwright test for the checkout flow."* Claude builds a TodoWrite from the skill checklist and must pass the self-review gate before reporting done.

## 6. Update / re-sync

```bash
cd agent-rules && git pull
./install.sh --global                              # symlink: nothing more needed
./install.sh --project /path/to/your-test-repo     # copy: re-run to re-sync
```
Expected: global stays current automatically (symlink); per-project copies are refreshed by re-running.

## 7. Uninstall

```bash
rm ~/.claude/skills/qc-automation                  # global (symlink)
rm -rf /path/to/repo/.claude/skills/qc-automation  # per-project
```
Expected: the skill no longer resolves; remove the pointer line from the repo's `CLAUDE.md` if desired.

## 8. Troubleshooting

- **Skill not triggering** — confirm the symlink/folder exists and the `CLAUDE.md` pointer line is present.
- **`install.sh: Permission denied`** — run `chmod +x install.sh`.
- **Duplicate pointer in CLAUDE.md** — the installer is idempotent; remove extra lines if the file was hand-edited.
- **Lint fails after starter-pack** — install the devDependencies listed in section 4.

## Contributing / adding a rule set

Create a new top-level folder with a `SKILL.md` at its root (skill name = folder name). Update the table above and `CHANGELOG.md`.
