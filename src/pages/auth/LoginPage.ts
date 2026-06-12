import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { getByStableId } from '../../utils/locators.js';
import { waitForPageReady } from '../../utils/waits.js';

export class LoginPage extends BasePage {
  readonly usernameField = getByStableId(this.page, 'login-username');
  readonly usernameFieldError = this.page.locator('#login-username-error');
  readonly passwordField = getByStableId(this.page, 'login-password');
  readonly submitButton = this.page.locator('form button[type="submit"]');
  readonly errorAlert = this.page.getByRole('status');
  readonly heading = this.page.getByRole('heading', { name: /sign in to dyly/i });
  readonly forgotPasswordLink = this.page.getByRole('link', { name: /forgot password/i });
  readonly passwordToggle = this.page.getByRole('button', {
    name: /show password|hide password/i,
  });
  readonly pushHint = this.page.getByText(/notifications page in the app menu/i);

  async open(): Promise<void> {
    await this.goto('/login');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.usernameField.waitFor({ state: 'visible' });
    await this.passwordField.waitFor({ state: 'visible' });
    await this.submitButton.waitFor({ state: 'visible' });
  }

  async expectTitleVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.fill(password);
  }

  async clearUsername(): Promise<void> {
    await this.usernameField.fill('');
  }

  /** Enter username, then move focus to password (triggers onBlur validation). */
  async enterUsernameAndFocusPassword(username: string): Promise<void> {
    await this.usernameField.fill(username);
    await this.passwordField.focus();
  }

  async expectUsernameFieldError(pattern: RegExp): Promise<void> {
    await expect(this.usernameFieldError).toBeVisible();
    await expect(this.usernameFieldError).toContainText(pattern);
    await expect(this.usernameField).toHaveAttribute('aria-invalid', 'true');
  }

  /**
   * After mobile username + focus password: inline #login-username-error must appear.
   * Test FAILS (screenshot/video) if UI has no onBlur validation — expected until UI is implemented.
   */
  async expectMobileUsernameBlockedOnBlur(): Promise<void> {
    await this.expectOnLoginPage();
    await expect(this.usernameFieldError).toBeVisible({
      timeout: 5_000,
    });
    await expect(this.usernameField).toHaveAttribute('aria-invalid', 'true');
    const serverAlertVisible = await this.errorAlert.isVisible().catch(() => false);
    expect(serverAlertVisible).toBe(false);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit();
    await waitForPageReady(this.page);
  }

  async expectCredentialsError(): Promise<void> {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(
      /no active account found with the given credentials|invalid username or password/i,
    );
    await expect(this.errorAlert).toContainText(/please check your username\/email and password/i);
  }

  /**
   * Negative login scenarios: user must stay on /login, see an auth error, and not receive a session token.
   * The Playwright test PASSES when login is rejected (that is the expected product behavior).
   */
  async expectLoginRejected(): Promise<void> {
    await this.expectOnLoginPage();
    await this.expectCredentialsError();
    await expect(this.submitButton).toBeEnabled({ timeout: 15_000 });

    const accessToken = await this.page.evaluate(() => {
      const raw = localStorage.getItem('dyly-session');
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
        return parsed?.state?.accessToken ?? null;
      } catch {
        return null;
      }
    });
    expect(accessToken).toBeFalsy();
  }

  async expectValidationError(pattern: RegExp): Promise<void> {
    const alertVisible = await this.errorAlert.isVisible().catch(() => false);
    if (alertVisible) {
      await expect(this.errorAlert).toContainText(pattern);
      return;
    }
    const usernameMsg = await this.usernameField.evaluate(
      (el) => (el as HTMLInputElement).validationMessage,
    );
    const passwordMsg = await this.passwordField.evaluate(
      (el) => (el as HTMLInputElement).validationMessage,
    );
    const combined = `${usernameMsg} ${passwordMsg}`;
    expect(combined).toMatch(pattern);
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click();
  }

}

export function createLoginPage(page: Page): LoginPage {
  return new LoginPage(page);
}
