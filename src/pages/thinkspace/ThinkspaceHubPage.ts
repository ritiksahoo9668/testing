import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { waitForPageReady } from '../../utils/waits.js';

/** Dock launcher tile labels — match `flows.thinkspace.*` in en.json */
export const THINKSPACE_LAUNCHER_TILES = {
  action: 'Action',
  projects: 'Projects',
  thought: 'Thought',
  travel: 'Travel',
  agendas: 'Agendas',
  calendar: 'Calendar',
} as const;

export type ThinkspaceLauncherTileLabel =
  (typeof THINKSPACE_LAUNCHER_TILES)[keyof typeof THINKSPACE_LAUNCHER_TILES];

/**
 * Thinkspace hub landing (`/thinkspace`) and dock app launcher navigation.
 */
export class ThinkspaceHubPage extends BasePage {
  readonly hubHeading = this.page.getByRole('heading', { name: /^Thinkspace$/i });
  readonly hubDockHint = this.page.getByText(
    /Tap Thinkspace in the bottom dock|search or pick a tile/i,
  );
  readonly dockNav = this.page.getByRole('navigation', { name: /Main modules/i });
  readonly dockThinkspaceLink = this.dockNav.getByRole('link', { name: /Thinkspace/i });
  /** Title varies (`Thinkspace Apps` vs `Home Apps`) — scope by launcher search field instead. */
  readonly dockLauncherDialog = this.page
    .getByRole('dialog')
    .filter({ has: this.page.getByPlaceholder('Search apps...') });
  readonly dockLauncherSearch = this.dockLauncherDialog.getByPlaceholder('Search apps...');

  async open(path = '/thinkspace'): Promise<void> {
    await this.goto(path);
    await waitForPageReady(this.page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/thinkspace\/?$/);
    await expect(this.hubHeading).toBeVisible({ timeout: 30_000 });
    await expect(this.hubDockHint).toBeVisible();
    await expect(this.dockThinkspaceLink).toBeVisible();
  }

  async expectDockLauncherOpen(): Promise<void> {
    await expect(this.dockLauncherDialog).toBeVisible({ timeout: 15_000 });
    await expect(this.dockLauncherSearch).toBeVisible();
    await expect(this.launcherTile(THINKSPACE_LAUNCHER_TILES.action)).toBeVisible({ timeout: 10_000 });
  }

  async expectDockLauncherClosed(): Promise<void> {
    await expect(this.dockLauncherDialog).toBeHidden({ timeout: 15_000 });
  }

  async openDockLauncher(): Promise<void> {
    const markerTile = this.launcherTile(THINKSPACE_LAUNCHER_TILES.action);

    if (await this.dockLauncherDialog.isVisible().catch(() => false)) {
      if (await markerTile.isVisible().catch(() => false)) {
        return;
      }
      await this.closeDockLauncher();
    }

    await this.dockThinkspaceLink.click();
    await this.expectDockLauncherOpen();
  }

  async closeDockLauncher(): Promise<void> {
    if (!(await this.dockLauncherDialog.isVisible().catch(() => false))) {
      return;
    }

    await this.dockLauncherDialog.getByRole('button', { name: 'Close' }).click();
    await this.expectDockLauncherClosed();
  }

  launcherTile(moduleLabel: ThinkspaceLauncherTileLabel | string) {
    return this.dockLauncherDialog.getByRole('link', { name: moduleLabel, exact: true });
  }

  async openModuleFromLauncher(moduleLabel: ThinkspaceLauncherTileLabel | string): Promise<void> {
    await this.openDockLauncher();
    const tile = this.launcherTile(moduleLabel);
    await expect(tile).toBeVisible({ timeout: 10_000 });
    await tile.click();
    await this.expectDockLauncherClosed();
  }

  async returnToHub(): Promise<void> {
    await this.open('/thinkspace');
    await this.expectLoaded();
  }
}

export function createThinkspaceHubPage(page: Page): ThinkspaceHubPage {
  return new ThinkspaceHubPage(page);
}
