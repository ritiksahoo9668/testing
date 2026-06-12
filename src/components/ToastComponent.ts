import type { Page } from '@playwright/test';
import { BaseComponent } from '../core/BaseComponent.js';

export class ToastComponent extends BaseComponent {
  constructor(page: Page) {
    super(
      page,
      page.locator('[role="status"], [aria-live="polite"], [aria-live="assertive"]').first(),
    );
  }

  async expectMessage(message: string | RegExp): Promise<void> {
    await this.root.filter({ hasText: message }).waitFor({ state: 'visible' });
  }
}

export function createToast(page: Page): ToastComponent {
  return new ToastComponent(page);
}
