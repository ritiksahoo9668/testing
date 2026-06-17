import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';

export class ThoughtAnalyticsPage extends BasePage {
  readonly backLink = this.page.getByRole('link', { name: '← Meeting notes' });
  readonly pageTitle = this.page.getByRole('heading', { name: 'Meeting intelligence' });
  readonly searchInput = this.page.getByPlaceholder('Global search meetings & nodes…');
  readonly searchButton = this.page.getByRole('button', { name: 'Search' });

  async open(path = '/thinkspace/thought/analytics'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 30_000 });
    await expect(this.backLink).toBeVisible();
  }

  async expectStatsVisible(): Promise<void> {
    await expect(this.page.getByText('Total meetings')).toBeVisible({ timeout: 30_000 });
  }

  async runGlobalSearch(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }
}

export function createThoughtAnalyticsPage(page: Page): ThoughtAnalyticsPage {
  return new ThoughtAnalyticsPage(page);
}
