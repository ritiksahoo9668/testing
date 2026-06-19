import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';
import type { TravelCreateFormData } from '../../data/thinkspace/travel-factory.js';

export class TravelPage extends BasePage {
  readonly pageTitle = this.page.getByRole('heading', { name: 'Travel Desk' });
  readonly newRequestButton = this.page.getByRole('button', { name: 'New request' }).first();
  readonly cancelFormButton = this.page
    .locator('form.travel-form-card__body')
    .getByRole('button', { name: 'Cancel' });
  readonly saveDraftButton = this.page
    .locator('form.travel-form-card__body')
    .getByRole('button', { name: 'Save draft' });
  readonly submitForApprovalButton = this.page
    .locator('form.travel-form-card__body')
    .getByRole('button', { name: 'Submit for Approval' });
  readonly backLink = this.page.getByRole('link', { name: 'Back' });
  readonly emptyState = this.page.getByText('No travel requests yet', { exact: true });

  readonly createForm = this.page.locator('form.travel-form-card__body');

  async open(path = '/thinkspace/travel'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/403$/);
    await expect(this.pageTitle).toBeVisible({ timeout: 30_000 });
    await expect(this.newRequestButton).toBeVisible();
  }

  async openCreateForm(): Promise<void> {
    await this.newRequestButton.click();
    await expect(this.createForm).toBeVisible();
    await expect(this.saveDraftButton).toBeVisible();
  }

  async closeCreateForm(): Promise<void> {
    await this.cancelFormButton.click();
    await expect(this.createForm).toBeHidden();
  }

  async expectCreateFormHidden(): Promise<void> {
    await expect(this.createForm).toBeHidden();
  }

  async expectCreateFormVisible(): Promise<void> {
    await expect(this.createForm).toBeVisible();
  }

  rowForTitle(title: string): Locator {
    return this.page.getByRole('article').filter({ hasText: title });
  }

  fieldByLabel(label: string): Locator {
    // Required fields append "*" in the label; match prefix only.
    return this.createForm.getByLabel(new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)).first();
  }

  async fillCreateForm(data: TravelCreateFormData): Promise<void> {
    await this.fieldByLabel('Title').fill(data.title);
    await this.fieldByLabel('Destination').fill(data.destination);
    await this.fieldByLabel('Start date').fill(data.startDate);
    await this.fieldByLabel('End date').fill(data.endDate);
    if (data.fromLoc !== undefined) {
      await this.fieldByLabel('From').fill(data.fromLoc);
    }
    if (data.toLoc !== undefined) {
      await this.fieldByLabel('To').fill(data.toLoc);
    }
    if (data.notes !== undefined) {
      await this.fieldByLabel('Notes').fill(data.notes);
    }
  }

  async saveDraft(): Promise<void> {
    await this.saveDraftButton.click();
    await expect(this.createForm).toBeHidden({ timeout: 20_000 });
  }

  async clickSaveDraftWithoutValidation(): Promise<void> {
    await expect(this.saveDraftButton).toBeDisabled();
  }

  async expectRowVisible(title: string): Promise<void> {
    await expect(this.rowForTitle(title)).toBeVisible({ timeout: 20_000 });
  }

  async expectRowStatus(title: string, status: string): Promise<void> {
    const row = this.rowForTitle(title);
    await expect(row).toContainText(status);
  }

  async expectRowMetadata(title: string, destination: string, startDate: string, endDate: string, status: string): Promise<void> {
    const row = this.rowForTitle(title);
    await expect(row).toContainText(destination);
    await expect(row).toContainText(startDate);
    await expect(row).toContainText(endDate);
    await expect(row).toContainText(status);
  }

  async expectRowLeg(title: string, fromLoc: string, toLoc: string): Promise<void> {
    await expect(this.rowForTitle(title)).toContainText(`${fromLoc} → ${toLoc}`);
  }

  async clickRowAction(title: string, action: 'Submit' | 'Approve' | 'Reject' | 'Cancel'): Promise<void> {
    const row = this.rowForTitle(title);
    await row.getByRole('button', { name: action, exact: true }).click();
    await waitForSpinnerToDisappear(this.page);
  }

  async expectRowActionVisible(title: string, action: 'Submit' | 'Approve' | 'Reject' | 'Cancel'): Promise<void> {
    await expect(this.rowForTitle(title).getByRole('button', { name: action, exact: true })).toBeVisible();
  }

  async expectRowActionHidden(title: string, action: 'Submit' | 'Approve' | 'Reject' | 'Cancel'): Promise<void> {
    await expect(this.rowForTitle(title).getByRole('button', { name: action, exact: true })).toBeHidden();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async rowCount(): Promise<number> {
    return this.page.getByRole('article').count();
  }

  async expectErrorAlert(): Promise<void> {
    await expect(this.page.getByText(/Cannot transition|cannot cancel|Permission denied/i)).toBeVisible({
      timeout: 10_000,
    });
  }
}

export function createTravelPage(page: Page): TravelPage {
  return new TravelPage(page);
}
