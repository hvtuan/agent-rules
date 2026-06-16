# Start Here — Automation Testing with Claude Code

Welcome. If you come from **manual testing**, you already have the hardest skill:
knowing *what* to test and *what could break*. Automation just teaches the computer
to do the clicking and checking for you — fast, and the same way every time.

> **You stay the director and the judge. Claude types the code. You decide what to
> test and whether the test is any good.** That judgment is your superpower — keep it.

Đọc nhanh: bạn không mất nghề — kinh nghiệm QC của bạn *chuyển thẳng* sang automation.
Claude lo phần gõ code; bạn lo phần "test cái gì" và "test này tốt hay dở".

---

## 1. The mental model

A manual test case is a list of steps and an expected result. An automated test is
the **same thing, written as a tiny program** that runs in seconds and can repeat
forever without getting tired.

| Manual testing | Automated testing |
|----------------|-------------------|
| You open the browser and click | The test opens a browser and clicks |
| You look and decide "this is correct" | The test *asserts* the expected result |
| You repeat for each release (slow, tiring) | The test re-runs in CI on every change (fast) |

See [`manual-to-auto.md`](manual-to-auto.md) for the full translation of your manual
skills into automation.

## 2. What one test looks like

Don't worry about memorizing syntax — Claude writes it. Just learn to *read* it:

```ts
test('@smoke user can log in with valid credentials', async ({ page }) => {
  await page.goto('/login');                          // Arrange: go to the page
  await page.getByLabel('Email').fill('ada@test.dev'); // Act: do the steps
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Welcome, Ada')).toBeVisible(); // Assert: check result
});
```

Read it like a sentence: *"go to login, type email, type password, click Sign in,
and then 'Welcome, Ada' should be visible."* That's it. The three parts —
**Arrange, Act, Assert** — are the same shape as a manual test case
(precondition, steps, expected result).

## 3. How to run a test

```bash
npm test                       # run everything
npx playwright test login      # run only files matching "login"
npx playwright test --ui       # UI MODE — best for learning: watch it run, step by step
npx playwright test --headed   # run in a real visible browser
```

**Start with `--ui`.** It opens a window where you can watch each step, see the page,
and re-run with one click. For a beginner this is the single most helpful command.

## 4. How to read the result (this is where you become independent)

When a test **fails**, you don't guess — you look at the evidence:

- **HTML report:** `npx playwright show-report` → a webpage listing pass/fail.
- **Trace viewer (most important):** for a failed test, open its trace. It's like a
  **video recording with a DOM snapshot at every step** — you can scrub back and
  forth and see exactly what the page looked like when it broke.

```bash
npx playwright show-trace test-results/.../trace.zip
```

90% of "why did this fail?" is answered by looking at the trace. Learn this tool early
and you'll rarely feel stuck.

## 5. The one golden habit: **watch it fail first**

A test that has only ever passed proves nothing — it might be passing for the wrong
reason ("fake green"). Before you trust a new test:

1. Run it → it passes. ✅
2. Now break it on purpose — change the expected text to something wrong, or imagine
   the feature is broken — and run again → it should **fail**. ❌
3. Put it back → it passes again. ✅

If a test *can't fail*, it isn't testing anything. This habit alone will make you
better than many automation engineers.

## 6. Working with Claude — your daily loop

1. Ask for **one small test at a time**, starting with the most important happy path
   (e.g. "write a @smoke test for the login flow").
2. **Read what Claude wrote.** If a line is unclear, ask: *"explain line 4 in plain
   words."* Never merge a test you don't understand.
3. Ask Claude to **prove it**: *"make this test fail to show it actually checks the
   result."*
4. Add the error cases (your QC instinct): *"what if the password is wrong? add that
   test."*
5. Grade it with [`reviewing-ai-tests.md`](reviewing-ai-tests.md) before you accept it.

## 7. Glossary (EN → VN, plain meaning)

| Term | Tiếng Việt / nghĩa đơn giản |
|------|------------------------------|
| **test / spec** | một kịch bản kiểm thử = 1 file/khối `test(...)` |
| **locator** | cách "chỉ" vào 1 phần tử trên trang (nút, ô nhập) |
| **assertion** (`expect`) | câu khẳng định kết quả mong đợi — "phải đúng như này" |
| **fixture** | thứ chuẩn bị sẵn trước test (đăng nhập sẵn, dữ liệu mẫu) |
| **flaky** | test lúc xanh lúc đỏ dù không có gì đổi — phải sửa, không bỏ qua |
| **headed / headless** | chạy có hiện trình duyệt / chạy ẩn (mặc định CI) |
| **trace** | "bản ghi hình" từng bước của test để xem lại khi đỏ |
| **smoke / regression** | nhóm test nhanh-quan-trọng / nhóm test đầy đủ |
| **selector** | chuỗi để tìm phần tử (ưu tiên role/label, tránh XPath) |
| **POM (Page Object)** | gom locator + thao tác 1 trang vào 1 nơi để tái dùng |
| **CI** | hệ thống tự chạy test mỗi khi có thay đổi code |
| **assertion vs action** | check (kiểm) vs do (làm) — `expect` là check, `click/fill` là do |

## 8. Where to go next

- The other rule files in this folder (Claude follows them; you can read them to learn).
- [Playwright docs](https://playwright.dev) — clear, with runnable examples.
- [Test Automation University](https://testautomationu.applitools.com) — free courses,
  great for moving from manual to automation.

You've got this. Take it one small test at a time. 🌱
