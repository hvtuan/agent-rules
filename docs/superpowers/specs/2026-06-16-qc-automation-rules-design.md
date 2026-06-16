# QC Automation Rules — Design Spec

- **Date:** 2026-06-16
- **Repo:** `agent-rules` (private, `~/Github/agent-rules`) — a shared monorepo of agent rule sets, organized one top-level folder per agent/purpose.
- **Folder built in this iteration:** `qc-automation/`
- **Language:** All deliverables (spec, README, SKILL.md, references, examples, scripts, comments) are written in **English**.
- **Status:** Design approved — pending implementation plan.

## 1. Goal

A **Claude Code Skill** (`qc-automation`) that is the single source of truth Claude **follows automatically** when writing / editing / setting up test automation. Primary stack is **TypeScript**: Playwright (web E2E), supertest/axios (API), WebdriverIO + Appium (mobile), k6 (performance). It covers 6 rule domains and is enforced in 2 phases.

`agent-rules` is a monorepo of rule sets; each purpose is one self-contained top-level folder following the same convention. This iteration builds only `qc-automation/`; the rest is scaffolding + convention for future expansion.

### Non-goals (YAGNI)
- Do not build other agent folders (scaffolding + convention only).
- Do not write tests for a real project inside this repo (rules + illustrative `examples/` only).
- Do not replace a global CLAUDE.md — rules live in the skill; CLAUDE.md is only a pointer.
- No Python/Java support this iteration (rules + examples are TS/JS).

## 2. Consumer & usage mechanism

Primary consumer = **AI agent (Claude Code)**. Rules live in a **Skill** (loaded on trigger, with checklist + gate), NOT in CLAUDE.md (always injected into context, token-heavy, no gate).

Three ways to use it in a real test project:
1. **Global skill** — symlink `qc-automation/` → `~/.claude/skills/qc-automation/` (for a personal machine; updating the repo updates the skill instantly).
2. **Per-project skill** (default for teams) — copy the folder into `<test-repo>/.claude/skills/qc-automation/`, commit it with the repo; the whole team + CI share it.
3. **CLAUDE.md pointer** (supplementary) — a short line in the test repo: *"When writing/editing test automation, you MUST use the `qc-automation` skill."* Pointer only, no rules.

Default rollout: **(2)+(3) via `install.sh`**, while also supporting **(1) global** for the owner's machine. `install.sh` handles copy/symlink + pointer injection (idempotent), solving drift via re-sync.

## 3. Enforcement — 2 phases

- **Phase 1 (now): skill + self-review gate.** A mandatory checklist → TodoWrite → self-review gate Claude must pass before reporting done. Soft, no infrastructure needed.
- **Phase 2 (later): machine enforcement.** `starter-pack/` with ESLint rules + playwright.config + git-hooks + CI workflow. Machine-enforceable rules fail for real, not just on Claude's discipline.

Split: **machine-decidable** rules (no-hard-wait, no-XPath, no-secret, no-floating-promises, naming, on-fail-evidence) → Phase 2 lint/CI. **Judgment-based** rules (atomic, independent, traceability, negative coverage) → skill self-review gate.

## 4. Repo layout

```
agent-rules/
├── README.md                     # index: rule sets, install steps, convention for new folders
├── install.sh                    # --global | --project <path> | --starter <path>
├── CHANGELOG.md
├── docs/superpowers/specs/       # this spec
└── qc-automation/                # rule set built this iteration
    ├── SKILL.md                  # trigger + checklist gate + self-review + routing + red-flags
    ├── references/
    │   ├── code-structure.md
    │   ├── test-design.md
    │   ├── reporting.md
    │   ├── process-gates.md
    │   ├── visual-a11y.md
    │   └── performance.md
    ├── starter-pack/             # Phase 2 — machine enforcement
    │   ├── eslint/
    │   ├── playwright/
    │   ├── git-hooks/
    │   ├── ci/
    │   └── tsconfig/
    └── examples/                 # runnable mini TS test repo demonstrating correct rules
```

**Convention for every folder:** each folder = one standalone skill, `SKILL.md` at folder root, skill name = folder name; installed via `install.sh`.

## 5. `SKILL.md` — the gate mechanism (the heart)

**a) Frontmatter trigger.** `description` like *"Use when writing/editing/setting up test automation (Playwright web / API / Appium mobile / k6)..."* so it auto-activates at the right time.

**b) Mandatory checklist → TodoWrite.** On activation, Claude MUST create todos from the checklist and follow them in order:
1. **Before writing** — determine test type (web/API/mobile/perf) + tier (smoke/regression) + map test-ID ↔ requirement.
2. **While writing code** — follow `code-structure.md`.
3. **While designing cases** — follow `test-design.md` (including mandatory negative tests).
4. **Reporting** — enable trace/screenshot/video-on-fail, correct report format (`reporting.md`).
5. **Self-review gate (mandatory before reporting done)** — run the refute checklist: any hard-wait? depends on another test? runs in parallel / shuffled order? evidence on fail? web-first assertions (no `expect(await ...isVisible())`)? any negative case? test-ID mapped to requirement? **Fail any item → go back and fix; do NOT report complete.**

