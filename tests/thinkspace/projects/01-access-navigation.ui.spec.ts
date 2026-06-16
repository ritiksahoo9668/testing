import { projectsTest as test, expect } from '../../../src/fixtures/projects.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateProjectsTestCase, projectsTestTitle } from '../../../src/utils/projects-test-case.js';
import { uniqueProjectTitle } from '../../../src/data/thinkspace/project-factory.js';

test.describe('A. Projects access & navigation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR01')} @positive`, async ({ projectsPage }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR01');
    await projectsPage.open('/thinkspace/projects');
    await projectsPage.expectLoaded();
    await expect(projectsPage.page).toHaveURL(/\/thinkspace\/projects/);
    await expect(projectsPage.recentHeading).toBeVisible();
  });
});

test.describe('A. Projects access (guest) @thinkspace @unauthenticated', () => {
  test(`${projectsTestTitle('N-PR01')} @negative`, async ({ page }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR01');
    await page.goto('/thinkspace/projects');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
