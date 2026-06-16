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

test.describe('F. Detail & lifecycle @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR09')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR09');
    const title = uniqueProjectTitle('Detail Tabs');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.fillDescription('Detail modal tab walkthrough.');
    await projectsPage.clickSaveDraft();
    await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectDetailTitle(title);
    await projectsPage.expectDetailWorkflowStage('Draft');

    await projectsPage.switchDetailTab('Actions');
    await expect(projectsPage.page.getByRole('button', { name: 'Add Action' })).toBeVisible();

    await projectsPage.switchDetailTab('Milestones');
    await expect(projectsPage.page.getByRole('button', { name: 'Add Milestone' })).toBeVisible();

    await projectsPage.switchDetailTab('Comments');
    await expect(projectsPage.page.getByPlaceholder('Type your comment/activity update here...')).toBeVisible();

    await projectsPage.closeDetailModal();
  });

  test(`${projectsTestTitle('P-PR10')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR10');
    const title = uniqueProjectTitle('Edit Draft');
    const updatedTitle = `${title} Updated`;

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.clickEditOnProject(title);
    await projectsPage.fillTitle(updatedTitle);
    await projectsPage.clickSaveDraft();

    await projectsPage.expectProjectInList(updatedTitle, 'Draft');
    await projectsPage.expectProjectNotInList(title);

    const project = await thinkspaceProjectApi.findProjectByTitle(updatedTitle);
    expect(project?.title).toBe(updatedTitle);
  });

  test(`${projectsTestTitle('P-PR11')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR11');
    const title = uniqueProjectTitle('Delete Me');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.clickDeleteOnProject(title, true);

    thinkspace.createdProjectIds.splice(thinkspace.createdProjectIds.indexOf(projectId), 1);
    const deleted = await thinkspaceProjectApi.findProjectByTitle(title);
    expect(deleted).toBeUndefined();
  });
});
