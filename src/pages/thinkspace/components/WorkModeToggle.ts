import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseComponent } from '../../../core/BaseComponent.js';

export class WorkModeToggle extends BaseComponent {
  readonly agendaActionButton;

  constructor(page: Page) {
    super(page, page.getByRole('group', { name: 'Work mode' }));
    this.agendaActionButton = this.root.locator('.task-mode-toggle__btn').filter({ hasText: 'Agenda/Action' });
  }

  async expectVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
    await this.agendaActionButton.waitFor({ state: 'visible' });
  }

  async clickAgendaAction(): Promise<void> {
    await this.agendaActionButton.click();
  }

  async expectAgendaActionActive(): Promise<void> {
    await expect(this.agendaActionButton).toHaveClass(/is-active/);
  }
}

export function createWorkModeToggle(page: Page): WorkModeToggle {
  return new WorkModeToggle(page);
}
