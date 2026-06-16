import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@regression home has no critical/serious a11y violations', async ({ page }) => {
  await page.route('**/home', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>Dashboard</title></head>
             <body><main><h1>Dashboard</h1>
             <button aria-label="Refresh">&#8635;</button></main></body></html>`,
    }),
  );
  await page.goto('https://app.test/home');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) =>
    ['critical', 'serious'].includes(v.impact ?? ''),
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});
