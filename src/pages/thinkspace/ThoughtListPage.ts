import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady, waitForSpinnerToDisappear } from '../../utils/waits.js';

export type ContributorAccessRole = 'Viewer' | 'Editor';

export class ThoughtListPage extends BasePage {
  readonly searchInput = this.page.locator('#meeting-search');
  readonly createButton = this.page.getByRole('button', { name: 'Create meeting' });
  readonly intelligenceLink = this.page.getByRole('link', { name: 'Intelligence' });
  readonly hubLink = this.page.getByRole('link', { name: 'Thinkspace hub' });
  readonly pageTitle = this.page.getByRole('heading', { name: 'Meeting Notes' });
  readonly createModal = this.page.locator('.thought-create-modal');
  readonly createForm = this.createModal.locator('form.thought-create-form');
  readonly titleInput = this.createForm.locator('input.thought-create-form__input').first();
  readonly agendaInput = this.createForm.locator('textarea.thought-create-form__textarea');
  readonly dateInput = this.createForm.locator('input.thought-create-form__input--date');
  readonly submitCreateButton = this.createForm.locator('button[type="submit"]');
  readonly cancelCreateButton = this.createForm.getByRole('button', { name: 'Cancel' });
  readonly contributorCombobox = this.createForm.locator('input.thought-contributor-combobox__input');
  readonly contributorListbox = this.createForm.locator('ul.thought-contributor-combobox__list');
  readonly contributorChevron = this.createForm.locator('button.thought-contributor-combobox__chevron');
  readonly guestNameInput = this.createForm.getByPlaceholder('Guest name');
  readonly guestEmailInput = this.createForm.getByPlaceholder('Email');
  readonly guestAddButton = this.createForm.getByRole('button', { name: 'Guest', exact: true });
  readonly contributorsPill = this.createForm.locator('.thought-create-form__pill');

  async open(path = '/thinkspace/thought'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/403$/);
    await expect(this.pageTitle).toBeVisible({ timeout: 30_000 });
    await expect(this.createButton).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async openCreateModal(): Promise<void> {
    await this.createButton.click();
    await expect(this.createModal).toBeVisible();
    await expect(this.createForm).toBeVisible();
    await expect(this.titleInput).toBeVisible();
    await expect(this.contributorCombobox).toBeVisible();
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  async fillAgenda(agenda: string): Promise<void> {
    await this.agendaInput.fill(agenda);
  }

  async fillDateLocal(value: string): Promise<void> {
    await this.dateInput.fill(value);
  }

  async openContributorDropdown(): Promise<void> {
    await this.contributorCombobox.click();
    await expect(this.contributorListbox).toBeVisible({ timeout: 15_000 });
  }

  async searchContributor(query: string): Promise<void> {
    await this.contributorCombobox.fill(query);
    await expect(this.contributorListbox).toBeVisible({ timeout: 15_000 });
  }

  async closeContributorDropdown(): Promise<void> {
    if (await this.contributorListbox.isVisible().catch(() => false)) {
      await this.contributorCombobox.press('Escape');
      await expect(this.contributorListbox).toBeHidden({ timeout: 5_000 });
    }
  }

  async addContributorFromList(name: string): Promise<void> {
    const option = this.contributorListbox
      .locator('button.thought-contributor-combobox__option')
      .filter({ hasText: name })
      .first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();
    await expect(this.contributorChip(name)).toBeVisible({ timeout: 10_000 });
    await this.closeContributorDropdown();
  }

  contributorChip(name: string) {
    return this.createForm.locator('ul.flex.flex-wrap.gap-1\\.5 li').filter({ hasText: name });
  }

  async setContributorAccess(name: string, role: ContributorAccessRole): Promise<void> {
    const select = this.createForm.locator(`select[aria-label="Access for ${name}"]`);
    await expect(select).toBeVisible();
    await select.selectOption({ label: role });
    await expect(select).toHaveValue(role.toLowerCase());
  }

  async addGuestContributor(name: string, email: string): Promise<void> {
    await this.closeContributorDropdown();
    await this.guestNameInput.fill(name);
    await this.guestEmailInput.fill(email);
    await this.guestAddButton.click({ force: true });
    await expect(this.contributorChip(name)).toBeVisible({ timeout: 10_000 });
  }

  async expectContributorsCount(count: number): Promise<void> {
    await expect(this.contributorsPill).toContainText(`${count} selected`);
  }

  async addFirstMatchingContributor(search = 'Demo'): Promise<string> {
    await this.searchContributor(search);
    const option = this.contributorListbox.locator('button.thought-contributor-combobox__option').first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    const name = (await option.locator('.thought-contributor-combobox__name').innerText()).trim();
    await option.click();
    await expect(this.contributorChip(name)).toBeVisible({ timeout: 10_000 });
    await this.closeContributorDropdown();
    return name;
  }

  async submitCreate(): Promise<void> {
    await this.submitCreateButton.scrollIntoViewIfNeeded();
    await this.submitCreateButton.click();
    await expect(this.page).toHaveURL(/\/thinkspace\/thought\/workspace\?meeting=/, { timeout: 120_000 });
    await expect(this.createModal).toBeHidden({ timeout: 10_000 });
    await waitForPageReady(this.page);
    await waitForSpinnerToDisappear(this.page);
  }

  async cancelCreate(): Promise<void> {
    await this.cancelCreateButton.click();
    await expect(this.createModal).toBeHidden();
  }

  meetingCard(title: string) {
    return this.page.locator('article.thought-card').filter({ hasText: title });
  }

  async expectMeetingInList(title: string): Promise<void> {
    await expect(this.meetingCard(title)).toBeVisible({ timeout: 30_000 });
  }

  async searchMeetings(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async expectNoSearchMatches(): Promise<void> {
    await expect(this.page.getByText('No meetings match your search.')).toBeVisible();
  }

  async openMeetingWorkspace(title: string): Promise<void> {
    const card = this.meetingCard(title);
    await card.getByRole('link', { name: 'Open' }).click();
    await waitForPageReady(this.page);
  }

  async openActionLogsModal(title: string): Promise<void> {
    await this.meetingCard(title).getByRole('button', { name: 'Action Logs' }).click();
    await expect(this.page.getByRole('dialog').filter({ hasText: 'Meeting Action Logs' })).toBeVisible();
  }

  async openCommentsModal(title: string): Promise<void> {
    await this.meetingCard(title).getByRole('button', { name: 'Comments' }).click();
    await expect(this.page.getByRole('dialog').filter({ hasText: 'Meeting Comments' })).toBeVisible();
  }

  async setRsvp(title: string, status: 'accepted' | 'tentative' | 'declined'): Promise<void> {
    await this.meetingCard(title).getByRole('button', { name: status, exact: true }).click();
  }

  async closeLogsModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.page.getByRole('dialog').filter({ hasText: /Meeting (Comments|Action Logs)/ })).toBeHidden();
  }
}

export function createThoughtListPage(page: Page): ThoughtListPage {
  return new ThoughtListPage(page);
}
