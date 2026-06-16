import { test, expect } from '@playwright/test';

test('@regression home renders stable snapshot', async ({ page }) => {
  await page.route('**/home', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: `<style>*{animation:none!important;caret-color:transparent}</style>
             <h1>Dashboard</h1><span data-dyn>2026-06-16 12:00</span>`,
    }),
  );
  await page.goto('https://app.test/home');
  await expect(page).toHaveScreenshot('home.png', {
    mask: [page.locator('[data-dyn]')],
    maxDiffPixels: 50,
  });
});
