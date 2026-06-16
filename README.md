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
