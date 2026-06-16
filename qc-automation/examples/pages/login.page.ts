import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
}

export class LoginPage extends BasePage {
  private readonly user: Locator = this.page.getByLabel('Username');
  private readonly pass: Locator = this.page.getByLabel('Password');
  private readonly submit: Locator = this.page.getByRole('button', { name: 'Sign in' });

  async goto() {
    await this.page.goto('https://app.test/login');
  }

  async login(u: string, p: string) {
    await this.user.fill(u);
    await this.pass.fill(p);
    await this.submit.click();
  }
}
