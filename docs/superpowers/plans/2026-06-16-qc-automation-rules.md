# QC Automation Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `qc-automation` Claude Code skill (single source of truth for writing TS test automation) inside the `agent-rules` monorepo, plus an `install.sh`, runnable `examples/`, and a Phase-2 `starter-pack/`.

**Architecture:** One self-contained folder `qc-automation/` holding `SKILL.md` (trigger + mandatory checklist gate + self-review + routing + red-flags) and 6 `references/*.md` rule files. A repo-root `install.sh` deploys the skill in 3 modes (global symlink / per-project copy+pointer / starter-pack copy). `examples/` is a runnable mini Playwright TS repo proving the rules. `starter-pack/` provides machine enforcement (ESLint, playwright.config, git-hooks, CI, tsconfig).

**Tech Stack:** Markdown (skill + rules), Bash (install.sh + tests), TypeScript + Playwright + @playwright/test + @axe-core/playwright (examples), ESLint + eslint-plugin-playwright + husky/lint-staged (starter-pack), GitHub Actions (CI), k6 (perf reference only).

**Language:** All files, comments, and prose are in **English**.

**Authoritative content source:** The design spec at `docs/superpowers/specs/2026-06-16-qc-automation-rules-design.md`. For the markdown rule files (Tasks 4–9), §6 of the spec enumerates the exact rules each file must contain; this plan restates the per-file rule list and required structure so the engineer needs no cross-referencing for code, but defers long prose wording to the writer.

---

## File Structure

```
agent-rules/
├── README.md                         # Task 15 — detailed step-by-step guide (8 sections)
├── CHANGELOG.md                      # Task 1
├── install.sh                        # Task 2 — --global | --project | --starter
├── test/install.test.sh             # Task 2 — bash test harness for install.sh
├── qc-automation/
│   ├── SKILL.md                      # Task 3
│   └── references/
│       ├── code-structure.md         # Task 4
│       ├── test-design.md            # Task 5
│       ├── reporting.md              # Task 6
│       ├── process-gates.md          # Task 7
│       ├── visual-a11y.md            # Task 8
│       └── performance.md            # Task 9
│   ├── examples/                     # Task 10 — runnable mini TS repo
│   │   ├── package.json
│   │   ├── playwright.config.ts
│   │   ├── tsconfig.json
│   │   ├── pages/login.page.ts
│   │   ├── tests/web-login.spec.ts
│   │   ├── tests/api-users.spec.ts
│   │   ├── tests/visual-home.spec.ts
│   │   └── tests/a11y-home.spec.ts
│   └── starter-pack/                 # Tasks 11–14
│       ├── eslint/.eslintrc.cjs
│       ├── playwright/playwright.config.ts
│       ├── git-hooks/pre-commit
│       ├── git-hooks/setup.sh
│       ├── ci/qc.yml
│       └── tsconfig/tsconfig.json
└── docs/superpowers/{specs,plans}/   # already present
```

Each file has one responsibility. Reference files are split by rule domain so Claude loads only what it needs (progressive disclosure).

---

## Task 1: Repo scaffold (CHANGELOG, dir skeleton)

**Files:**
- Create: `CHANGELOG.md`
- Create: `qc-automation/references/.gitkeep`, `qc-automation/examples/.gitkeep`, `qc-automation/starter-pack/.gitkeep`

- [ ] **Step 1: Create CHANGELOG.md**

```markdown
# Changelog

All notable changes to `agent-rules` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `qc-automation` rule set: SKILL.md gate, 6 reference rule files, runnable examples, Phase-2 starter-pack, and `install.sh` (global/project/starter modes).
```

- [ ] **Step 2: Create the directory skeleton**

Run:
```bash
mkdir -p qc-automation/references qc-automation/examples/{pages,tests} \
  qc-automation/starter-pack/{eslint,playwright,git-hooks,ci,tsconfig} test
touch qc-automation/references/.gitkeep
```
Expected: directories exist; `ls qc-automation` shows `references examples starter-pack`.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md qc-automation
git commit -m "chore: scaffold agent-rules repo + qc-automation skeleton"
```

---

## Task 2: `install.sh` + test harness (TDD)

**Files:**
- Create: `test/install.test.sh`
- Create: `install.sh`

`install.sh` contract:
- `--global` → symlink absolute `qc-automation/` to `~/.claude/skills/qc-automation` (force-replace existing symlink; refuse if a non-symlink dir exists).
- `--project <path>` → copy `qc-automation/` to `<path>/.claude/skills/qc-automation`; idempotently ensure the pointer line exists in `<path>/CLAUDE.md`.
- `--starter <path>` → copy contents of `qc-automation/starter-pack/` to `<path>/` (no overwrite without `--force`).
- Unknown/empty args → print usage to stderr, exit 2.
- Pointer line (exact): `When writing/editing test automation, you MUST use the \`qc-automation\` skill.`

