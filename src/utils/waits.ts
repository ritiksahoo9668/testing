import type { Locator, Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

export async function waitForSpinnerToDisappear(page: Page): Promise<void> {
  const spinner = page.locator('.animate-spin');
  if (await spinner.count()) {
    await expect(spinner.first()).toBeHidden({ timeout: 30_000 });
  }
}

export async function waitForDialog(page: Page, visible = true): Promise<Locator> {
  const dialog = page.getByRole('dialog');
  if (visible) {
    await expect(dialog).toBeVisible();
  } else {
    await expect(dialog).toBeHidden();
  }
  return dialog;
}

export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  status = 200,
): Promise<Response> {
  const response = await page.waitForResponse(
    (res) => {
      const matches =
        typeof urlPattern === 'string'
          ? res.url().includes(urlPattern)
          : urlPattern.test(res.url());
      return matches && res.status() === status;
    },
    { timeout: 30_000 },
  );
  return response;
}

export async function waitForToast(page: Page, message?: string | RegExp): Promise<Locator> {
  const toast = page.locator('[role="status"], [aria-live="polite"], [aria-live="assertive"]');
  await expect(toast.first()).toBeVisible();
  if (message) {
    await expect(toast.filter({ hasText: message }).first()).toBeVisible();
  }
  return toast.first();
}

export async function retryAction<T>(
  action: () => Promise<T>,
  attempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