**c) Routing block** — a "what to read for what" table (progressive disclosure; load only the relevant reference).

**d) Red-flags table** — "rationalization = STOP" entries (e.g. *"this test is small, no need for independence"* → Wrong). Follows the superpowers skill pattern to counter Claude's shortcuts.

## 6. `references/` content (6 files)

Each file: **principle (rule + why) → correct/incorrect TS example → applied to all 3 stacks (Playwright / API / Appium-WDIO)**.

### 6.1 `code-structure.md`
- POM with a **BasePage abstract class**; API has a service-client layer; mobile has screen-objects. No test logic inside POM.
- **No hard-wait** (`waitForTimeout`/`sleep`) → web-first assertions / explicit conditional waits.
- **Locator priority:** `getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS`; **no brittle XPath, no index-based**; chain + `.filter({ hasText })` for resilient locators.
- **Network interception** (`page.route`) to mock 3rd parties and "guarantee the response" — no dependency on external services.
- Auth **`storageState` reuse** via fixture, no re-login per test.
- Config/env: base URL/credentials via env/`.env`, **no hardcoded secrets**; standard `playwright.config` (retry, `trace:'on-first-retry'`, screenshot/video on-fail, multi-browser projects).
- API: reusable request/response spec builder; JSON **schema validation** for contract testing.
- Idempotent setup/teardown; no dependency on run order.

### 6.2 `test-design.md`
- **Test user-visible behavior, not implementation detail** (philosophy at the top).
- 1 test = 1 behavior; **atomic & independent** (passes when run alone / in parallel / shuffled).
- AAA / Given-When-Then; test name = behavior + expected result.
- **Mandatory web-first retry-able assertions**: `await expect(locator).toBeVisible()`; **forbid** `expect(await locator.isVisible()).toBe(true)`. `expect.soft()` for multiple asserts in one flow.
- **Mandatory negative testing** (not optional): each feature has error cases — validation, missing field, wrong format, unauthorized. "Happy-path avoidance".
- Data-driven (parametrize) instead of copy-paste; test data self-created & self-cleaned, never relying on data already present in the environment.
- Clear tiers: `@smoke` / `@regression`; test-ID mapped to requirement (traceability).
- Meaningful assertions, no duplicate/overly-broad asserts; no try/catch swallowing errors.

### 6.3 `reporting.md`
- Standard reports: Playwright HTML report + (optional) Allure for aggregation.
- **Mandatory on-fail evidence**: trace + screenshot + video (web) / screen recording + page source (mobile) / request-response log (API).
- Flaky tracking: mark, quarantine, never let flaky produce false-green CI.
- Traceability matrix: test-ID ↔ requirement ↔ result; report pass/fail/skip with explicit skip reason.

### 6.4 `process-gates.md`
- PR review checklist for tests (shared with the self-review gate).
- **Definition-of-Done for one test**: passes 3 consecutive local runs, has evidence, has tag/test-ID, no hard-wait.
- Commit convention; flaky-quarantine policy.
- **CI gating**: lint → typecheck → test (parallel + `--shard`) → report; upload trace/report artifacts.
- **Test randomization** (shuffle order to catch inter-test dependence) + **per-test timeout**.
- File/spec naming convention; test directory structure.

### 6.5 `visual-a11y.md`
**Visual regression**
- `toHaveScreenshot()` (built-in) by default; baselines committed to repo, diff reviewed on update.
- Mask dynamic regions; pin viewport + device scale; disable animation/caret; wait for stable state (fonts/network idle) before capture.
- Intentional threshold/maxDiffPixels; baselines split per OS/browser, captured in Docker/CI consistently (never mix local baselines).

**Accessibility**
- `@axe-core/playwright` to scan a11y in main E2E flows; mobile uses accessibility id as selector (a11y + stable locator).
- Severity gate: `critical`/`serious` → fail; `moderate`/`minor` → log/track (configurable).
- Manual: keyboard navigation, focus order, ARIA role/label for custom components.
- A11y assertions carry a test-ID mapped to WCAG → feed the shared traceability matrix.