- [ ] **Step 1: Write the failing test harness**

Create `test/install.test.sh`:
```bash
#!/usr/bin/env bash
# Minimal assertion harness for install.sh — no external deps.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "ok - $1"; }
no()   { FAIL=$((FAIL+1)); echo "NOT OK - $1"; }
check(){ if eval "$2"; then ok "$1"; else no "$1"; fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export HOME="$TMP/home"; mkdir -p "$HOME"

# usage on bad args
"$ROOT/install.sh" >/dev/null 2>&1; check "no args exits non-zero" "[ $? -ne 0 ]"

# --project copies skill + injects pointer, idempotently
PROJ="$TMP/proj"; mkdir -p "$PROJ"
"$ROOT/install.sh" --project "$PROJ" >/dev/null 2>&1
check "project: skill copied"        "[ -f '$PROJ/.claude/skills/qc-automation/SKILL.md' ]"
check "project: CLAUDE.md created"   "[ -f '$PROJ/CLAUDE.md' ]"
check "project: pointer present"     "grep -q 'qc-automation' '$PROJ/CLAUDE.md'"
"$ROOT/install.sh" --project "$PROJ" >/dev/null 2>&1
COUNT=$(grep -c 'MUST use the' "$PROJ/CLAUDE.md")
check "project: pointer not duplicated" "[ '$COUNT' -eq 1 ]"

# --global creates symlink under fake HOME
"$ROOT/install.sh" --global >/dev/null 2>&1
check "global: symlink exists" "[ -L '$HOME/.claude/skills/qc-automation' ]"

# --starter copies starter-pack files
TREPO="$TMP/trepo"; mkdir -p "$TREPO"
"$ROOT/install.sh" --starter "$TREPO" >/dev/null 2>&1
check "starter: eslintrc copied" "[ -f '$TREPO/eslint/.eslintrc.cjs' ]"

echo "----"; echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bash test/install.test.sh`
Expected: FAIL — `install.sh` does not exist yet (errors / `FAIL>0`).

- [ ] **Step 3: Write `install.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SRC="$SCRIPT_DIR/qc-automation"
SKILL_NAME="qc-automation"
POINTER='When writing/editing test automation, you MUST use the `qc-automation` skill.'

usage() {
  cat >&2 <<EOF
Usage: install.sh <mode> [path]
  --global              Symlink the skill into ~/.claude/skills/$SKILL_NAME
  --project <path>      Copy the skill into <path>/.claude/skills/$SKILL_NAME and
                        add a pointer line to <path>/CLAUDE.md
  --starter <path>      Copy starter-pack/* into <path> (use --force to overwrite)
EOF
  exit 2
}

install_global() {
  local dest="$HOME/.claude/skills/$SKILL_NAME"
  mkdir -p "$HOME/.claude/skills"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "Refusing: $dest exists and is not a symlink. Remove it first." >&2; exit 1
  fi
  ln -sfn "$SKILL_SRC" "$dest"
  echo "Linked $dest -> $SKILL_SRC"
  echo "Verify: ls -l '$dest' ; then open Claude Code and ask it to write a Playwright test."
}

install_project() {
  local path="${1:-}"; [ -n "$path" ] || usage
  local dest="$path/.claude/skills/$SKILL_NAME"
  mkdir -p "$path/.claude/skills"
  rm -rf "$dest"
  cp -R "$SKILL_SRC" "$dest"
  local claudemd="$path/CLAUDE.md"
  touch "$claudemd"
  if ! grep -qF 'qc-automation` skill' "$claudemd"; then
    printf '\n%s\n' "$POINTER" >> "$claudemd"
  fi
  echo "Installed skill to $dest and ensured pointer in $claudemd"
  echo "Next: commit .claude/ and CLAUDE.md into your test repo so the team gets it."
}

