import { expect, type Locator, type Page } from '@playwright/test';

export async function assertVisible(locator: Locator, message?: string): Promise<void> {
  await expect(locator, message).toBeVisible();
}

export async function assertHidden(locator: Locator, message?: string): Promise<void> {
  await expect(locator, message).toBeHidden();
}

export async function assertText(locator: Locator, text: string | RegExp): Promise<void> {
  await expect(locator).toContainText(text);
}

export async function assertUrl(page: Page, pattern: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(pattern);
}

export async function assertTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(title);
}

export async function assertEnabled(locator: Locator): Promise<void> {
  await expect(locator).toBeEnabled();
}

export async function assertDisabled(locator: Locator): Promise<void> {
  await expect(locator).toBeDisabled();
}

export async function assertCount(locator: Locator, count: number): Promise<void> {
  await expect(locator).toHaveCount(count);
}

export function assertJsonEnvelopeSuccess(body: unknown): void {
  expect(body).toMatchObject({ status: 'success' });
}

export async function assertHealthPayload(body: Record<string, unknown>): Promise<void> {
  expect(body).toHaveProperty('ok');
  expect(body).toHaveProperty('checks');
}
