# Start Here — Automation Testing with Claude Code

Welcome. If you come from **manual testing**, you already have the hardest skill:
knowing *what* to test and *what could break*. Automation just teaches the computer
to do the clicking and checking for you — fast, and the same way every time.

> **You stay the director and the judge. Claude types the code. You decide what to
> test and whether the test is any good.** That judgment is your superpower — keep it.

Đọc nhanh: bạn không mất nghề — kinh nghiệm QC của bạn *chuyển thẳng* sang automation.
Claude lo phần gõ code; bạn lo phần "test cái gì" và "test này tốt hay dở".

**What you need:** Node 20+, a terminal, and a project folder. You will **not** be asked
to write code — you read it and judge it. (Bạn không phải lập trình; bạn đọc và đánh giá.)

---

## 0. Get it running once (do this first)

Before anything else, make some real tests run on your machine so the rest of this guide
makes sense. This repo ships a tiny, ready-to-run example project — start there:

```bash
cd qc-automation/examples
npm install                 # download the tools (one time)
npx playwright install      # download the browsers (one time)
npm test                    # run the example tests
```

Expected: `6 passed` in green. 🎉 That's real automation running on your computer.
Now open the report and the time-travel view:

```bash
npx playwright show-report
```

If a command isn't found or something errors, see **"When nothing works"** near the end — it's
almost always one of three small things. Once `npm test` shows green here, you understand
"a project where tests run", and everything below will click.

> First time setting up the **skill** in Claude Code (so it writes tests for you)?
> That's in the repo's top-level `README.md` (sections 1–3). This file is about
> learning to *read, run, and judge* tests.

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
(Note: `--ui` runs the tests against whatever app they target. The `examples/` tests are
self-contained — they mock their own pages — so you can run `--ui` there straight away.
For real projects, the app under test usually needs to be running first.)

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

## When nothing works (beginner troubleshooting)

When the *tooling* breaks (not a test), it's almost always one of these:

| What you see | What it means | Fix |
|--------------|---------------|-----|
| `command not found: npm` / `node` | Node isn't installed | Install Node 20+ from nodejs.org, reopen the terminal |
| `Executable doesn't exist…` / browser error | Browsers not downloaded | `npx playwright install` |
| `Cannot find module` / `no tests found` | You're not in the project folder, or didn't install | `cd` into the project, then `npm install` |
| Test can't reach the page / `net::ERR_CONNECTION` | The app it tests isn't running | Start the app first (real projects); the `examples/` tests don't need this |
| Visual test fails on first run | No baseline image yet | `npx playwright test --update-snapshots` once, then review the image |

Rule of thumb: if the error is about `npm`, `node`, `module`, or `browser`, it's an
**environment** problem (this list). If it's about an element, text, or assertion, it's a
**test** problem → open the trace (§4). Telling these two apart is half the battle, and
now you can.

## 8. Where to go next

- The rule files in the sibling `../references/` folder (Claude follows them; you can read them to learn).
- [Playwright docs](https://playwright.dev) — clear, with runnable examples.
- [Test Automation University](https://testautomationu.applitools.com) — free courses,
  great for moving from manual to automation.

You've got this. Take it one small test at a time. 🌱
