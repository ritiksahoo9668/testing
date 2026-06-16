import { projectsTest as test, expect } from '../../../src/fixtures/projects.js';
import { registerProjectId } from '../../../src/fixtures/projects.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateProjectsTestCase, projectsTestTitle } from '../../../src/utils/projects-test-case.js';
import { uniqueProjectTitle } from '../../../src/data/thinkspace/project-factory.js';

test.describe('G. Negative validation @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('N-PR02')} @negative`, async ({ projectsPage }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR02');
    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillTitle('');
    await projectsPage.expectSaveButtonsDisabled();
    await projectsPage.clickCancelCreate();
  });

  test(`${projectsTestTitle('N-PR03')} @negative`, async ({ projectsPage }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR03');
    const title = uniqueProjectTitle('Action Validation');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.openActionItemForm();
    await projectsPage.saveActionItem();
    await projectsPage.expectToast('Validation Error');
    await expect(projectsPage.createModal.getByRole('cell')).toHaveCount(0);
    await projectsPage.clickCancelCreate();
  });

  test(`${projectsTestTitle('N-PR04')} @negative`, async ({ projectsPage, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR04');
    const title = uniqueProjectTitle('Cancelled Create');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickCancelCreate();
    await expect(projectsPage.page.getByRole('status').filter({ hasText: 'Draft saved' })).toHaveCount(0);

    const project = await thinkspaceProjectApi.findProjectByTitle(title);
    expect(project).toBeUndefined();
  });

  test(`${projectsTestTitle('N-PR05')} @negative`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR05');
    const title = uniqueProjectTitle('Keep After Cancel Delete');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    const project = await thinkspaceProjectApi.findProjectByTitle(title);
    registerProjectId(thinkspace, project!.id!);

    await projectsPage.clickDeleteOnProject(title, false);
    await projectsPage.expectProjectInList(title, 'Draft');
  });

  test(`${projectsTestTitle('N-PR06')} @negative`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR06');
    const title = uniqueProjectTitle('Empty Comment');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    registerProjectId(thinkspace, (await thinkspaceProjectApi.findProjectByTitle(title))!.id!);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectPostCommentDisabled();
    await projectsPage.closeDetailModal();
  });

  test(`${projectsTestTitle('N-PR07')} @negative`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR07');
    const title = uniqueProjectTitle('Milestone Validation');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    registerProjectId(thinkspace, (await thinkspaceProjectApi.findProjectByTitle(title))!.id!);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectMilestoneSaveDisabled();
    await projectsPage.cancelMilestoneForm();
    await projectsPage.closeDetailModal();
  });

  test(`${projectsTestTitle('N-PR08')} @negative`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'N-PR08');
    const title = uniqueProjectTitle('Cancel Milestone');
    const milestoneTitle = uniqueProjectTitle('Cancelled Phase');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.clickSaveDraft();
    registerProjectId(thinkspace, (await thinkspaceProjectApi.findProjectByTitle(title))!.id!);

    await projectsPage.openProjectDetail(title);
    await projectsPage.openMilestoneForm();
    await projectsPage.fillMilestoneForm({ title: milestoneTitle, status: 'Planning' });
    await projectsPage.cancelMilestoneForm();
    await projectsPage.expectMilestonesEmptyState();
    await projectsPage.closeDetailModal();
  });
});
