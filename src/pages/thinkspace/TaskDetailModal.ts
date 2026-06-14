import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForSpinnerToDisappear } from '../../utils/waits.js';

export type TaskDetailTab = 'Progress' | 'Updates' | 'Attachments' | 'Hierarchy';

export class TaskDetailModal extends BasePage {
  readonly modalShell = this.page.locator('.ts-modal-shell').last();
  readonly closeButton = this.modalShell.getByRole('button', { name: 'Close' }).first();
  readonly progressSlider = this.modalShell.locator('input[type="range"]');
  readonly saveProgressButton = this.modalShell.getByRole('button', { name: 'Save', exact: true });
  readonly doneButton = this.modalShell.getByRole('button', { name: 'Done', exact: true });
  readonly doMoreButton = this.modalShell.getByRole('button', { name: 'Do more', exact: true });
  readonly derailedButton = this.modalShell.getByRole('button', { name: 'Derailed', exact: true });
  readonly deleteButton = this.modalShell.getByRole('button', { name: 'Delete', exact: true });
  readonly descriptionInput = this.modalShell.getByPlaceholder('Task description...');
  readonly saveDescriptionButton = this.modalShell.locator('button[title="Save Description"]');
  readonly postUpdateInput = this.modalShell.getByPlaceholder('Post a progress update...');
  readonly postButton = this.modalShell.getByRole('button', { name: 'Post', exact: true });

  async expectOpen(taskId?: string | number): Promise<void> {
    if (taskId !== undefined) {
      await expect(this.page).toHaveURL(new RegExp(`/thinkspace/task/${taskId}`));
    } else {
      await expect(this.page).toHaveURL(/\/thinkspace\/task\/\d+/);
    }
    await expect(this.modalShell).toBeVisible({ timeout: 20_000 });
  }

  async waitForDetailReady(maxAttempts = 3): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await this.modalShell.isVisible().catch(() => false)) {
        const loadError = this.modalShell.getByText(/failed to load|error loading/i);
        if (await loadError.isVisible().catch(() => false)) {
          await this.page.reload();
          await waitForSpinnerToDisappear(this.page);
          continue;
        }
        return;
      }
      await this.page.waitForTimeout(800);
    }
    await this.expectOpen();
  }

  async expectTitleVisible(title: string): Promise<void> {
    await expect(this.modalShell.getByText(title).first()).toBeVisible();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/task\/?(\?|$)/);
  }

  async selectTab(tab: TaskDetailTab): Promise<void> {
    const pattern =
      tab === 'Updates'
        ? /^Updates\b/i
        : tab === 'Attachments'
          ? /^Attachments\b/i
          : tab === 'Hierarchy'
            ? /^Hierarchy\b/i
            : /^Progress$/i;
    await this.modalShell.getByRole('button', { name: pattern }).first().click();
  }

  async updateDescription(text: string): Promise<void> {
    await this.descriptionInput.fill(text);
    await this.saveDescriptionButton.click();
    await waitForSpinnerToDisappear(this.page);
  }

  async setProgressAndSave(percent: number): Promise<void> {
    await this.selectTab('Progress');
    await this.progressSlider.fill(String(percent));
    if (await this.saveProgressButton.isVisible()) {
      await this.saveProgressButton.click();
    }
    await waitForSpinnerToDisappear(this.page);
  }

  async markDone(): Promise<void> {
    await this.selectTab('Progress');
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes('set-task-progress') && res.request().method() === 'POST',
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.doneButton.click();
    await responsePromise;
    await waitForSpinnerToDisappear(this.page);
  }

  private registerPromptAccept(note: string): void {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept(note);
    });
  }

  async clickDoMore(note: string): Promise<void> {
    this.registerPromptAccept(note);
    await this.doMoreButton.click();
    await waitForSpinnerToDisappear(this.page);
  }

  async clickDerailed(note: string): Promise<void> {
    this.registerPromptAccept(note);
    await this.derailedButton.click();
    await waitForSpinnerToDisappear(this.page);
  }

  async expectDeleteDisabled(): Promise<void> {
    await expect(this.deleteButton).toBeDisabled();
  }

  async expectDeleteEnabled(): Promise<void> {
    await expect(this.deleteButton).toBeEnabled();
  }

  async postUpdate(message: string): Promise<void> {
    await this.postUpdateInput.fill(message);
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('post-task-update') && res.request().method() === 'POST',
      { timeout: 20_000 },
    );
    await this.postButton.click();
    await responsePromise;
    await this.postUpdateInput.fill('');
    await this.selectTab('Updates');
    await expect(this.modalShell.getByText(message).first()).toBeVisible({ timeout: 15_000 });
  }

  async expectPostDisabled(): Promise<void> {
    await expect(this.postButton).toBeDisabled();
  }

  async uploadAttachment(filePath: string): Promise<void> {
    await this.selectTab('Attachments');
    const fileInput = this.page.locator('#task-file-input');
    await fileInput.setInputFiles(filePath);
    const responsePromise = this.page
      .waitForResponse(
        (res) =>
          res.url().includes('add-attachment-to-task') && res.request().method() === 'POST',
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.modalShell.getByRole('button', { name: 'Upload', exact: true }).click();
    await responsePromise;
    await waitForSpinnerToDisappear(this.page);
  }

  async expectAttachmentListed(filename: string): Promise<void> {
    await expect(this.modalShell.getByText(filename).first()).toBeVisible({ timeout: 20_000 });
  }

  async deleteTask(): Promise<void> {
    const responsePromise = this.page
      .waitForResponse(
        (res) => res.url().includes('delete-task') && res.request().method() === 'POST',
        { timeout: 30_000 },
      )
      .catch(() => null);
    await this.deleteButton.click();
    await responsePromise;
    await expect(this.page).toHaveURL(/\/thinkspace\/task\/?(\?|$)/, { timeout: 30_000 });
  }
}

export function createTaskDetailModal(page: Page): TaskDetailModal {
  return new TaskDetailModal(page);
}
