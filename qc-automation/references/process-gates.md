# Process & Quality-Gate Rules

How tests get reviewed, merged, and run in CI: PR checklist, DoD, commits, CI order, naming.

## PR review checklist for tests

**Principle:** Every test PR is reviewed against this list (mirrors the SKILL self-review gate).
**Why:** A consistent gate keeps flaky, order-dependent, or unmapped tests out of the suite.

- [ ] No hard waits (`waitForTimeout` / `pause` / `sleep`).
- [ ] Web-first assertions only; no `expect(await locator.isVisible()).toBe(true)`.
- [ ] Atomic & independent (passes alone, parallel, shuffled).
- [ ] At least one negative/error case.
- [ ] Evidence on failure enabled (trace/screenshot/video or request-response log).
- [ ] Test-ID mapped to a requirement; tagged `@smoke`/`@regression`.
- [ ] No hardcoded secrets; selectors follow priority, no XPath.

> Request review with `superpowers:requesting-code-review` once a slice of tests is done;
> act on the feedback with `superpowers:receiving-code-review`.

## Definition of Done (one test)

**Principle:** A test is "done" only when it: passes 3 consecutive local runs, captures evidence on failure, carries a tag + test-ID, and uses no hard waits. Confirming "done" is an instance of `superpowers:verification-before-completion` — verify, don't assume.
**Why:** One green run can be luck; 3 consecutive runs is the minimum bar against flakiness.

```bash
npx playwright test path/to/spec.ts --repeat-each=3 --workers=1
```

## Commit convention & flaky policy

**Principle:** Use Conventional Commits (`test:`, `fix:`, `docs:`). A test that flakes is quarantined within one working day — tagged `@quarantine`, removed from the gating lane, and ticketed; fixed or deleted, never left retrying. Fix it by finding the root cause with `superpowers:systematic-debugging`, not by adding retries.
**Why:** Readable history and a hard quarantine SLA prevent "false green" CI.

```bash
git commit -m "test: TC-101 checkout happy path"
git commit -m "fix: stabilize TC-205 by awaiting webhook response"
```

## CI gating order

**Principle:** Run stages in order: lint → typecheck → test (parallel + `--shard`) → report. Upload trace/report artifacts always (especially on failure).
**Why:** Fail fast on cheap checks before spending minutes on the test run; sharding keeps wall-clock low.

```yaml
jobs:
  test:
    strategy:
      matrix: { shard: [1, 2, 3, 4] }
    steps:
      - run: npm run lint
      - run: npm run typecheck
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ matrix.shard }}
          path: |
            playwright-report/
            test-results/
```

## Randomization & per-test timeout

**Principle:** Shuffle test/file order in CI and set an explicit per-test timeout. No test runs unbounded.
**Why:** Shuffling surfaces hidden order dependencies; a timeout caps hung tests so one failure doesn't stall the shard.

```ts
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  timeout: 30_000,        // per-test
  // Playwright randomizes across workers; for file order use a seed plugin or `--shuffle` in your runner.
});
```

## Naming & directory structure

**Principle:** Specs named `<feature>.<type>.spec.ts`. Group by domain, separate by test type, keep objects out of the test tree.
**Why:** Predictable layout makes specs discoverable and lets CI target a type/domain by path glob.

```bash
tests/
  e2e/checkout.e2e.spec.ts
  api/users.api.spec.ts
  visual/dashboard.visual.spec.ts
pages/         # page objects (web)
clients/       # service clients (API)
screens/       # screen objects (mobile)
fixtures/      # shared fixtures, storageState
```
