import type { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../core/BaseComponent.js';
import { getTable } from '../utils/locators.js';

export class TableComponent extends BaseComponent {
  constructor(page: Page, root?: Locator) {
    super(page, root ?? getTable(page));
  }

  rows(): Locator {
    return this.root.locator('tbody tr');
  }

  headers(): Locator {
    return this.root.locator('thead th, thead td');
  }

  async rowCount(): Promise<number> {
    return this.rows().count();
  }

  async clickRowAction(rowIndex: number, actionName: string | RegExp): Promise<void> {
    const row = this.rows().nth(rowIndex);
    await row.getByRole('button', { name: actionName }).click();
  }

  async searchInTable(searchTerm: string, searchInput?: Locator): Promise<void> {
    if (searchInput) {
      await searchInput.fill(searchTerm);
      return;
    }
    const search = this.page.getByRole('searchbox').or(this.page.getByPlaceholder(/search/i));
    if (await search.count()) {
      await search.first().fill(searchTerm);
    }
  }
}

export function createTable(page: Page, root?: Locator): TableComponent {
  return new TableComponent(page, root);
}
