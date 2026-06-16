# How to Grade a Test Claude Wrote

Claude can write the code. **Only you can decide if it's a *good test*.** This is where
your manual-QC experience matters most — you already know how to ask "what could go
wrong here?" That instinct is exactly what separates a real test from a fake one.

Dùng checklist này để "chấm" mỗi test Claude viết, **trước khi** bạn merge. Không hiểu
chỗ nào thì hỏi Claude giải thích — đừng nhận test mình không hiểu.

---

## The 6 questions (ask every time)

1. **Does it test what I actually asked?**
   Read the test like a sentence. Does it do the steps *you* meant, and check the
   result *you* care about? AI sometimes tests a slightly different thing.

2. **Would it catch a real bug?** *(the most important one)*
   Imagine the feature is broken. Would this test turn red? If you're not sure —
   ask Claude: *"make this test fail to prove it checks the result."* If it can't be
   made to fail, it isn't testing anything.

3. **Is it checking behavior, not wiring?**
   Good: "the user sees 'Welcome, Ada'." Suspicious: checking an internal variable,
   a CSS class, or an exact pixel that has nothing to do with what the user experiences.

4. **Are the error cases here?**
   Your QC strength. A happy-path-only test is half a test. Is there a case for wrong
   input, empty field, unauthorized, not-found? If not, ask for them.

5. **Will it be reliable?**
   Look for these reliability smells (ask Claude to fix any you spot):
   - a fixed wait like `waitForTimeout(3000)` → flaky, banned;
   - the test depends on another test running first → must pass alone;
   - it logs in through the UI in every test → slow and fragile.

6. **Can someone else understand it in 6 months?**
   Clear name describing the behavior + expected result? Mapped to a requirement /
   test-ID? If the name is `test('test1')`, send it back.

## Red flags of a "fake green" test (always passes, proves nothing)

| Smell | Why it's bad |
|-------|--------------|
| The assertion is too weak (`expect(true).toBe(true)`, or only checks status 200) | Passes even when the feature is broken |
| Everything is mocked, including the thing under test | You're testing your mock, not the app |
| `try { ... } catch {}` around the action | Swallows the real failure; test stays green |
| No `expect` at all | It runs steps but never checks anything |
| Asserts something that's *always* true regardless of the bug | Green forever, useless |

If you see any of these, the test is lying to you. Ask Claude to fix it.

## How to push back to Claude (copy these prompts)

- *"Explain line 7 in plain words — what is it checking?"*
- *"Make this test fail on purpose so I can confirm it really tests the result."*
- *"What happens if the API returns a 500 error? Add a test for that."*
- *"This uses a fixed wait — replace it with a proper web-first assertion."*
- *"Is this test independent? Could it fail if another test runs first?"*
- *"Add the negative cases: empty email, wrong password, unauthorized."*

## The judge's rule of thumb

> A test you trust is one you have **seen fail** for the right reason, that checks
> what a **user would notice**, and that you can **read and understand**. If any of
> those three is missing, it's not done yet — no matter how green it looks.

Bạn không cần giỏi code để làm việc này. Bạn cần đúng cái tư duy QC bạn đã có. 🌟