install_starter() {
  local path="${1:-}"; [ -n "$path" ] || usage
  local force="${2:-}"
  mkdir -p "$path"
  local copy_args=(-R)
  [ "$force" = "--force" ] || copy_args+=(-n)
  cp "${copy_args[@]}" "$SKILL_SRC/starter-pack/." "$path/" 2>/dev/null || \
    cp -R "$SKILL_SRC/starter-pack/." "$path/"
  echo "Copied starter-pack into $path"
  echo "Next: npm i -D eslint eslint-plugin-playwright @typescript-eslint/eslint-plugin husky lint-staged ; npx husky init ; enable ci/qc.yml"
}

case "${1:-}" in
  --global)  install_global ;;
  --project) install_project "${2:-}" ;;
  --starter) install_starter "${2:-}" "${3:-}" ;;
  *)         usage ;;
esac
```

- [ ] **Step 4: Make scripts executable and run the test to verify it passes**

Run:
```bash
chmod +x install.sh test/install.test.sh
bash test/install.test.sh
```
Expected: all `ok` lines, final `PASS=7 FAIL=0`, exit 0.
Note: the `--starter` assertion depends on `starter-pack/eslint/.eslintrc.cjs` existing (Task 11). Until then that one line prints `NOT OK`. Either run Task 2 after Task 11, or temporarily create an empty `qc-automation/starter-pack/eslint/.eslintrc.cjs` placeholder and delete it later. Recommended: keep the `.gitkeep` from Task 1 and accept that single failing assertion until Task 11, then re-run.

- [ ] **Step 5: Commit**

```bash
git add install.sh test/install.test.sh
git commit -m "feat: install.sh with global/project/starter modes + bash tests"
```

---

## Task 3: `qc-automation/SKILL.md`

**Files:**
- Create: `qc-automation/SKILL.md`

Required structure (see spec §5):

- [ ] **Step 1: Write SKILL.md**

```markdown
---
name: qc-automation
description: Use when writing, editing, reviewing, or setting up automated tests — Playwright web E2E, API tests (supertest/axios), mobile (WebdriverIO/Appium), visual regression, accessibility (axe), or k6 performance. Enforces the QC automation rule set with a mandatory self-review gate.
---

# QC Automation Rules

You are writing test automation. These rules are mandatory. Follow the checklist
in order and DO NOT report a task complete until the self-review gate passes.

## Mandatory checklist (create a TodoWrite item per step)

1. **Scope** — identify test type (web / API / mobile / visual / a11y / perf) and
   tier (`@smoke` / `@regression`), and map a test-ID to the requirement under test.
2. **Code** — follow `references/code-structure.md`.
3. **Case design** — follow `references/test-design.md` (negative cases are required, not optional).
4. **Reporting** — ensure trace/screenshot/video-on-fail are enabled; follow `references/reporting.md`.
5. **Self-review gate (run before reporting done).**

## Self-review gate — answer every question; any "no/yes-bad" → go back and fix

- [ ] No hard waits (`waitForTimeout`, `sleep`, fixed delays)?
- [ ] Web-first assertions only — no `expect(await locator.isVisible()).toBe(true)`?
- [ ] Test is atomic and independent (passes alone, in parallel, and shuffled)?
- [ ] At least one negative/error case for the feature?
- [ ] Evidence captured on failure (trace/screenshot/video or request-response log)?
- [ ] Test-ID mapped to a requirement?
- [ ] No hardcoded secrets; selectors follow priority (role → label → placeholder → text → testid → CSS; no XPath)?

If any box is unchecked, you have NOT finished. Fix and re-run the gate.

## Routing — read only what you need

| Working on...                  | Read |
|--------------------------------|------|
| Framework structure, locators, config, fixtures, network mocking | `references/code-structure.md` |
| What/how to assert, case design, negative tests, data | `references/test-design.md` |
| Reports, evidence, flaky tracking, traceability | `references/reporting.md` |
| PR checklist, DoD, CI gating, naming, randomization | `references/process-gates.md` |
| Visual regression and accessibility | `references/visual-a11y.md` |
| k6 performance tests | `references/performance.md` |

## Red flags — these thoughts mean STOP

