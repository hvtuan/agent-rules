# Visual Regression & Accessibility Rules

How to write stable visual-diff tests and enforce accessibility.

## Visual regression

**Principle:** Use `toHaveScreenshot()` as the default. Commit baselines and review diffs in PRs like code.
**Why:** Pixel diffs catch unintended UI changes that functional assertions miss; baselines are the source of truth, so they need review.

```ts
test('TC-V01 dashboard layout', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [page.getByTestId('live-clock'), page.getByRole('img', { name: 'avatar' })],
    maxDiffPixels: 100,
  });
});
```

**Principle:** Make snapshots deterministic — pin viewport + `deviceScaleFactor`, disable animations and the text caret, mask dynamic regions (dates, ads, avatars), and wait for a stable state (fonts loaded, network idle).
**Why:** Animations, blinking carets, and live data cause false diffs that destroy trust in visual tests.

```ts
// playwright.config.ts
use: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 };
expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', threshold: 0.2 } };
// in test, before snapshot:
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
```

**Principle:** Set `maxDiffPixels`/`threshold` intentionally, not by trial-and-error. Split baselines per OS/browser, and capture them in the same Docker/CI image that runs the suite.
**Why:** Font hinting and anti-aliasing differ across OS/browsers; baselines taken on a dev Mac will fail on Linux CI. Generate them where they run.

```bash
# regenerate baselines inside the CI container, never locally
docker run --rm -v "$PWD:/work" mcr.microsoft.com/playwright:latest \
  npx playwright test --update-snapshots
```

## Accessibility

**Principle:** Run `@axe-core/playwright` scans on every main flow.
**Why:** Automated axe checks catch a large share of WCAG violations cheaply on each run.

```ts
import AxeBuilder from '@axe-core/playwright';

test('TC-A11Y-01 checkout page WCAG2.1-AA', async ({ page }) => {
  await page.goto('/checkout');
  const results = await new AxeBuilder({ page }).withTags(['wcag21aa']).analyze();
  const blocking = results.violations.filter(v => ['critical', 'serious'].includes(v.impact!));
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
```

**Principle:** Apply a severity gate — `critical`/`serious` fail the build; `moderate`/`minor` are tracked, not blocking. Each a11y assertion carries a test-ID mapped to a WCAG criterion.
**Why:** Blocking on every minor finding stalls delivery; tracking keeps them visible. WCAG mapping gives auditable coverage.

**Principle:** Automated scans are not enough — manually verify keyboard navigation, focus order, and correct ARIA roles/names. On mobile, use the platform **accessibility id** as the primary selector.
**Why:** axe cannot judge focus order or whether ARIA is *meaningful*; accessibility ids double as stable selectors and a11y verification.

```ts
// keyboard / focus-order check (web)
await page.keyboard.press('Tab');
await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
```

```ts
// mobile (WDIO/Appium) — accessibility id selector
await $('~submit-order-button').click();
```
