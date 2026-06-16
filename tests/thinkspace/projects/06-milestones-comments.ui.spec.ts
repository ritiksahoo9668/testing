import { projectsTest as test, expect } from '../../../src/fixtures/projects.js';
import { registerProjectId } from '../../../src/fixtures/projects.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateProjectsTestCase, projectsTestTitle } from '../../../src/utils/projects-test-case.js';
import { uniqueProjectTitle } from '../../../src/data/thinkspace/project-factory.js';

async function trackCreatedProject(
  thinkspace: { createdProjectIds: number[] },
  thinkspaceProjectApi: { findProjectByTitle: (title: string) => Promise<{ id?: number } | undefined> },
  title: string,
): Promise<number> {
  const project = await thinkspaceProjectApi.findProjectByTitle(title);
  expect(project?.id).toBeTruthy();
  registerProjectId(thinkspace, project!.id!);
  return project!.id!;
}

test.describe('F. Milestones & comments @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR13')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR13');
    const title = uniqueProjectTitle('Milestone CRUD');
    const milestoneTitle = uniqueProjectTitle('Phase Alpha');
    const updatedTitle = `${milestoneTitle} Revised`;

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectMilestonesEmptyState();

    await projectsPage.addMilestone(milestoneTitle, 'Active', {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await projectsPage.expectMilestoneInTable(milestoneTitle, 'Active');

    await projectsPage.editMilestone(milestoneTitle, { title: updatedTitle, status: 'Completed' });
    await projectsPage.expectMilestoneInTable(updatedTitle, 'Completed');

    await projectsPage.deleteMilestone(updatedTitle, true);
    await projectsPage.expectMilestonesEmptyState();

    await projectsPage.closeDetailModal();
  });

  test(`${projectsTestTitle('P-PR14')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR14');
    const title = uniqueProjectTitle('Comments Log');
    const comment = `Workflow update ${Date.now()}`;

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectCommentsEmptyState();
    await projectsPage.postDetailComment(comment);
    await expect(projectsPage.detailModal.getByText('Current User')).toBeVisible();

    await projectsPage.closeDetailModal();
  });
});