| Thought | Reality |
|---------|---------|
| "This test is small, independence doesn't matter" | Every test must pass alone and shuffled. |
| "A short sleep fixes the flake" | Hard waits are banned. Use web-first assertions. |
| "I'll add the negative case later" | Negative cases ship with the feature, not later. |
| "XPath is fine here" | Use the locator priority list. XPath is banned. |
| "It passed once, it's done" | DoD = 3 consecutive local passes + evidence + test-ID. |
```

- [ ] **Step 2: Verify front-matter and links**

Run:
```bash
head -4 qc-automation/SKILL.md | grep -q 'name: qc-automation' && echo NAME_OK
for f in code-structure test-design reporting process-gates visual-a11y performance; do
  grep -q "references/$f.md" qc-automation/SKILL.md || echo "MISSING ROUTE: $f";
done; echo ROUTES_CHECKED
```
Expected: `NAME_OK` and `ROUTES_CHECKED` with no `MISSING ROUTE` lines.

- [ ] **Step 3: Commit**

```bash
git add qc-automation/SKILL.md
git commit -m "feat: qc-automation SKILL.md gate, routing, red-flags"
```

---

## Tasks 4–9: Reference rule files

Each reference file uses the same shape: **for each rule → a one-line principle, a one-line _why_, and a minimal correct-vs-incorrect TS snippet; show the Playwright / API / Appium-WDIO variant where they differ.** Keep snippets minimal (≤15 lines). The exact rule list per file is below; write the prose and snippets to cover every bullet.

Per-file verification (same for Tasks 4–9): the file exists, is non-trivial, and contains a fenced `ts` code block.
```bash
test -s qc-automation/references/<file>.md && grep -q '```ts' qc-automation/references/<file>.md && echo FILE_OK
```

### Task 4: `references/code-structure.md`

**Files:** Create `qc-automation/references/code-structure.md`

- [ ] **Step 1: Write the file** covering exactly these rules (spec §6.1):
  - POM with a `BasePage` abstract class; API service-client layer; mobile screen-objects. No test logic (no `expect`) inside page/screen objects.
  - Ban hard waits (`page.waitForTimeout`, `browser.pause`, `sleep`). Use web-first assertions / explicit conditional waits (`expect(locator).toBeVisible()`, `waitForResponse`).
  - Locator priority: `getByRole → getByLabel → getByPlaceholder → getByText → getByTestId → CSS`; no XPath, no index-based; show chaining + `.filter({ hasText })`.
  - Network interception with `page.route()` to mock third parties and guarantee responses.
  - Auth `storageState` reuse via a fixture; no re-login per test.
  - Config/env via `process.env` / `.env`; no hardcoded secrets. Standard `playwright.config` knobs: `retries`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, multi-browser `projects`.
  - API: reusable request/response spec builder; JSON schema validation (e.g. `ajv`/`zod`) for contract testing.
  - Idempotent setup/teardown; never depend on run order.
- [ ] **Step 2: Verify** with the per-file command above (`<file>=code-structure`). Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git add qc-automation/references/code-structure.md && git commit -m "docs: code-structure rules"`

### Task 5: `references/test-design.md`

**Files:** Create `qc-automation/references/test-design.md`

- [ ] **Step 1: Write the file** covering (spec §6.2):
  - Philosophy first: test user-visible behavior, not implementation detail.
  - 1 test = 1 behavior; atomic & independent (alone / parallel / shuffled all pass).
  - AAA / Given-When-Then; test name = behavior + expected result.
  - Mandatory web-first retry-able assertions; forbid `expect(await locator.isVisible()).toBe(true)`; use `expect.soft()` for multiple asserts.
  - Mandatory negative testing: validation, missing field, wrong format, unauthorized — show one example.
  - Data-driven via parametrize loops; self-created + self-cleaned data; never rely on pre-existing env data.
  - Tiers `@smoke` / `@regression`; test-ID mapped to requirement.
  - Meaningful assertions; no duplicate/over-broad asserts; no try/catch swallowing errors.
- [ ] **Step 2: Verify** (`<file>=test-design`). Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git commit -am "docs: test-design rules"`

### Task 6: `references/reporting.md`

**Files:** Create `qc-automation/references/reporting.md`

- [ ] **Step 1: Write the file** covering (spec §6.3):
  - Standard reports: Playwright HTML reporter + optional Allure for aggregation; config snippet.
  - Mandatory on-fail evidence: trace + screenshot + video (web); screen recording + page source (mobile); request-response log (API).
  - Flaky tracking: mark + quarantine; never allow false-green CI.
  - Traceability matrix: test-ID ↔ requirement ↔ result; report pass/fail/skip with explicit skip reason.
- [ ] **Step 2: Verify** (`<file>=reporting`). Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git commit -am "docs: reporting rules"`