### 6.6 `performance.md`
- k6, TS. 5 types: smoke (1 VU) / load (ramp→100) / stress (ramp→400) / spike (jump→500) / soak (50 VU sustained) — each with a clear purpose.
- Pass/fail via **thresholds in code**, never reading numbers by eye: `http_req_duration: ['p(95)<500']`, `http_req_failed: ['rate<0.01']`.
- Scenario-based + per-scenario thresholds; custom metrics (Trend/Rate/Counter/Gauge).
- **CI runs smoke perf only; large perf in a dedicated pre-release environment**; thresholds **WARN, not auto-block deploy** (false-positive prone); cadence 2–3×/week in staging; **never stress-test production**.
- Realistic test data & ramp profiles; warn against perf-testing shared environments (noise).

## 7. `starter-pack/` (Phase 2)

Copied into the real test repo to enforce by machine:
- **`eslint/`** — `eslint-plugin-playwright` (`no-wait-for-timeout`, `no-element-handle`, `valid-expect`, `no-focused-test`, `no-skipped-test`) + `@typescript-eslint/no-floating-promises` + custom rules blocking hardcoded secrets & XPath.
- **`playwright/`** — standard `playwright.config.ts`: retry, `trace:'on-first-retry'`, screenshot/video on-fail, html reporter, multi-browser projects.
- **`git-hooks/`** — pre-commit (husky/lint-staged): eslint + `tsc --noEmit` + run changed tests; pre-push: smoke tag.
- **`ci/`** — GitHub Actions: install → lint → typecheck → test (shard) → upload report/trace → a11y/visual gate; smoke perf job separate.
- **`tsconfig/`** — strict base config for the test project.

## 8. `install.sh`, `examples/`, `README`

**`install.sh`** (idempotent, 3 modes):
- `--global` → symlink `qc-automation/` → `~/.claude/skills/qc-automation/`.
- `--project <path>` → copy into `<path>/.claude/skills/qc-automation/` + inject pointer into `<path>/CLAUDE.md`.
- `--starter <path>` → copy `qc-automation/starter-pack/*` into the test repo.
- Print next-step guidance after installing.

**`examples/`** — runnable mini TS test repo (`npm test` passes): 1 web spec (POM + web-first asserts + network mock), 1 API spec (schema validation + negative case), 1 visual, 1 a11y test. Living documentation + reference for Claude.

**`README.md`** — must be a **detailed, copy-paste-runnable, step-by-step guide**, not just a brief index. Required structure:

1. **Introduction** — what the repo is, which rule sets `agent-rules` contains (table: folder ↔ purpose ↔ status).
2. **Prerequisites** — required versions of Node, Claude Code, git; check commands (`node -v`, etc.).
3. **Installation — step by step with concrete commands** for all 3 modes, each its own section:
   - **Global (personal machine):** clone repo → `cd` → `chmod +x install.sh` → `./install.sh --global` → how to verify (check symlink `~/.claude/skills/qc-automation/`, open Claude Code and trigger it).
   - **Per-project (team):** `./install.sh --project <test-repo-path>` → explain what it creates (`.claude/skills/...` + pointer line in `CLAUDE.md`) → commit into the test repo → teammates get it on pull.
   - **Starter-pack (Phase 2 enforcement):** `./install.sh --starter <test-repo-path>` → list copied files (eslint/playwright/hooks/ci/tsconfig) → enabling steps: `npm install` devDeps, activate husky, add `package.json` scripts, enable CI workflow.
4. **Usage after install** — a real prompt to trigger the skill ("write a Playwright test for the login flow..."), describe how Claude builds a TodoWrite from the checklist & runs the self-review gate.
5. **Update / re-sync** — `git pull` then re-run `install.sh` with the right mode; explain global (symlink) auto-updates vs project (copy) needs re-sync.
6. **Uninstall** — commands to remove the symlink/folder per mode.
7. **Troubleshooting** — skill not triggering, `install.sh` permission error, `CLAUDE.md` conflict, lint failing after starter-pack.
8. **Contributing / adding a new rule folder** — convention (each folder one `SKILL.md`, skill name = folder name), link CHANGELOG.

Every step has a **concrete command block** + expected result; optimized for a newcomer to copy-paste and run, not guess.

## 9. References
- Playwright official best practices (test user-visible behavior, web-first assertions, network interception, `no-floating-promises`, sharding, trace-on-retry).
- k6 / Grafana automated performance testing guide (thresholds warn-not-block, env isolation, never stress-test prod, cadence).
- qaskills.sh blog (locator priority chain, BasePage, storageState reuse, negative testing emphasis) — filtered out the Python/Java & commercial CLI parts.

## 10. Suggested build order
1. Repo skeleton + `README` + `install.sh` (global + project modes) + convention.
2. `qc-automation/SKILL.md` (trigger + checklist gate + self-review + routing + red-flags).
3. 6 `references/` files (principle + TS examples).
4. `examples/` runnable mini repo (prove the rules are feasible).
5. Phase 2: `starter-pack/` (eslint → playwright config → git-hooks → ci) + `install.sh --starter`.
