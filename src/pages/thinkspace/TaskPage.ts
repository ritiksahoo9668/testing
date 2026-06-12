import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';
import { createActionTypeFilterBar } from './components/ActionTypeFilterBar.js';
import { createWorkModeToggle } from './components/WorkModeToggle.js';
import { createQuickCreateModal, type AgendaCreateResult } from './QuickCreateModal.js';
import type { ResolvedAgendaFormData } from '../../data/thinkspace/agenda-factory.js';

export type TaskView = 'today' | 'week';

export class TaskPage extends BasePage {
  readonly workMode = createWorkModeToggle(this.page);
  readonly actionTypeFilterBar = createActionTypeFilterBar(this.page);
  readonly quickCreate = createQuickCreateModal(this.page);
  readonly bucketlistFab = this.page.getByRole('button', { name: 'Open bucketlist' });
  readonly bucketlistPanel = this.page.locator('aside').filter({ hasText: 'Bucketlist' });
  readonly bucketInput = this.bucketlistPanel.getByRole('textbox').first();
  readonly viewMenuTrigger = this.page.locator('button').filter({ hasText: /Actions · Today|Week|Today/i }).first();

  async open(path = '/thinkspace/task'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/403$/);
    await this.workMode.expectVisible();
    await expect(this.viewMenuTrigger).toBeVisible({ timeout: 30_000 });
  }

  async switchView(view: TaskView): Promise<void> {
    await this.viewMenuTrigger.click();
    const label = view === 'today' ? 'Actions · Today' : 'Week';
    await this.page.getByRole('button', { name: label, exact: true }).click();
    await waitForSpinnerToDisappear(this.page);
  }

  async ensureBucketlistOpen(): Promise<void> {
    const closeBtn = this.page.getByRole('button', { name: 'Close bucketlist' });
    if (!(await closeBtn.isVisible().catch(() => false))) {
      if (await this.bucketlistFab.isVisible()) {
        await this.bucketlistFab.click();
      }
    }
    await expect(this.page.getByText('Bucketlist').first()).toBeVisible();
  }

  bucketRow(title: string) {
    return this.bucketlistPanel
      .locator('div.rounded-lg.border')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .first();
  }

  async addBucketItem(title: string): Promise<void> {
    await this.ensureBucketlistOpen();
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes('/thinkspace/bucket-list/') && res.request().method() === 'POST',
        { timeout: 20_000 },
      )
      .catch(() => null);
    await this.bucketInput.fill(title);
    await this.bucketInput.press('Enter');
    await responsePromise;
    await expect
      .poll(async () => this.bucketlistPanel.getByText(title, { exact: true }).count(), { timeout: 30_000 })
      .toBeGreaterThan(0);
  }

  async tryAddWhitespaceBucketItem(): Promise<number> {
    await this.ensureBucketlistOpen();
    const countBefore = await this.bucketlistPanel.locator('div.rounded-lg.border').count();
    await this.bucketInput.fill('   ');
    await this.bucketInput.press('Enter');
    await this.page.waitForTimeout(400);
    return countBefore;
  }

  async deleteBucketItem(title: string): Promise<void> {
    await this.ensureBucketlistOpen();
    const row = this.bucketRow(title);
    await row.getByRole('button', { name: '✕' }).click();
    await expect(row).toBeHidden({ timeout: 15_000 });
  }

  async openQuickCreateFromBucket(title: string, type: 'Specific' | 'Routine' | 'Today' = 'Specific'): Promise<void> {
    await this.switchBucketCategory('action');
    await this.addBucketItem(title);
    await this.bucketRow(title).getByRole('button', { name: type, exact: true }).click();
    await this.quickCreate.expectOpen();
  }

  async openTaskById(taskId: number): Promise<void> {
    await this.goto(`/thinkspace/task/${taskId}`);
    await waitForSpinnerToDisappear(this.page);
  }

  async openTaskFromListByTitle(title: string, options?: { reload?: boolean }): Promise<void> {
    if (options?.reload !== false) {
      await this.page.reload();
      await waitForSpinnerToDisappear(this.page);
    }
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const classicRow = this.page.getByRole('button', { name: new RegExp(escaped) }).first();
    const agendaRow = this.page.locator('main').getByText(title, { exact: false }).first();

    if (await classicRow.isVisible().catch(() => false)) {
      await classicRow.scrollIntoViewIfNeeded();
      await classicRow.click();
    } else {
      await expect(agendaRow).toBeVisible({ timeout: 25_000 });
      await agendaRow.scrollIntoViewIfNeeded();
      await agendaRow.click();
      const agendaCard = this.page.locator('main').locator('div').filter({ hasText: title }).first();
      const detailLink = agendaCard.getByRole('link', { name: /Detail/i });
      if (await detailLink.isVisible().catch(() => false)) {
        await detailLink.click();
      } else {
        await agendaRow.dblclick().catch(() => agendaRow.click());
        await agendaCard.getByRole('link', { name: /Detail/i }).click({ timeout: 10_000 });
      }
    }
    await expect(this.page).toHaveURL(/\/thinkspace\/task\/\d+/, { timeout: 20_000 });
    await waitForSpinnerToDisappear(this.page);
  }

  async expectActionCreatedToast(): Promise<void> {
    await expect(this.page.getByText('Action created.', { exact: true })).toBeVisible({ timeout: 15_000 });
  }

  async clickWorkModeAgendaAction(): Promise<void> {
    await this.workMode.clickAgendaAction();
  }

  /** AgendasPage compact header — opens Create New Agenda modal (matches live DOM). */
  readonly agendasColumnHeader = this.page.locator('span[title="Click to create a new Agenda"]');

  async readAgendasColumnCount(): Promise<number> {
    const text = ((await this.agendasColumnHeader.textContent()) ?? '').trim();
    const match = text.match(/\((\d+)\)/);
    return match ? Number(match[1]) : 0;
  }

  async ensureAgendaActionWorkMode(): Promise<void> {
    await this.open('/thinkspace/task');
    await this.expectLoaded();
    await this.clickWorkModeAgendaAction();
    await expect(this.agendasColumnHeader).toBeVisible({ timeout: 15_000 });
  }

  async openCreateAgendaModal(): Promise<void> {
    await this.ensureAgendaActionWorkMode();
    await this.agendasColumnHeader.click();
    await this.quickCreate.expectAgendaOpen();
    await expect(this.quickCreate.agendaTitlesTextarea).toBeVisible({ timeout: 10_000 });
  }

  async switchBucketCategory(category: 'action' | 'agenda'): Promise<void> {
    await this.ensureBucketlistOpen();
    const label = category === 'action' ? 'Actions' : 'Agendas';
    await this.bucketlistPanel.getByRole('button', { name: label, exact: true }).click();
  }

  async openQuickCreateAgendaFromBucket(title: string): Promise<void> {
    await this.switchBucketCategory('agenda');
    await this.addBucketItem(title);
    const row = this.bucketRow(title);
    await row.getByRole('button', { name: 'Agenda', exact: true }).click();
    await this.quickCreate.expectAgendaOpen();
  }

  async expectAgendaCreatedToast(): Promise<void> {
    await expect(this.page.getByText('Agenda created.', { exact: true })).toBeVisible({ timeout: 15_000 });
  }

  agendaCardByTitle(title: string) {
    return this.page
      .locator('[data-agenda-card-id]')
      .filter({ has: this.page.locator('.thinkspace-action-card-title', { hasText: title }) })
      .first();
  }

  async expectAgendaVisibleInList(title: string): Promise<void> {
    await expect
      .poll(
        async () => this.agendaCardByTitle(title).isVisible().catch(() => false),
        { timeout: 45_000, message: `Agenda "${title}" should appear in the Agendas column` },
      )
      .toBe(true);
    await this.agendaCardByTitle(title).scrollIntoViewIfNeeded();
  }

  async expectAgendasColumnCountAtLeast(minCount: number): Promise<void> {
    await expect
      .poll(async () => this.readAgendasColumnCount(), {
        timeout: 45_000,
        message: `Agendas column count should be at least ${minCount}`,
      })
      .toBeGreaterThanOrEqual(minCount);
  }

  /**
   * Full UI flow: Agendas (N) header → fill modal fields from test data → + Create Agenda → verify list.
   */
  async createAgendaViaUi(form: ResolvedAgendaFormData): Promise<AgendaCreateResult> {
    await this.ensureAgendaActionWorkMode();
    const countBefore = await this.readAgendasColumnCount();
    await this.agendasColumnHeader.click();
    await this.quickCreate.expectAgendaOpen();
    const result = await this.quickCreate.fillAndSubmitAgendaFromData(form);
    await this.expectAgendaCreatedToast();
    await this.expectAgendaVisibleInList(form.title);
    await this.expectAgendasColumnCountAtLeast(countBefore + 1);
    return result;
  }
}

export function createTaskPage(page: Page): TaskPage {
  return new TaskPage(page);
}
