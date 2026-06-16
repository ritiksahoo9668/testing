import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';

export type StatutoryAppKey = 'legal' | 'compliance' | 'finance' | 'management';

export type ActionItemFormData = {
  name: string;
  ownerIndex?: number;
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  remarks?: string;
};

export class ProjectsPage extends BasePage {
  readonly region = this.page.getByRole('region', { name: 'Projects — Thinkspace' });
  readonly createButton = this.page.getByRole('button', { name: 'Create' });
  readonly refreshButton = this.page.getByRole('button', { name: 'Refresh' });
  readonly recentHeading = this.page.getByRole('heading', { name: /Recent \(\d+\)/ });

  createModal = this.page.getByRole('dialog').filter({ hasText: 'Project Request' });

  get bulkUploadModal(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'Bulk project import' });
  }

  get detailModal(): Locator {
    return this.page.locator('div.fixed.inset-0').filter({ has: this.page.getByText(/Approval stage:/) });
  }

  async open(path = '/thinkspace/projects'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/403$/);
    await expect(this.region).toBeVisible({ timeout: 30_000 });
    await expect(this.createButton).toBeVisible();
  }

  async openCreateModal(): Promise<void> {
    await this.createButton.click();
    await expect(this.createModal).toBeVisible();
    await expect(this.createModal.getByRole('heading', { name: /New Project Request|Edit Project Request/ })).toBeVisible();
  }

  async fillTitle(title: string): Promise<void> {
    await this.createModal.locator('#project-title-input').fill(title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.createModal.locator('#project-description-input').fill(description);
  }

  async fillEstimatedCost(cost: string): Promise<void> {
    await this.createModal.locator('#project-cost-input').fill(cost);
  }

  async fillDurationDays(days: string): Promise<void> {
    await this.createModal.locator('#project-duration-days').fill(days);
  }

  async fillExternalMembers(members: string): Promise<void> {
    await this.createModal.locator('#external-members-input').fill(members);
  }

  async fillProjectDates(startDate: string, endDate: string): Promise<void> {
    await this.createModal.locator('#project-start-date').fill(startDate);
    await this.createModal.locator('#project-end-date').fill(endDate);
  }

  async openBulkUploadModal(): Promise<void> {
    await this.page.getByRole('button', { name: 'Excel upload' }).click();
    await expect(this.bulkUploadModal).toBeVisible();
    await expect(this.bulkUploadModal.getByText('1. Download template')).toBeVisible();
  }

  async closeBulkUploadModal(): Promise<void> {
    await this.bulkUploadModal.locator('button.inline-flex').filter({ hasText: 'Close' }).click();
    await expect(this.bulkUploadModal).toBeHidden();
  }

  async expectBulkUploadReady(): Promise<void> {
    await expect(this.bulkUploadModal.getByRole('button', { name: 'Excel template (dropdowns)' })).toBeVisible();
    await expect(this.bulkUploadModal.getByRole('button', { name: 'Start import' })).toBeDisabled();
  }

  async selectListboxOption(buttonId: string, optionLabel: string): Promise<void> {
    const modal = this.createModal;
    await modal.locator(`#${buttonId}`).click();
    const option = this.page.getByRole('option').filter({ hasText: optionLabel }).first();
    await expect(option).toBeVisible({ timeout: 10_000 });
    await option.click();
  }

  async selectFirstOwner(): Promise<string> {
    await this.createModal.locator('#project-owner').click();
    const options = this.page.getByRole('option').filter({ hasNotText: 'Select employee' });
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    const label = ((await options.first().textContent()) ?? '').trim();
    await options.first().click();
    await this.dismissOpenListboxes();
    return label;
  }

  async dismissOpenListboxes(): Promise<void> {
    for (let i = 0; i < 3; i += 1) {
      const open = this.page.locator('[role="listbox"]');
      if ((await open.count()) === 0) return;
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(150);
    }
  }

  async fillRequiredFields(title: string): Promise<{ ownerLabel: string }> {
    await this.fillTitle(title);
    const ownerLabel = await this.selectFirstOwner();
    return { ownerLabel };
  }

  async setStatutoryRequired(enabled: boolean): Promise<void> {
    await this.dismissOpenListboxes();
    const section = this.createModal.locator('section').filter({ hasText: 'Statutory approvals' });
    const checkbox = section.getByRole('checkbox').first();
    await checkbox.scrollIntoViewIfNeeded();
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }

  async setStatutoryApp(key: StatutoryAppKey, enabled: boolean, remarks?: string): Promise<void> {
    await this.dismissOpenListboxes();
    const section = this.createModal.locator('section').filter({ hasText: 'Statutory approvals' });
    const row = section.locator('div.flex.gap-2.items-center').filter({ hasText: new RegExp(`${key} app`, 'i') });
    const checkbox = row.getByRole('checkbox');
    await row.scrollIntoViewIfNeeded();
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
    if (enabled) {
      const remarksInput = row.locator('input[placeholder="Remarks"]');
      await expect(remarksInput).toBeVisible({ timeout: 5_000 });
      if (remarks) {
        await remarksInput.fill(remarks);
      }
    }
  }

  private actionItemForm(): Locator {
    return this.createModal.locator('div.grid').filter({ has: this.page.getByPlaceholder('Task description') });
  }

  async openActionItemForm(): Promise<void> {
    if (await this.createModal.getByPlaceholder('Task description').isVisible().catch(() => false)) {
      return;
    }
    await this.createModal.getByRole('button', { name: 'Add Action' }).click();
    await expect(this.createModal.getByPlaceholder('Task description')).toBeVisible();
  }

  async fillActionItemForm(data: ActionItemFormData): Promise<void> {
    const form = this.actionItemForm();
    await form.getByPlaceholder('Task description').fill(data.name);
    const optionIndex = data.ownerIndex ?? 1;
    await form.locator('select').first().selectOption({ index: optionIndex });
    if (data.priority) {
      await form.locator('select').nth(1).selectOption(data.priority);
    }
    if (data.dueDate) {
      await form.locator('input[type="date"]').fill(data.dueDate);
    }
    if (data.remarks) {
      await form.getByPlaceholder('Optional notes').fill(data.remarks);
    }
  }

  async saveActionItem(): Promise<void> {
    await this.createModal.getByRole('button', { name: 'Save Action' }).click();
  }

  async addActionItem(data: ActionItemFormData): Promise<void> {
    await this.openActionItemForm();
    await this.fillActionItemForm(data);
    await this.saveActionItem();
    await expect(this.createModal.getByRole('cell', { name: data.name })).toBeVisible();
  }

  async editActionItemInForm(currentName: string, newName: string): Promise<void> {
    const section = this.createModal.locator('section').filter({ hasText: 'Action items' });
    const row = section.locator('tbody tr').filter({ hasText: currentName });
    await row.getByRole('button', { name: 'Edit action item' }).click();
    await this.createModal.getByPlaceholder('Task description').fill(newName);
    await this.createModal.getByRole('button', { name: 'Update Action' }).click();
    await expect(this.createModal.getByRole('cell', { name: newName })).toBeVisible();
  }

  async deleteActionItemInForm(name: string): Promise<void> {
    const section = this.createModal.locator('section').filter({ hasText: 'Action items' });
    const row = section.locator('tbody tr').filter({ hasText: name });
    await row.getByRole('button', { name: 'Delete action item' }).click();
    await expect(this.createModal.getByRole('cell', { name })).toHaveCount(0);
  }

  async trySaveActionItemWithoutRequiredFields(): Promise<void> {
    await this.openActionItemForm();
    await this.saveActionItem();
  }

  async configureAllStatutoryApps(remarks: Partial<Record<StatutoryAppKey, string>> = {}): Promise<void> {
    await this.setStatutoryRequired(true);
    const apps: StatutoryAppKey[] = ['legal', 'compliance', 'finance', 'management'];
    for (const app of apps) {
      await this.setStatutoryApp(app, true, remarks[app] ?? `${app} demo remark`);
    }
  }

  async fillExtendedProjectDetails(options: {
    description: string;
    estimatedCost?: string;
    durationDays?: string;
    externalMembers?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    await this.fillDescription(options.description);
    if (options.estimatedCost) await this.fillEstimatedCost(options.estimatedCost);
    if (options.durationDays) await this.fillDurationDays(options.durationDays);
    if (options.externalMembers) await this.fillExternalMembers(options.externalMembers);
    if (options.startDate && options.endDate) {
      await this.fillProjectDates(options.startDate, options.endDate);
    }
  }

  async clickSaveDraft(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/thinkspace/projects/') && ['POST', 'PATCH'].includes(res.request().method()),
      { timeout: 30_000 },
    );
    await this.createModal.getByRole('button', { name: 'Save Draft' }).click();
    await responsePromise;
    await this.expectToast('Draft saved');
    await expect(this.createModal).toBeHidden({ timeout: 15_000 });
  }

  async clickSubmitRequest(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/thinkspace/projects/') && ['POST', 'PATCH'].includes(res.request().method()),
      { timeout: 30_000 },
    );
    await this.createModal.getByRole('button', { name: 'Submit Request' }).click();
    await responsePromise;
    await this.expectToast('Project submitted');
    await expect(this.createModal).toBeHidden({ timeout: 15_000 });
  }

  async clickCancelCreate(): Promise<void> {
    await this.createModal.getByRole('button', { name: 'Cancel' }).click();
    await expect(this.createModal).toBeHidden();
  }

  async expectSaveButtonsDisabled(): Promise<void> {
    await expect(this.createModal.getByRole('button', { name: 'Save Draft' })).toBeDisabled();
    await expect(this.createModal.getByRole('button', { name: 'Submit Request' })).toBeDisabled();
  }

  async expectSaveButtonsEnabled(): Promise<void> {
    await expect(this.createModal.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
    await expect(this.createModal.getByRole('button', { name: 'Submit Request' })).toBeEnabled();
  }

  async expectToast(title: string): Promise<void> {
    await expect(this.page.getByRole('status').filter({ hasText: title }).first()).toBeVisible({ timeout: 15_000 });
  }

  projectCard(title: string): Locator {
    return this.page.locator('article').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async expectProjectInList(title: string, workflowStage?: string): Promise<void> {
    const card = this.projectCard(title);
    await expect(card).toBeVisible({ timeout: 20_000 });
    if (workflowStage) {
      await expect(card.getByText(workflowStage, { exact: true })).toBeVisible();
    }
  }

  async expectProjectNotInList(title: string): Promise<void> {
    await expect(this.projectCard(title)).toHaveCount(0);
  }

  async openProjectDetail(title: string): Promise<void> {
    const detailPromise = this.page
      .waitForResponse(
        (res) => /\/thinkspace\/projects\/\d+\/?/.test(res.url()) && res.request().method() === 'GET',
        { timeout: 20_000 },
      )
      .catch(() => null);
    await this.projectCard(title).click();
    await expect(this.detailModal).toBeVisible({ timeout: 15_000 });
    await detailPromise;
    await expect(this.detailModal.getByText(/Approval stage:/)).toBeVisible();
  }

  async expectDetailTitle(title: string): Promise<void> {
    await expect(this.detailModal.getByText(title, { exact: true }).first()).toBeVisible();
  }

  async expectDetailWorkflowStage(stage: string): Promise<void> {
    await expect(this.detailModal.getByText(`Approval stage: ${stage}`)).toBeVisible();
  }

  async switchDetailTab(tab: 'Overview' | 'Actions' | 'Milestones' | 'Gantt Timeline' | 'Comments'): Promise<void> {
    await this.detailModal.getByRole('button', { name: tab, exact: true }).click();
  }

  async closeDetailModal(): Promise<void> {
    await this.detailModal.locator('button.inline-flex').filter({ hasText: 'Close' }).click();
    await expect(this.detailModal).toBeHidden({ timeout: 10_000 });
  }

  async expectStatutoryInOverview(app: StatutoryAppKey, remarks?: string): Promise<void> {
    await this.switchDetailTab('Overview');
    await expect(this.detailModal.getByText(new RegExp(`${app} Approval`, 'i'))).toBeVisible({ timeout: 15_000 });
    if (remarks) {
      await expect(this.detailModal.getByText(`"${remarks}"`)).toBeVisible();
    }
  }

  async expectWorkflowTrackerContains(stageName: string): Promise<void> {
    await expect(this.page.getByText(stageName, { exact: true }).first()).toBeVisible();
  }

  async clickEditOnProject(title: string): Promise<void> {
    await this.projectCard(title).getByRole('button', { name: 'Edit' }).click();
    await expect(this.createModal).toBeVisible();
    await expect(this.createModal.getByRole('heading', { name: 'Edit Project Request' })).toBeVisible();
  }

  async clickDeleteOnProject(title: string, accept: boolean): Promise<void> {
    const deleteButton = this.projectCard(title).getByRole('button', { name: 'Delete' });
    this.page.once('dialog', async (dialog) => {
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
    await deleteButton.click();
    await waitForSpinnerToDisappear(this.page);
    if (accept) {
      await this.refreshButton.click();
      await waitForSpinnerToDisappear(this.page);
      await expect(this.projectCard(title)).toHaveCount(0, { timeout: 20_000 });
    }
  }

  async expectActionInDetailTab(actionName: string): Promise<void> {
    await this.switchDetailTab('Actions');
    await expect(this.detailModal.getByText(actionName, { exact: true })).toBeVisible({ timeout: 20_000 });
  }

  private milestoneForm(): Locator {
    return this.detailModal
      .locator('div')
      .filter({ has: this.page.getByPlaceholder('Phase 1, Requirements, Deployment...') })
      .filter({ has: this.page.getByRole('button', { name: 'Save Milestone' }) });
  }

  private milestoneRow(title: string): Locator {
    return this.detailModal.locator('tbody tr').filter({
      has: this.page.getByText(title, { exact: true }),
    });
  }

  async openMilestoneForm(): Promise<void> {
    await this.switchDetailTab('Milestones');
    await this.detailModal.getByRole('button', { name: 'Add Milestone' }).click();
    await expect(this.milestoneForm().getByText('New Milestone')).toBeVisible();
  }

  async fillMilestoneForm(data: {
    title: string;
    status?: 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    const form = this.milestoneForm();
    await form.getByPlaceholder('Phase 1, Requirements, Deployment...').fill(data.title);
    if (data.status) {
      await form.locator('select').selectOption(data.status);
    }
    const dates = form.locator('input[type="date"]');
    if (data.startDate) await dates.nth(0).fill(data.startDate);
    if (data.endDate) await dates.nth(1).fill(data.endDate);
  }

  async saveMilestone(method: 'POST' | 'PATCH' = 'POST'): Promise<void> {
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes('/thinkspace/projects/milestones/') && res.request().method() === method,
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.milestoneForm().getByRole('button', { name: 'Save Milestone' }).click();
    await responsePromise;
    await this.expectToast('Milestone Saved');
  }

  async addMilestone(
    title: string,
    status: 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled' = 'Planning',
    options?: { startDate?: string; endDate?: string },
  ): Promise<void> {
    await this.openMilestoneForm();
    await this.fillMilestoneForm({ title, status, ...options });
    await this.saveMilestone('POST');
    await this.expectMilestoneInTable(title);
  }

  async editMilestone(
    currentTitle: string,
    updates: {
      title: string;
      status?: 'Planning' | 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
      startDate?: string;
      endDate?: string;
    },
  ): Promise<void> {
    await this.switchDetailTab('Milestones');
    await this.milestoneRow(currentTitle).locator('button').first().click();
    await expect(this.milestoneForm().getByText('Edit Milestone')).toBeVisible();
    await this.fillMilestoneForm(updates);
    await this.saveMilestone('PATCH');
    await this.expectMilestoneInTable(updates.title);
    if (updates.title !== currentTitle) {
      await expect(this.milestoneRow(currentTitle)).toHaveCount(0);
    }
  }

  async deleteMilestone(title: string, confirm = true): Promise<void> {
    await this.switchDetailTab('Milestones');
    for (let attempt = 0; attempt < 2; attempt += 1) {
      this.page.once('dialog', (dialog) => (confirm ? dialog.accept() : dialog.dismiss()));
      const responsePromise = this.page
        .waitForResponse(
          (res) => res.url().includes('/thinkspace/projects/milestones/') && res.request().method() === 'DELETE',
          { timeout: 30_000 },
        )
        .catch(() => null);
      await this.milestoneRow(title).getByRole('button').nth(1).click();
      const response = await responsePromise;
      if (confirm) {
        if (response?.ok() || (await this.milestoneRow(title).count()) === 0) {
          await expect(this.milestoneRow(title)).toHaveCount(0, { timeout: 15_000 });
          return;
        }
        if (attempt === 0 && response?.status() === 502) {
          await this.page.waitForTimeout(1_000);
          continue;
        }
        expect(response?.ok(), `DELETE ${response?.status()} ${response?.url()}`).toBeTruthy();
      } else {
        await expect(this.milestoneRow(title)).toBeVisible();
        return;
      }
    }
  }

  async cancelMilestoneForm(): Promise<void> {
    await this.milestoneForm().getByRole('button', { name: 'Cancel' }).click();
    await expect(this.milestoneForm()).toHaveCount(0);
  }

  async expectMilestoneSaveDisabled(): Promise<void> {
    await this.openMilestoneForm();
    await expect(this.milestoneForm().getByRole('button', { name: 'Save Milestone' })).toBeDisabled();
  }

  async expectMilestoneInTable(title: string, status?: string): Promise<void> {
    const row = this.milestoneRow(title);
    await expect(row).toBeVisible({ timeout: 15_000 });
    if (status) {
      await expect(row.getByText(status, { exact: true })).toBeVisible();
    }
  }

  async expectMilestonesEmptyState(): Promise<void> {
    await this.switchDetailTab('Milestones');
    await expect(this.detailModal.getByText('No milestones set for this project.')).toBeVisible();
  }

  async expectCommentsEmptyState(): Promise<void> {
    await this.switchDetailTab('Comments');
    await expect(this.detailModal.getByRole('heading', { name: 'Comments & Activity Log' })).toBeVisible();
    await expect(this.detailModal.getByText('No comments recorded yet.')).toBeVisible();
  }

  async expectPostCommentDisabled(): Promise<void> {
    await this.switchDetailTab('Comments');
    await expect(this.detailModal.getByRole('button', { name: 'Post Comment' })).toBeDisabled();
  }

  async expectGanttTabLoaded(): Promise<void> {
    await this.switchDetailTab('Gantt Timeline');
    const search = this.detailModal.getByPlaceholder('Find action…');
    const emptyState = this.detailModal.getByText('No schedule to show yet');
    const stats = this.detailModal.getByText('Scheduled actions');
    const phases = this.detailModal.getByText(/\d+ phases/);
    await expect(search.or(emptyState).or(stats).or(phases).first()).toBeVisible({ timeout: 15_000 });
  }

  async postDetailComment(comment: string): Promise<void> {
    await this.switchDetailTab('Comments');
    await this.detailModal.getByPlaceholder('Type your comment/activity update here...').fill(comment);
    await this.detailModal.getByRole('button', { name: 'Post Comment' }).click();
    await this.expectToast('Comment Added');
    await expect(this.detailModal.getByText(comment)).toBeVisible({ timeout: 15_000 });
  }

  async browseAllDetailTabs(): Promise<void> {
    for (const tab of ['Overview', 'Actions', 'Milestones', 'Gantt Timeline', 'Comments'] as const) {
      await this.switchDetailTab(tab);
      await expect(this.detailModal.getByRole('button', { name: tab, exact: true })).toBeVisible();
    }
  }

  async clickTasksLink(title: string): Promise<void> {
    const link = this.projectCard(title).getByRole('link', { name: 'Tasks' });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/thinkspace_project=/);
    await link.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/task/, { timeout: 20_000 });
  }

  async trackProjectId(
    thinkspaceProjectApi: { findProjectByTitle: (title: string) => Promise<{ id?: number } | undefined> },
    thinkspace: { createdProjectIds: number[] },
    title: string,
  ): Promise<number> {
    const project = await thinkspaceProjectApi.findProjectByTitle(title);
    expect(project?.id).toBeTruthy();
    thinkspace.createdProjectIds.push(project!.id!);
    return project!.id!;
  }
}

export function createProjectsPage(page: Page): ProjectsPage {
  return new ProjectsPage(page);
}
