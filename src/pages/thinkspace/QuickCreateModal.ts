import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { datetimeLocalValue } from '../../data/thinkspace/task-factory.js';
import type { ResolvedAgendaFormData } from '../../data/thinkspace/agenda-factory.js';

export type AgendaCreateResult = {
  agendaIds: number[];
};

export class QuickCreateModal extends BasePage {
  readonly modalShell = this.page.locator('.ts-modal-shell').last();
  readonly actionTaskTab = this.modalShell.getByRole('button', { name: /Action \/ Task/i });
  readonly agendaWorkspaceTab = this.modalShell.getByRole('button', {
    name: /Agenda.*Schedule discussions/i,
  });
  readonly titleInput = this.page.getByPlaceholder('e.g., Design user registration flow');
  readonly agendaTitlesTextarea = this.modalShell.getByPlaceholder(/Weekly Sync/i);
  readonly startDateTime = this.modalShell.locator('input[type="datetime-local"]').first();
  readonly createActionButton = this.modalShell.getByRole('button', { name: '+ Create Action' });
  readonly createAgendaButton = this.modalShell.getByRole('button', { name: '+ Create Agenda' });
  readonly cancelButton = this.modalShell.getByRole('button', { name: 'Cancel' });
  readonly specificRadio = this.modalShell.getByRole('radio', { name: 'Specific' });
  readonly routineRadio = this.modalShell.getByRole('radio', { name: 'Routine' });
  readonly attachmentDropZone = this.modalShell.getByText(/Click or drag files here to attach/i);
  readonly selfAssigneeRadio = this.modalShell.getByRole('radio', { name: 'Self (Me)' });
  readonly externalAssigneeRadio = this.modalShell.getByRole('radio', { name: 'External' });
  readonly employeeAssigneeRadio = this.modalShell.getByRole('radio', { name: 'Employee' });
  readonly externalNameInput = this.modalShell.getByPlaceholder("External Person's Name");
  readonly externalEmailInput = this.modalShell.getByPlaceholder("External Person's Email");
  readonly employeeSelectTrigger = this.modalShell
    .getByRole('button')
    .filter({ hasText: /Select employee|Loading employees|Administrator|#/i });

  async expectActionOpen(): Promise<void> {
    await expect(this.modalShell).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText('+ Create New Action').first()).toBeVisible();
  }

  /** @deprecated use expectActionOpen */
  async expectOpen(): Promise<void> {
    await this.expectActionOpen();
  }

  async expectAgendaOpen(contextLabel = 'Adding to: Agenda'): Promise<void> {
    await expect(this.modalShell).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText('+ Create New Agenda').first()).toBeVisible();
    await expect(this.page.getByText(contextLabel).first()).toBeVisible();
  }

  async selectActionTaskWorkspace(): Promise<void> {
    await this.actionTaskTab.click();
  }

  async selectAgendaWorkspace(): Promise<void> {
    const agendaTitles = this.modalShell.getByText(/Agenda Titles/i).first();
    if (!(await agendaTitles.isVisible().catch(() => false))) {
      await this.agendaWorkspaceTab.click();
    }
    await expect(agendaTitles).toBeVisible({ timeout: 10_000 });
  }

  async ensureSpecificAction(): Promise<void> {
    await this.selectActionTaskWorkspace();
    if (await this.specificRadio.isVisible()) {
      await this.specificRadio.check();
    }
  }

  private async fillStartDateTime(value?: string): Promise<void> {
    const startValue = value ?? datetimeLocalValue();
    await this.startDateTime.fill(startValue);
    await expect(this.startDateTime).toHaveValue(startValue);
  }

  async fillAndSubmit(title: string, options?: { description?: string }): Promise<{ taskId?: number }> {
    await this.ensureSpecificAction();
    await this.titleInput.fill(title);
    if (options?.description) {
      const desc = this.modalShell.getByPlaceholder(/description|notes/i).first();
      if (await desc.isVisible()) {
        await desc.fill(options.description);
      }
    }
    await this.fillStartDateTime();
    const endDateTime = this.modalShell.locator('input[type="datetime-local"]').nth(1);
    if (await endDateTime.isVisible()) {
      const endValue = await endDateTime.inputValue();
      if (!endValue) {
        await endDateTime.fill(datetimeLocalValue(24));
      }
    }
    await expect(this.createActionButton).toBeEnabled({ timeout: 30_000 });

    let taskId: number | undefined;
    const responseHandler = async (res: import('@playwright/test').Response) => {
      if (!res.url().includes('/thinkspace/tasks/') || res.request().method() !== 'POST' || !res.ok()) return;
      try {
        const body = (await res.json()) as { data?: { id?: number } };
        if (body?.data?.id) taskId = Number(body.data.id);
      } catch {
        /* optional */
      }
    };

    this.page.on('response', responseHandler);
    try {
      await this.createActionButton.click();
      await expect(this.modalShell).toBeHidden({ timeout: 30_000 });
    } finally {
      this.page.off('response', responseHandler);
    }

    return { taskId };
  }

  async selectSelfAssignee(): Promise<void> {
    await this.selfAssigneeRadio.check();
    await expect(this.selfAssigneeRadio).toBeChecked();
  }

