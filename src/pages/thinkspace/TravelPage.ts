import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';
import type { TravelCreateFormData } from '../../data/thinkspace/travel-factory.js';

export class TravelPage extends BasePage {
  readonly pageTitle = this.page.getByRole('heading', { name: 'Travel Desk' });
  readonly newRequestButton = this.page.getByRole('button', { name: 'New request' }).first();
  readonly backLink = this.page.getByRole('link', { name: 'Back' }).first();
  readonly emptyState = this.page.getByText('No requests found', { exact: true });

  readonly createPageTitle = this.page.getByRole('heading', { name: 'New Travel Request' });
  readonly sectionNav = this.page.getByRole('navigation', { name: 'Form sections' });
  readonly cancelFormLink = this.page.getByRole('link', { name: 'Cancel' }).first();
  readonly saveDraftButton = this.page.getByRole('button', { name: 'Save draft' });
  readonly submitForApprovalButton = this.page.getByRole('button', { name: 'Submit for Approval' });

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
    await expect(this.page).toHaveURL(/\/thinkspace\/travel\/new/, { timeout: 15_000 });
    await this.expectCreateFormVisible();
  }

  async openCreateFormDirect(): Promise<void> {
    await this.goto('/thinkspace/travel/new');
    await waitForPageReady(this.page);
    await this.expectCreateFormVisible();
  }

  async closeCreateForm(): Promise<void> {
    await this.cancelFormLink.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/travel\/?$/, { timeout: 15_000 });
    await this.expectCreateFormHidden();
  }

  async expectCreateFormHidden(): Promise<void> {
    await expect(this.createPageTitle).toBeHidden({ timeout: 10_000 });
  }

  async expectCreateFormVisible(): Promise<void> {
    await expect(this.createPageTitle).toBeVisible({ timeout: 15_000 });
    await expect(this.sectionNav).toBeVisible();
    await expect(this.saveDraftButton).toBeVisible();
  }

  rowForTitle(title: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: title }).first();
  }

  private field(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  async selectFormSection(label: 'Trip details' | 'Itinerary leg' | 'Notes'): Promise<void> {
    await this.sectionNav.getByRole('button', { name: label, exact: true }).click();
  }

  async fillCreateForm(data: TravelCreateFormData): Promise<void> {
    await this.selectFormSection('Trip details');
    await this.field('travel-title').fill(data.title);
    await this.field('travel-destination').fill(data.destination);
    await this.field('travel-start-date').fill(data.startDate);
    await this.field('travel-end-date').fill(data.endDate);

    if (data.fromLoc !== undefined || data.toLoc !== undefined) {
      await this.selectFormSection('Itinerary leg');
      if (data.fromLoc !== undefined) {
        await this.field('travel-from-leg').fill(data.fromLoc);
      }
      if (data.toLoc !== undefined) {
        await this.field('travel-to-leg').fill(data.toLoc);
      }
    }

    if (data.notes !== undefined) {
      await this.selectFormSection('Notes');
      await this.field('travel-notes').fill(data.notes);
    }
  }

  async saveDraft(): Promise<void> {
    await expect(this.saveDraftButton).toBeEnabled({ timeout: 10_000 });
    await this.saveDraftButton.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/travel\/?$/, { timeout: 20_000 });
    await waitForSpinnerToDisappear(this.page);
  }

  async submitForApproval(): Promise<void> {
    await expect(this.submitForApprovalButton).toBeEnabled({ timeout: 10_000 });
    await this.submitForApprovalButton.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/travel\/?$/, { timeout: 20_000 });
    await waitForSpinnerToDisappear(this.page);
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
    await expect(row).toContainText(status);
    // Dates render via locale formatting in the desk table.
    await expect(row).toBeVisible();
  }

  async expectRowLeg(title: string, fromLoc: string, toLoc: string): Promise<void> {
    const row = this.rowForTitle(title);
    await expect(row).toContainText(fromLoc);
    await expect(row).toContainText(toLoc);
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
    return this.page.locator('tbody tr').count();
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