### Task 7: `references/process-gates.md`

**Files:** Create `qc-automation/references/process-gates.md`

- [ ] **Step 1: Write the file** covering (spec §6.4):
  - PR review checklist for tests (mirror the SKILL self-review gate).
  - Definition-of-Done for one test: 3 consecutive local passes, evidence, tag/test-ID, no hard-wait.
  - Commit convention; flaky-quarantine policy.
  - CI gating order: lint → typecheck → test (parallel + `--shard`) → report; upload trace/report artifacts.
  - Test randomization (shuffle order) + per-test timeout.
  - File/spec naming convention; test directory structure.
- [ ] **Step 2: Verify** (`<file>=process-gates`). Note: this file may have a `bash`/`yaml` block rather than `ts`; adjust the verify to `grep -q '```'`. Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git commit -am "docs: process & quality-gate rules"`

### Task 8: `references/visual-a11y.md`

**Files:** Create `qc-automation/references/visual-a11y.md`

- [ ] **Step 1: Write the file** covering (spec §6.5):
  - Visual: `toHaveScreenshot()` default; baselines committed + diff-reviewed; mask dynamic regions; pin viewport + device scale; disable animation/caret; wait for stable state (fonts/network idle); intentional `maxDiffPixels`/threshold; baselines split per OS/browser, captured in Docker/CI.
  - A11y: `@axe-core/playwright` in main flows; mobile uses accessibility id as selector; severity gate (`critical`/`serious` fail, `moderate`/`minor` track); manual keyboard nav / focus order / ARIA checks; a11y assertions carry test-ID mapped to WCAG.
- [ ] **Step 2: Verify** (`<file>=visual-a11y`). Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git commit -am "docs: visual regression + accessibility rules"`

### Task 9: `references/performance.md`

**Files:** Create `qc-automation/references/performance.md`

- [ ] **Step 1: Write the file** covering (spec §6.6):
  - k6 in TS; 5 types: smoke (1 VU) / load (ramp→100) / stress (ramp→400) / spike (jump→500) / soak (50 VU sustained), each with purpose.
  - Pass/fail via thresholds in code: `http_req_duration: ['p(95)<500']`, `http_req_failed: ['rate<0.01']`; scenario-based + per-scenario thresholds; custom metrics (Trend/Rate/Counter/Gauge).
  - CI runs smoke perf only; large perf in dedicated pre-release env; thresholds WARN not auto-block deploy; cadence 2–3×/week in staging; never stress-test production.
  - Realistic data/ramp profiles; warn against perf-testing shared environments.
- [ ] **Step 2: Verify** (`<file>=performance`). Expected: `FILE_OK`.
- [ ] **Step 3: Commit** — `git commit -am "docs: k6 performance rules"`

---

## Task 10: Runnable `examples/` mini repo (TDD via real run)

**Files:**
- Create: `qc-automation/examples/package.json`, `playwright.config.ts`, `tsconfig.json`
- Create: `qc-automation/examples/pages/login.page.ts`
- Create: `qc-automation/examples/tests/web-login.spec.ts`, `api-users.spec.ts`, `visual-home.spec.ts`, `a11y-home.spec.ts`

The examples must run offline against `page.route` mocks and Playwright's bundled test runner — no external network, no real app — so they prove the rules and pass in CI.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "qc-automation-examples",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.10.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["pages", "tests", "playwright.config.ts"]
}
```

- [ ] **Step 3: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 4: Write `pages/login.page.ts` (BasePage + LoginPage, no asserts)**

```ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}

export class LoginPage extends BasePage {
  private readonly user: Locator = this.page.getByLabel('Username');
  private readonly pass: Locator = this.page.getByLabel('Password');
  private readonly submit: Locator = this.page.getByRole('button', { name: 'Sign in' });

  async goto() { await this.page.goto('https://app.test/login'); }
  async login(u: string, p: string) {
    await this.user.fill(u);
    await this.pass.fill(p);
    await this.submit.click();
  }
}
```

- [ ] **Step 5: Write `tests/web-login.spec.ts` (POM + network mock + web-first asserts + negative case)**

```ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

// QC-LOGIN-001: user-visible login behavior, mocked backend (no external dep)
test.beforeEach(async ({ page }) => {
  await page.route('**/login', (route) =>
    route.fulfill({ contentType: 'text/html',
      body: `<form><label>Username<input></label><label>Password<input type=password></label>
             <button>Sign in</button><div role="status" id="msg"></div></form>
             <script>document.querySelector('button').onclick=(e)=>{e.preventDefault();
             const u=document.querySelectorAll('input')[0].value;
             document.getElementById('msg').textContent=u==='admin'?'Welcome admin':'Invalid credentials';}</script>` }));
});

test('@smoke valid credentials show welcome', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('admin', 'pw');
  await expect(page.getByRole('status')).toHaveText('Welcome admin');
});

test('@regression invalid credentials show error', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('nobody', 'bad');
  await expect(page.getByRole('status')).toHaveText('Invalid credentials');
});
```

- [ ] **Step 6: Write `tests/api-users.spec.ts` (request fixture + schema validation + negative case)**

```ts
import { test, expect } from '@playwright/test';

// QC-API-001: contract + negative, mocked via route on the APIRequestContext page
test('@smoke GET /users returns a typed list', async ({ page }) => {
  await page.route('**/api/users', (r) =>
    r.fulfill({ json: [{ id: 1, name: 'Ada' }] }));
  const res = await page.request.get('https://app.test/api/users');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body[0]).toMatchObject({ id: expect.any(Number), name: expect.any(String) });
});

test('@regression GET /users/999 returns 404', async ({ page }) => {
  await page.route('**/api/users/999', (r) => r.fulfill({ status: 404, json: { error: 'not found' } }));
  const res = await page.request.get('https://app.test/api/users/999');
  expect(res.status()).toBe(404);
});
```

- [ ] **Step 7: Write `tests/visual-home.spec.ts` (masked, animation-disabled snapshot)**

```ts
import { test, expect } from '@playwright/test';

test('@regression home renders stable snapshot', async ({ page }) => {
  await page.route('**/home', (r) =>
    r.fulfill({ contentType: 'text/html',
      body: `<style>*{animation:none!important;caret-color:transparent}</style>
             <h1>Dashboard</h1><span data-dyn>2026-06-16 12:00</span>` }));
  await page.goto('https://app.test/home');
  await expect(page).toHaveScreenshot('home.png', {
    mask: [page.locator('[data-dyn]')],
    maxDiffPixels: 50,
  });
});
```
Note: first run creates the baseline (`--update-snapshots`); commit the generated PNG. In CI use `--update-snapshots=none`.

