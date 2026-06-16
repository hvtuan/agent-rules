# Reporting Rules

How test runs report results and evidence: reporters, on-fail artifacts, flaky tracking, traceability.

## Standard reporters

**Principle:** Use the built-in Playwright HTML reporter. Add Allure for cross-run/cross-suite aggregation when multiple test types or teams report together.
**Why:** HTML gives rich per-run detail; Allure aggregates history, trends, and traceability across suites.

```ts
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html', { open: 'never' }],
    ['allure-playwright'],
    ['list'],
  ],
});
```

## Mandatory on-fail evidence

**Principle:** Every failure captures evidence automatically — never debug from a bare stack trace.
- **Web:** trace + screenshot + video.
- **Mobile:** screen recording + page source dump.
- **API:** full request/response log (method, URL, headers, body, status).
**Why:** Failures in CI are often non-reproducible locally; evidence is the only way to diagnose them.

```ts
// web — config knobs (see code-structure.md)
use: { trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure' }
```

```ts
// mobile (WDIO) — attach page source + recording on failure
afterTest: async (test, ctx, { passed }) => {
  if (!passed) await driver.saveRecordingScreen(`./artifacts/${test.title}.mp4`);
  if (!passed) attach(await driver.getPageSource(), 'text/xml');
}
```

```ts
// API — log request+response on failure
if (!res.ok()) attach(JSON.stringify({ req: body, status: res.status(), res: await res.text() }), 'application/json');
```

## Flaky tracking: mark + quarantine

**Principle:** Track flaky tests explicitly. Mark them, move them to a quarantine lane that does not gate the build, and fix or delete them. Never let a flaky test silently retry into green. To fix one, find the root cause with `superpowers:systematic-debugging` — a retry that passes is not a fix.
**Why:** A retried flake that passes hides a real intermittent defect and erodes trust in CI ("false green").

```ts
test('TC-205 payment webhook ordering', { tag: '@quarantine' }, async () => { /* ... */ });
// CI: main job runs --grep-invert @quarantine; a separate non-gating job tracks @quarantine.
```

## Traceability matrix

**Principle:** Maintain a matrix linking test-ID ↔ requirement ↔ result. Report every test as pass / fail / skip, and every skip carries an explicit reason.
**Why:** Stakeholders need to know which requirements are verified; an unexplained skip is an untracked coverage gap.

```ts
test.skip(!process.env.STRIPE_KEY, 'SKIP: Stripe key not provisioned in this env');
```

| Test-ID | Requirement | Result | Note |
|---------|-------------|--------|------|
| TC-101  | REQ-CHK-01 checkout | pass | |
| TC-205  | REQ-PAY-04 webhook  | quarantined | flaky, ticket QA-88 |
| TC-310  | REQ-PAY-09 refund   | skip | SKIP: refund API not deployed to staging |
