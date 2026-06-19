import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady } from '../../utils/waits.js';

/**
 * Thinkspace hub landing (`/thinkspace`) and dock app launcher navigation.
 */
export class ThinkspaceHubPage extends BasePage {
  readonly hubHeading = this.page.getByRole('heading', { name: /^Thinkspace$/i });
  readonly dockLauncherDialog = this.page.getByRole('dialog');

  async open(path = '/thinkspace'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/thinkspace\/?$/);
    await expect(this.hubHeading).toBeVisible({ timeout: 30_000 });
  }

  async openDockLauncher(): Promise<void> {
    const thinkspaceDock = this.page.getByRole('link', { name: 'Thinkspace' }).first();
    await thinkspaceDock.click();
    await expect(this.dockLauncherDialog).toBeVisible({ timeout: 10_000 });
  }

  async openModuleFromLauncher(moduleLabel: string): Promise<void> {
    await this.openDockLauncher();
    await this.dockLauncherDialog.getByRole('link', { name: moduleLabel, exact: true }).click();
    await expect(this.dockLauncherDialog).toBeHidden({ timeout: 15_000 });
  }

  async returnToHub(): Promise<void> {
    await this.open('/thinkspace');
    await this.expectLoaded();
  }
}

export function createThinkspaceHubPage(page: Page): ThinkspaceHubPage {
  return new ThinkspaceHubPage(page);
}
