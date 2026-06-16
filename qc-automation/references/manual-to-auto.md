# From Manual Test Cases to Automation

Everything you already do as a manual tester has a direct equivalent in automation.
You are not starting over — you're translating skills you already have.

Mọi thứ bạn đã làm khi test thủ công đều có "bản dịch" trong automation. Bạn không
học lại từ đầu — bạn đang dịch kỹ năng sẵn có.

---

## The translation table

| Manual test case | Automated test | Notes |
|------------------|----------------|-------|
| Test case ID / title | `test('TC-101 user can log in', ...)` | Keep your IDs — put them in the test name |
| Preconditions / setup | `beforeEach`, fixtures, `storageState` | "Given the user is logged in" → a fixture |
| Steps ("1. click… 2. type…") | actions: `page.click()`, `page.fill()` | One manual step ≈ one action line |
| Expected result | `expect(...)` assertion | "Should see X" → `await expect(...).toHaveText('X')` |
| Test data (valid/invalid) | parametrized data, fixtures | One test, many data rows |
| Negative / edge cases | dedicated negative tests | Your specialty — keep doing this |
| Priority (smoke / full) | tags `@smoke` / `@regression` | Run the fast set first |
| "Bug found in production" | a new regression test | Reproduce the bug as a test so it never returns |
| Test suite / cycle | a folder of specs + CI run | The suite runs itself now |

## A worked example

**Your manual test case:**

> **TC-204 — Checkout with an empty cart**
> Preconditions: user is logged in, cart is empty.
> Steps: 1) Open the cart page. 2) Click "Checkout".
> Expected: an "Your cart is empty" message is shown; the Checkout button is disabled.

**The same thing, automated** (Claude writes this — you read and check it):

```ts
test('@regression TC-204 checkout is blocked when the cart is empty', async ({ page }) => {
  // Preconditions → fixture/setup (logged in), and an empty cart
  await page.goto('/cart');

  // Step: try to check out
  // Expected: empty message shown + button disabled
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled();
});
```

Notice it's the **same case**, just in code. The ID `TC-204`, the priority
(`@regression`), the expected results — all carried over. Your thinking did the hard
part; Claude did the typing.

## How to brief Claude using your manual case

The best prompt is your existing test case. Paste it and say:

> *"Here is my manual test case TC-204. Write a Playwright test for it. Use a fixture
> for the logged-in precondition, and add the negative cases I might have missed."*

Then grade the result with [`reviewing-ai-tests.md`](reviewing-ai-tests.md).

## What automation is *not* good at (so you still matter)

Automation is great at repeating known checks fast. It is **bad** at:

- deciding *what* is worth testing (that's you);
- noticing "this looks wrong / feels off" (exploratory testing — stay manual for that);
- judging whether a new feature actually makes sense for users.

So the healthy split is: **automate the repetitive regression checks; keep your human
exploratory testing for the new and the risky.** Automation frees your time *for* the
judgment work only you can do — it doesn't replace it.

Kinh nghiệm test thủ công của bạn chính là phần automation không làm được. Giữ lấy nó. 💛
