import type { Page } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { getNavigation } from '../../utils/locators.js';

export class AppShellPage extends BasePage {
  readonly mainNavigation = getNavigation(this.page);
  readonly userMenuButton = this.page.locator('[aria-haspopup="menu"], [data-testid="user-menu"]').first();

  async expectShellVisible(): Promise<void> {
    await this.mainNavigation.first().waitFor({ state: 'visible', timeout: 30_000 }).catch(async () => {
      await this.page.locator('nav, [role="navigation"]').first().waitFor({ state: 'visible' });
    });
  }

  async navigateToModule(moduleSlug: string): Promise<void> {
    await this.goto(`/${moduleSlug}`);
    await this.expectShellVisible();
  }

  async openProfile(): Promise<void> {
    await this.goto('/profile');
  }
}

export function createAppShellPage(page: Page): AppShellPage {
  return new AppShellPage(page);
}