  async selectExternalAssignee(name?: string, email?: string): Promise<void> {
    await this.externalAssigneeRadio.check();
    await expect(this.externalAssigneeRadio).toBeChecked();
    if (name) {
      await this.externalNameInput.fill(name);
      await expect(this.externalNameInput).toHaveValue(name);
    }
    if (email) {
      await this.externalEmailInput.fill(email);
      await expect(this.externalEmailInput).toHaveValue(email);
    }
  }

  async selectEmployeeAssignee(searchHint = 'admin'): Promise<void> {
    await this.employeeAssigneeRadio.check();
    await expect(this.employeeAssigneeRadio).toBeChecked();
    const trigger = this.employeeSelectTrigger.first();
    await expect(trigger).toBeVisible({ timeout: 20_000 });
    await trigger.click();
    const search = this.modalShell.getByPlaceholder('Search employees by name or ID…');
    await expect(search).toBeVisible({ timeout: 20_000 });
    if (searchHint) await search.fill(searchHint);
    const option = this.modalShell.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 30_000 });
    await option.click();
  }

  async fillAgendaForm(data: ResolvedAgendaFormData): Promise<void> {
    await this.selectAgendaWorkspace();
    await expect(this.modalShell.getByText('Agenda Assignee').first()).toBeVisible();

    await this.agendaTitlesTextarea.click();
    await this.agendaTitlesTextarea.fill('');
    await this.agendaTitlesTextarea.fill(data.titles);
    await expect(this.agendaTitlesTextarea).toHaveValue(data.titles);

    await this.fillStartDateTime(data.startDateTime);

    if (data.assigneeType === 'self') {
      await this.selectSelfAssignee();
    } else if (data.assigneeType === 'external') {
      await this.selectExternalAssignee(data.externalName, data.externalEmail);
    } else if (data.assigneeType === 'employee') {
      await this.selectEmployeeAssignee(data.employeeSearchHint);
    }
  }

  private extractAgendaIdFromResponse(body: unknown): number | null {
    if (!body || typeof body !== 'object') return null;
    const record = body as { data?: { id?: number } | { id?: number }[] };
    const data = record.data;
    if (Array.isArray(data)) return data[0]?.id ?? null;
    return data?.id ?? null;
  }

  async fillAndSubmitAgendaFromData(data: ResolvedAgendaFormData): Promise<AgendaCreateResult> {
    await this.fillAgendaForm(data);

    const titleCount = data.titles.split('\n').map((t) => t.trim()).filter(Boolean).length;
    const agendaIds: number[] = [];

    await expect(this.createAgendaButton).toBeEnabled({ timeout: 45_000 });

    const responseHandler = async (res: import('@playwright/test').Response) => {
      if (!res.url().includes('/thinkspace/agendas/') || res.request().method() !== 'POST') return;
      if (!res.ok()) {
        throw new Error(`Agenda create API failed with status ${res.status()}`);
      }
      try {
        const id = this.extractAgendaIdFromResponse(await res.json());
        if (id) agendaIds.push(id);
      } catch {
        /* response body optional for UI-first flow */
      }
    };

    this.page.on('response', responseHandler);
    try {
      await this.createAgendaButton.click();
      await expect
        .poll(() => agendaIds.length, { timeout: 60_000, message: 'Waiting for agenda POST response(s)' })
        .toBeGreaterThanOrEqual(Math.max(1, titleCount));
      await expect(this.modalShell).toBeHidden({ timeout: 60_000 });
    } finally {
      this.page.off('response', responseHandler);
    }

    return { agendaIds };
  }

  /** @deprecated use fillAndSubmitAgendaFromData */
  async fillAndSubmitAgenda(titleOrBulk: string): Promise<void> {
    await this.fillAndSubmitAgendaFromData({
      titles: titleOrBulk,
      title: titleOrBulk.split('\n')[0] ?? titleOrBulk,
      assigneeType: 'self',
      startDateTime: datetimeLocalValue(),
      workspaceCategory: 'Agenda',
      modalContext: 'Adding to: Agenda',
    });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.modalShell).toBeHidden();
  }

  async expectCreateActionDisabled(): Promise<void> {
    await expect(this.createActionButton).toBeDisabled();
  }

  async expectCreateAgendaDisabled(): Promise<void> {
    await expect(this.createAgendaButton).toBeDisabled();
  }

  /** @deprecated use expectCreateActionDisabled */
  async expectCreateDisabled(): Promise<void> {
    await this.expectCreateActionDisabled();
  }

  async expectRoutineMode(): Promise<void> {
    await expect(this.routineRadio).toBeChecked({ timeout: 10_000 });
  }

  async expectTitlePrefilled(title: string): Promise<void> {
    await expect(this.titleInput).toHaveValue(title);
  }

  async expectAgendaAttachmentZone(): Promise<void> {
    await expect(this.attachmentDropZone).toBeVisible();
    await expect(this.modalShell.getByText(/Docflow\/Attachment\/agenda/i)).toBeVisible();
  }
}

export function createQuickCreateModal(page: Page): QuickCreateModal {
  return new QuickCreateModal(page);
}
