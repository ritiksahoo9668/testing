import { projectsTest as test, expect } from '../../../src/fixtures/projects.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import {
  THINKSPACE_LAUNCHER_TILES,
} from '../../../src/pages/thinkspace/ThinkspaceHubPage.js';

test.describe('Thinkspace hub & dock launcher @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test('hub landing shows dock hint and Thinkspace dock icon @positive', async ({ thinkspaceHubPage }) => {
    await thinkspaceHubPage.open();
    await thinkspaceHubPage.expectLoaded();
  });

  test('dock launcher opens above dock and lists Office Tools tiles @positive', async ({ thinkspaceHubPage }) => {
    await thinkspaceHubPage.open();
    await thinkspaceHubPage.openDockLauncher();

    for (const label of [
      THINKSPACE_LAUNCHER_TILES.action,
      THINKSPACE_LAUNCHER_TILES.projects,
      THINKSPACE_LAUNCHER_TILES.thought,
      THINKSPACE_LAUNCHER_TILES.travel,
    ]) {
      await expect(thinkspaceHubPage.launcherTile(label)).toBeVisible();
    }
  });

  test('dock launcher navigates to Projects and closes @positive', async ({
    thinkspaceHubPage,
    projectsPage,
  }) => {
    await thinkspaceHubPage.open();
    await thinkspaceHubPage.openModuleFromLauncher(THINKSPACE_LAUNCHER_TILES.projects);
    await projectsPage.expectLoaded();
    await expect(projectsPage.page).toHaveURL(/\/thinkspace\/projects/);
  });

  test('dock launcher search filters tiles @positive', async ({ thinkspaceHubPage }) => {
    await thinkspaceHubPage.open();
    await thinkspaceHubPage.openDockLauncher();
    await thinkspaceHubPage.dockLauncherSearch.fill('Travel');
    await expect(thinkspaceHubPage.launcherTile(THINKSPACE_LAUNCHER_TILES.travel)).toBeVisible();
    await expect(thinkspaceHubPage.launcherTile(THINKSPACE_LAUNCHER_TILES.projects)).toBeHidden();
  });
});
