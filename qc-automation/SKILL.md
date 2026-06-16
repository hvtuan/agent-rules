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
