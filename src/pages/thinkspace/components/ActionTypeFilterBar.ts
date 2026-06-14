import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseComponent } from '../../../core/BaseComponent.js';

export class ActionTypeFilterBar extends BaseComponent {
  constructor(page: Page) {
    super(page, page.getByRole('group', { name: 'Filter actions by type' }));
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible({ timeout: 15_000 });
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible().catch(() => false);
  }

  async selectFilter(label: string | RegExp): Promise<void> {
    await this.root.getByRole('button', { name: label }).click();
  }

  /** Select a filter when the bar is shown (Agenda/Action work mode). No-op if hidden. */
  async selectFilterIfVisible(label: string | RegExp): Promise<void> {
    if (!(await this.isVisible())) return;
    await this.selectFilter(label);
  }

  async expectFilterOption(label: string | RegExp): Promise<void> {
    await expect(this.root.getByRole('button', { name: label })).toBeVisible();
  }
}

export function createActionTypeFilterBar(page: Page): ActionTypeFilterBar {
  return new ActionTypeFilterBar(page);
}
