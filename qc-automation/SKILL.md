---
name: qc-automation
description: Use when writing, editing, reviewing, or setting up automated tests — Playwright web E2E, API tests (supertest/axios), mobile (WebdriverIO/Appium), visual regression, accessibility (axe), or k6 performance. Enforces the QC automation rule set with a mandatory self-review gate.
---

# QC Automation Rules

You are writing test automation. These rules are mandatory. Follow the checklist
in order and DO NOT report a task complete until the self-review gate passes.

> **New to automation (human reader)?** Start with `learn/onboarding.md`, then
> `learn/manual-to-auto.md`. When Claude writes a test for you, grade it with
> `learn/reviewing-ai-tests.md` before accepting it.

## Mandatory checklist (create a TodoWrite item per step)

1. **Scope** — identify test type (web / API / mobile / visual / a11y / perf) and
   tier (`@smoke` / `@regression`), and map a test-ID to the requirement under test.
2. **Code** — follow `references/code-structure.md`. When building framework code,
   fixtures, page objects, or helpers, write the failing test first: use
   `superpowers:test-driven-development` (RED → GREEN → REFACTOR).
3. **Case design** — follow `references/test-design.md` (negative cases are required, not optional).
4. **Reporting** — ensure trace/screenshot/video-on-fail are enabled; follow `references/reporting.md`.
5. **Self-review gate (run before reporting done)** — this gate IS the QC instance of
   `superpowers:verification-before-completion`: do not claim done until every box passes.

When a test is flaky or fails for a reason you can't immediately explain, STOP guessing
and use `superpowers:systematic-debugging` to find the root cause — never paper over it
with a retry or a wait (see `references/reporting.md` flaky policy).

## Self-review gate — answer every question; any "no/yes-bad" → go back and fix

- [ ] No hard waits (`waitForTimeout`, `sleep`, fixed delays)?
- [ ] Web-first assertions only — no `expect(await locator.isVisible()).toBe(true)`?
- [ ] Test is atomic and independent (passes alone, in parallel, and shuffled)?
- [ ] At least one negative/error case for the feature?
- [ ] Evidence captured on failure (trace/screenshot/video or request-response log)?
- [ ] Test-ID mapped to a requirement?
- [ ] No hardcoded secrets; selectors follow priority (role → label → placeholder → text → testid → CSS; no XPath)?

If any box is unchecked, you have NOT finished. Fix and re-run the gate.

## Composes with superpowers

These rules are the QC-specific layer; the superpowers skills supply the discipline.
Invoke them at the moments below (if installed — if not, apply the principle anyway).

| Moment | Skill |
|--------|-------|
| Building framework code, fixtures, page objects, helpers, or a new test from a requirement | `superpowers:test-driven-development` |
| A test is flaky or fails for an unclear reason | `superpowers:systematic-debugging` |
| Running the self-review gate before reporting done | `superpowers:verification-before-completion` |
| A meaningful slice of tests is finished | `superpowers:requesting-code-review` (then `superpowers:receiving-code-review` to act on feedback) |

## Routing — read only what you need

| Working on...                  | Read |
|--------------------------------|------|
| Learning automation from scratch (human on-ramp) | `learn/onboarding.md` |
| Translating a manual test case into automation | `learn/manual-to-auto.md` |
| Judging whether a generated test is any good | `learn/reviewing-ai-tests.md` |
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
