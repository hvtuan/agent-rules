# Code Structure Rules

How to organize test automation code: page/service/screen objects, locators, waits, config, fixtures.

## POM / service-client / screen-objects; no assertions inside them

**Principle:** Web uses Page Objects extending an abstract `BasePage`. API uses a service-client layer. Mobile uses screen-objects. Objects expose actions and getters only — never `expect`.
**Why:** Keeps assertions in tests where failures are meaningful, and makes locators/endpoints reusable.

```ts
// base.page.ts
export abstract class BasePage {
  constructor(protected page: Page) {}
  abstract get root(): Locator;
}
// login.page.ts — actions only, NO expect
export class LoginPage extends BasePage {
  get root() { return this.page.getByRole('form', { name: 'Login' }); }
  async submit(user: string, pass: string) {
    await this.page.getByLabel('Email').fill(user);
    await this.page.getByLabel('Password').fill(pass);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}
```

```ts
// API service-client layer
export class UserClient {
  constructor(private request: APIRequestContext) {}
  createUser(body: NewUser) { return this.request.post('/users', { data: body }); }
}
```

## Ban hard waits

**Principle:** Never use `page.waitForTimeout`, `browser.pause`, or `sleep`. Use web-first assertions or explicit conditional waits.
**Why:** Fixed delays are slow and flaky — they either over-wait or under-wait depending on machine/network.

```ts
// BAD
await page.waitForTimeout(2000);
await expect(page.getByText('Saved')).toBeVisible();

// GOOD — auto-retrying assertion / explicit condition
await expect(page.getByText('Saved')).toBeVisible();
await page.waitForResponse(r => r.url().includes('/save') && r.ok());
```

## Locator priority

**Principle:** Prefer `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText` → `getByTestId` → CSS. No XPath, no index-based selection. Chain and `.filter({ hasText })` to disambiguate.
**Why:** Role/label locators mirror how users and assistive tech find elements, so they survive refactors and assert accessibility implicitly.

```ts
// BAD
page.locator('//div[2]/button');
page.locator('.btn').nth(3);

// GOOD
page.getByRole('button', { name: 'Delete' });
page.getByRole('row').filter({ hasText: 'Invoice #42' }).getByRole('button', { name: 'Open' });
```

## Mock third parties with page.route()

**Principle:** Intercept external/unstable dependencies with `page.route()` and return deterministic responses.
**Why:** Tests must not depend on third-party uptime, rate limits, or live data.

```ts
await page.route('**/api.stripe.com/**', route =>
  route.fulfill({ status: 200, json: { id: 'pm_test', status: 'succeeded' } }));
```

## Reuse auth via storageState fixture

**Principle:** Log in once, save `storageState`, and inject it through a fixture. Do not re-login per test.
**Why:** Re-logging in every test is slow and adds a flaky dependency on the auth UI to unrelated tests.

```ts
// global-setup logs in and saves state to .auth/user.json
export const test = base.extend({
  storageState: '.auth/user.json',
});
```

## Config & secrets via env

**Principle:** Read config/secrets from `process.env` / `.env`. Never hardcode credentials or URLs. Set standard `playwright.config` knobs.
**Why:** Secrets in code leak; env-driven config lets the same suite run across environments.

```ts
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## API: spec builder + schema validation

**Principle:** Build requests/responses through a reusable spec helper and validate response bodies against a JSON schema (`ajv`/`zod`) for contract testing.
**Why:** Centralizes request shape and catches contract drift, not just status codes.

```ts
const UserSchema = z.object({ id: z.string().uuid(), email: z.string().email() });
const res = await userClient.createUser(newUser);
expect(res.status()).toBe(201);
UserSchema.parse(await res.json()); // throws on contract violation
```

## Idempotent setup/teardown; no order dependency

**Principle:** Each test creates and cleans up its own data; never depend on execution order or leftover state.
**Why:** Order-dependent tests break under sharding, parallelism, and retries.

```ts
test.beforeEach(async ({ userClient }) => { ctx.user = await userClient.create(); });
test.afterEach(async ({ userClient }) => { await userClient.delete(ctx.user.id); });
```
