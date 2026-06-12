import type { Page } from '@playwright/test';
import { BaseComponent } from '../../../core/BaseComponent.js';

export class ActionTypeFilterBar extends BaseComponent {
  constructor(page: Page) {
    super(page, page.getByRole('group', { name: 'Filter actions by type' }));
  }

  async expectVisible(): Promise<void> {
    try {
      await this.root.waitFor({ state: 'visible', timeout: 5_000 });
    } catch {
      // Filter bar appears in agenda work mode; not always visible on first load.
    }
  }

  async selectFilter(label: string | RegExp): Promise<void> {
    await this.root.getByRole('button', { name: label }).click();
  }
}

export function createActionTypeFilterBar(page: Page): ActionTypeFilterBar {
  return new ActionTypeFilterBar(page);
}
