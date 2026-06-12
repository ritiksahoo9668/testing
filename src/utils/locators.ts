import type { Locator, Page } from '@playwright/test';

export const LocatorStrategy = {
  byTestId: (id: string) => `[data-testid="${id}"]`,
  byRole: (role: string, name?: string | RegExp) =>
    name ? { role, name } : { role },
  byLabel: (label: string | RegExp) => ({ label }),
  byPlaceholder: (placeholder: string | RegExp) => ({ placeholder }),
  byText: (text: string | RegExp) => ({ text }),
  byId: (id: string) => `#${id}`,
  byName: (name: string) => `[name="${name}"]`,
} as const;

export function getByStableId(page: Page, id: string): Locator {
  return page.locator(LocatorStrategy.byId(id));
}

export function getFormField(page: Page, fieldName: string): Locator {
  return page.locator(LocatorStrategy.byName(fieldName));
}

export function getDialog(page: Page, ariaLabel?: string | RegExp): Locator {
  return ariaLabel
    ? page.getByRole('dialog', { name: ariaLabel })
    : page.getByRole('dialog');
}

export function getTable(page: Page): Locator {
  return page.locator('table');
}

export function getAlert(page: Page): Locator {
  return page.getByRole('status');
}

export function getPrimaryButton(page: Page, name: string | RegExp): Locator {
  return page.getByRole('button', { name });
}

export function getLink(page: Page, name: string | RegExp): Locator {
  return page.getByRole('link', { name });
}

export function getNavigation(page: Page, name?: string | RegExp): Locator {
  return name ? page.getByRole('navigation', { name }) : page.getByRole('navigation');
}
