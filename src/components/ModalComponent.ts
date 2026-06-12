import type { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../core/BaseComponent.js';
import { getDialog } from '../utils/locators.js';

export class ModalComponent extends BaseComponent {
  constructor(page: Page, root?: Locator) {
    super(page, root ?? getDialog(page));
  }

  async close(): Promise<void> {
    const closeButton = this.root.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
    await this.waitForHidden();
  }

  async expectTitle(title: string | RegExp): Promise<void> {
    await this.root.getByRole('heading', { name: title }).waitFor({ state: 'visible' });
  }
}

export function createModal(page: Page, root?: Locator): ModalComponent {
  return new ModalComponent(page, root);
}
