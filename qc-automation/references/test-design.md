# Test Design Rules

How to choose and shape what a test verifies: scope, structure, assertions, negative cases, data.

## Test behavior, not implementation

**Principle:** Assert user-visible behavior and outcomes, not internal state, private methods, or DOM structure.
**Why:** Behavior tests survive refactors; implementation tests break on every harmless change and miss real regressions.

```ts
// BAD — internal detail
expect(component.state.isOpen).toBe(true);
// GOOD — what the user sees
await expect(page.getByRole('dialog')).toBeVisible();
```

## One test = one behavior; atomic & independent

**Principle:** Each test verifies a single behavior and must pass alone, in parallel, and shuffled.
**Why:** Multi-behavior tests are hard to diagnose; order-dependent tests fail under sharding and retries.

## AAA / Given-When-Then; name = behavior + expected result

**Principle:** Structure tests as Arrange-Act-Assert (or Given-When-Then). The name states behavior and expected result.
**Why:** A readable name and structure make failures self-explanatory.

```ts
test('submitting an empty cart shows the "cart is empty" error', async ({ page }) => {
  // Arrange
  await cartPage.goto();
  // Act
  await cartPage.checkout();
  // Assert
  await expect(page.getByRole('alert')).toHaveText('Your cart is empty');
});
```

## Mandatory retry-able assertions

**Principle:** Use auto-retrying web-first assertions. FORBID `expect(await locator.isVisible()).toBe(true)`. Use `expect.soft()` when checking several independent things.
**Why:** `isVisible()` reads one instant with no retry — inherently racy. Soft assertions report all failures in one run.

```ts
// BAD
expect(await page.getByText('OK').isVisible()).toBe(true);
// GOOD
await expect(page.getByText('OK')).toBeVisible();
await expect.soft(row).toContainText('Paid');
await expect.soft(row.getByRole('button', { name: 'Refund' })).toBeEnabled();
```

## Negative testing is mandatory

**Principle:** Every feature ships with negative cases: validation, missing field, wrong format, unauthorized.
**Why:** Most production defects live in error paths, which happy-path tests never touch.

```ts
test('rejects signup with malformed email', async ({ request }) => {
  const res = await request.post('/signup', { data: { email: 'not-an-email' } });
  expect(res.status()).toBe(422);
  expect((await res.json()).error).toContain('email');
});
```

## Data-driven; self-created & self-cleaned

**Principle:** Parametrize variations in a loop. Tests create their own data and clean it up. Never rely on pre-existing environment data.
**Why:** Pre-seeded data drifts and disappears; self-owned data makes tests portable and repeatable.

```ts
for (const { input, expected } of [
  { input: '', expected: 'required' },
  { input: 'ab', expected: 'too short' },
]) {
  test(`username "${input}" → ${expected}`, async ({ page }) => {
    await form.fillUsername(input);
    await expect(page.getByRole('alert')).toContainText(expected);
  });
}
```

## Tiers and test-ID mapping

**Principle:** Tag tests `@smoke` (fast critical path) or `@regression` (full coverage). Map each test to a requirement ID.
**Why:** Tiers let CI run the right subset; IDs give traceability from requirement to result.

```ts
test('TC-101 @smoke checkout completes with valid card', async () => { /* ... */ });
```

## Meaningful assertions only

**Principle:** Assert specific expected values. No duplicate or over-broad asserts (e.g. just "not null"). Never wrap a test body in try/catch that swallows the error.
**Why:** Weak or swallowed assertions produce false greens that hide real failures.

```ts
// BAD
try { await doThing(); } catch { /* ignored */ }
expect(result).toBeTruthy();
// GOOD
expect(result.status).toBe('confirmed');
expect(result.total).toBe(42.00);
```
