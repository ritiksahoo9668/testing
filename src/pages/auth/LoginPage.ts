import type { Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { getByStableId, getPrimaryButton } from '../../utils/locators.js';
import { waitForPageReady } from '../../utils/waits.js';

export class LoginPage extends BasePage {
  readonly usernameField = getByStableId(this.page, 'login-username');
  readonly passwordField = getByStableId(this.page, 'login-password');
  readonly submitButton = getPrimaryButton(this.page, /sign in|log in/i);
  readonly errorAlert = this.page.getByRole('status');

  async open(): Promise<void> {
    await this.goto('/login');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.usernameField.waitFor({ state: 'visible' });
    await this.passwordField.waitFor({ state: 'visible' });
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit();
    await waitForPageReady(this.page);
  }
}

export function createLoginPage(page: Page): LoginPage {
  return new LoginPage(page);
}
