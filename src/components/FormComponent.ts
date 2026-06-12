import type { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../core/BaseComponent.js';

export class FormComponent extends BaseComponent {
  constructor(page: Page, root: Locator) {
    super(page, root);
  }

  field(name: string): Locator {
    return this.root.locator(`[name="${name}"], #${name}`);
  }

  async fillField(name: string, value: string): Promise<void> {
    await this.field(name).fill(value);
  }

  async selectOption(name: string, value: string): Promise<void> {
    await this.field(name).selectOption(value);
  }

  async submit(buttonName: string | RegExp = /save|submit|create|update/i): Promise<void> {
    await this.root.getByRole('button', { name: buttonName }).click();
  }
}

export function createForm(page: Page, root: Locator): FormComponent {
  return new FormComponent(page, root);
}