- [ ] **Step 8: Write `tests/a11y-home.spec.ts` (axe scan, severity gate)**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@regression home has no critical/serious a11y violations', async ({ page }) => {
  await page.route('**/home', (r) =>
    r.fulfill({ contentType: 'text/html',
      body: `<main><h1>Dashboard</h1><button aria-label="Refresh">↻</button></main>` }));
  await page.goto('https://app.test/home');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact ?? ''));
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
```

- [ ] **Step 9: Install and run the example suite**

Run:
```bash
cd qc-automation/examples
npm install
npx playwright install chromium
npx playwright test --update-snapshots
```
Expected: all 5 tests PASS (baseline PNG generated on first visual run).

- [ ] **Step 10: Add an examples `.gitignore` and commit**

Run:
```bash
printf 'node_modules/\nplaywright-report/\ntest-results/\n' > qc-automation/examples/.gitignore
cd ../.. && git add qc-automation/examples
git commit -m "feat: runnable examples (web/api/visual/a11y) proving the rules"
```
Note: keep the generated `tests/web-login.spec.ts-snapshots/` and `visual-home` baseline PNG (do not ignore snapshot dirs).

---

## Task 11: starter-pack ESLint config

**Files:** Create `qc-automation/starter-pack/eslint/.eslintrc.cjs`

- [ ] **Step 1: Write `.eslintrc.cjs`**

```js
/* QC automation lint rules — drop into a test repo's root or extend it. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/no-wait-for-timeout': 'error',
    'playwright/no-element-handle': 'error',
    'playwright/valid-expect': 'error',
    'playwright/no-focused-test': 'error',
    'playwright/no-skipped-test': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    // ban XPath locators and hardcoded-looking secrets
    'no-restricted-syntax': [
      'error',
      { selector: "CallExpression[callee.property.name='locator'][arguments.0.value=/^xpath=|^\\/\\//]",
        message: 'XPath locators are banned — use role/label/testid.' },
    ],
  },
};
```

- [ ] **Step 2: Verify it is valid JS**

Run: `node --check qc-automation/starter-pack/eslint/.eslintrc.cjs && echo ESLINT_CFG_OK`
Expected: `ESLINT_CFG_OK`.

- [ ] **Step 3: Commit** — `git add qc-automation/starter-pack/eslint && git commit -m "feat: starter-pack eslint rules"`

---

## Task 12: starter-pack playwright.config + tsconfig

**Files:**
- Create: `qc-automation/starter-pack/playwright/playwright.config.ts`
- Create: `qc-automation/starter-pack/tsconfig/tsconfig.json`

- [ ] **Step 1: Write `playwright/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

// Standard QC config — retries, trace/screenshot/video on fail, multi-browser, sharding-ready.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: [['html', { open: 'never' }], ['list'], ['junit', { outputFile: 'results.xml' }]],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

- [ ] **Step 2: Write `tsconfig/tsconfig.json`** (same strict base as Task 10 Step 2).

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["pages", "tests", "playwright.config.ts"]
}
```

- [ ] **Step 3: Verify**

Run: `node --check qc-automation/starter-pack/tsconfig/tsconfig.json 2>/dev/null; python3 -c "import json;json.load(open('qc-automation/starter-pack/tsconfig/tsconfig.json'))" && echo TSCONFIG_OK`
Expected: `TSCONFIG_OK`.

- [ ] **Step 4: Commit** — `git add qc-automation/starter-pack/{playwright,tsconfig} && git commit -m "feat: starter-pack playwright config + tsconfig"`

---

## Task 13: starter-pack git hooks

**Files:**
- Create: `qc-automation/starter-pack/git-hooks/pre-commit`
- Create: `qc-automation/starter-pack/git-hooks/setup.sh`

- [ ] **Step 1: Write `pre-commit`**

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "[qc pre-commit] eslint + typecheck + changed tests"
npx eslint . --max-warnings=0
npx tsc --noEmit
# run only tests touched in this commit, if any
CHANGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.spec\.ts$' || true)
if [ -n "$CHANGED" ]; then npx playwright test $CHANGED; fi
```

- [ ] **Step 2: Write `setup.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail
# Install husky and register the QC pre-commit hook in the current repo.
npx husky init
cp "$(dirname "$0")/pre-commit" .husky/pre-commit
chmod +x .husky/pre-commit
echo "Husky pre-commit installed. Pre-push smoke: add 'npx playwright test --grep @smoke' to .husky/pre-push."
```

- [ ] **Step 3: Verify both are valid bash**

Run: `bash -n qc-automation/starter-pack/git-hooks/pre-commit && bash -n qc-automation/starter-pack/git-hooks/setup.sh && echo HOOKS_OK`
Expected: `HOOKS_OK`.

- [ ] **Step 4: Commit** — `git add qc-automation/starter-pack/git-hooks && git commit -m "feat: starter-pack git hooks"`

---

## Task 14: starter-pack CI workflow

**Files:** Create `qc-automation/starter-pack/ci/qc.yml`

- [ ] **Step 1: Write `ci/qc.yml`**

```yaml
name: QC Automation
on:
  pull_request:
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx eslint . --max-warnings=0
      - run: npx tsc --noEmit
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}/2
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 7

  smoke-perf:
    runs-on: ubuntu-latest
    continue-on-error: true   # perf thresholds WARN, do not block deploy
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1
      - run: k6 run perf/smoke.js
```

- [ ] **Step 2: Verify YAML parses**

Run: `python3 -c "import yaml,sys;yaml.safe_load(open('qc-automation/starter-pack/ci/qc.yml'))" && echo CI_YAML_OK`
Expected: `CI_YAML_OK`. (If PyYAML is missing: `pip install pyyaml` or skip — visually confirm indentation.)

- [ ] **Step 3: Commit** — `git add qc-automation/starter-pack/ci && git commit -m "feat: starter-pack CI workflow"`

- [ ] **Step 4: Re-run install.sh tests now that starter-pack exists**

Run: `bash test/install.test.sh`
Expected: `PASS=7 FAIL=0` (the previously-failing `--starter` assertion now passes).

---

## Task 15: Detailed `README.md`

**Files:** Create `README.md`

- [ ] **Step 1: Write README** with the 8 required sections from spec §8. Every install step must be a copy-paste command block with an "Expected" result. Minimum content:

````markdown
# agent-rules

Shared, versioned **agent rule sets** for Claude Code. One folder per purpose.

## Rule sets

| Folder | Purpose | Status |
|--------|---------|--------|
| `qc-automation` | Rules Claude follows when writing TS test automation (Playwright/API/mobile/visual/a11y/k6) | Active |

## 1. Prerequisites

```bash
node -v   # >= 20
git --version
# Claude Code installed (CLI, desktop, or IDE extension)
```

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
npm i -D eslint eslint-plugin-playwright @typescript-eslint/parser @typescript-eslint/eslint-plugin husky lint-staged
bash eslint/../git-hooks/setup.sh   # or: bash git-hooks/setup.sh
```
Copies `eslint/`, `playwright/`, `git-hooks/`, `ci/`, `tsconfig/`. Then enable `ci/qc.yml` by moving it to `.github/workflows/`.

## 5. Usage after install

Ask Claude (with the skill installed): *"Write a Playwright test for the checkout flow."* Claude builds a TodoWrite from the skill checklist and must pass the self-review gate before reporting done.

## 6. Update / re-sync

```bash
cd agent-rules && git pull
./install.sh --global        # symlink: nothing more needed
./install.sh --project /path/to/your-test-repo   # copy: re-run to re-sync
```

## 7. Uninstall

```bash
rm ~/.claude/skills/qc-automation                 # global (symlink)
rm -rf /path/to/repo/.claude/skills/qc-automation # per-project
```

## 8. Troubleshooting

- **Skill not triggering** — confirm the symlink/folder exists and the `CLAUDE.md` pointer line is present.
- **`install.sh: Permission denied`** — `chmod +x install.sh`.
- **Duplicate pointer in CLAUDE.md** — the installer is idempotent; remove extra lines manually if hand-edited.
- **Lint fails after starter-pack** — install the devDependencies listed in §4.

## Contributing / adding a rule set

Create a new top-level folder with a `SKILL.md` at its root (skill name = folder name). Update the table above and `CHANGELOG.md`.
````

- [ ] **Step 2: Verify all 8 sections present**

Run:
```bash
for s in Prerequisites "Global" "Per-project" "Starter-pack" "Usage" "Update" "Uninstall" "Troubleshooting"; do
  grep -qi "$s" README.md || echo "MISSING SECTION: $s"; done; echo README_CHECKED
```
Expected: `README_CHECKED` with no `MISSING SECTION` lines.

- [ ] **Step 3: Commit** — `git add README.md && git commit -m "docs: detailed step-by-step README"`

---

## Task 16: Final integration check + push

- [ ] **Step 1: Run the full install test suite**

Run: `bash test/install.test.sh`
Expected: `PASS=7 FAIL=0`.

- [ ] **Step 2: Re-run the example suite**

Run: `cd qc-automation/examples && npm test && cd ../..`
Expected: 5 tests PASS.

- [ ] **Step 3: Smoke-install globally and confirm the skill resolves**

Run: `./install.sh --global && ls -l ~/.claude/skills/qc-automation`
Expected: symlink printed, target = repo `qc-automation`.

- [ ] **Step 4: Update CHANGELOG (move Unreleased → dated) and push**

```bash
git add -A
git commit -m "chore: finalize qc-automation rule set"
git push
```
Expected: pushed to `origin/master` on https://github.com/hvtuan/agent-rules.

---

## Self-Review (completed by plan author)

- **Spec coverage:** §2 consumer/usage → Task 2 (install modes) + README §2–4. §3 enforcement phases → Task 3 (gate) + Tasks 11–14 (starter-pack). §4 layout → Tasks 1–15. §5 SKILL.md → Task 3. §6.1–6.6 references → Tasks 4–9. §7 starter-pack → Tasks 11–14. §8 install/examples/README → Tasks 2, 10, 15. All sections mapped.
- **Placeholder scan:** No TBD/TODO; every code artifact (install.sh, configs, example specs, CI) has complete content. Markdown rule files carry an explicit rule checklist per file (content is enumerated, prose is written by the implementer — acceptable for documentation deliverables).
- **Type consistency:** `BasePage`/`LoginPage` defined in Task 10 Step 4 and used in Step 5; pointer string identical in install.sh (Task 2) and test (Task 2) and README (Task 15); skill name `qc-automation` consistent across SKILL.md front-matter, install.sh, and routing.
- **Known ordering note:** Task 2's `--starter` assertion depends on Task 11's file; surfaced in Task 2 Step 4 and re-verified in Task 14 Step 4.
```
