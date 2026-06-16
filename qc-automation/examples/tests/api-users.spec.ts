import { test, expect } from '@playwright/test';

// NOTE: page.route() intercepts the browser context's own fetch/XHR/navigation,
// but does NOT intercept page.request (APIRequestContext) calls. So we mock the
// endpoints with page.route and drive the requests from inside the page via
// page.evaluate(fetch(...)). This keeps the contract test fully offline while
// still asserting a positive (typed list) and a negative (404) case.

test.beforeEach(async ({ page }) => {
  // A real origin so relative fetch() URLs resolve; the page body is irrelevant.
  await page.route('https://app.test/', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>fixture</title>' }),
  );
  await page.route('**/api/users', (r) => r.fulfill({ json: [{ id: 1, name: 'Ada' }] }));
  await page.route('**/api/users/999', (r) =>
    r.fulfill({ status: 404, json: { error: 'not found' } }),
  );
  await page.goto('https://app.test/');
});

test('@smoke GET /users returns a typed list', async ({ page }) => {
  const { ok, body } = await page.evaluate(async () => {
    const res = await fetch('/api/users');
    return { ok: res.ok, body: await res.json() };
  });
  expect(ok).toBeTruthy();
  expect(Array.isArray(body)).toBe(true);
  expect(body[0]).toMatchObject({ id: expect.any(Number), name: expect.any(String) });
});

test('@regression GET /users/999 returns 404', async ({ page }) => {
  const status = await page.evaluate(async () => {
    const res = await fetch('/api/users/999');
    return res.status;
  });
  expect(status).toBe(404);
});
