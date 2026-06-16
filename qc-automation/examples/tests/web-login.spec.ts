import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.beforeEach(async ({ page }) => {
  await page.route('**/login', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<form><label>Username<input></label><label>Password<input type=password></label>
             <button>Sign in</button><div role="status" id="msg"></div></form>
             <script>document.querySelector('button').onclick=(e)=>{e.preventDefault();
             const u=document.querySelectorAll('input')[0].value;
             document.getElementById('msg').textContent=u==='admin'?'Welcome admin':'Invalid credentials';}</script>`,
    }),
  );
});

test('@smoke valid credentials show welcome', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('admin', 'pw');
  await expect(page.getByRole('status')).toHaveText('Welcome admin');
});

test('@regression invalid credentials show error', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('nobody', 'bad');
  await expect(page.getByRole('status')).toHaveText('Invalid credentials');
});
