import type { Locator, Page } from '@playwright/test';

export abstract class BaseComponent {
  constructor(
    protected readonly page: Page,
    protected readonly root: Locator,
  ) {}

  locator(selector: string): Locator {
    return this.root.locator(selector);
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  async waitForVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  async waitForHidden(): Promise<void> {
    await this.root.waitFor({ state: 'hidden' });
  }
}
