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

test.describe('D. Statutory approvals @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR06')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR06');
    const title = uniqueProjectTitle('Statutory Draft');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.setStatutoryRequired(true);
    await expect(projectsPage.createModal.getByRole('checkbox', { name: /legal app/i })).toBeVisible();
    await projectsPage.setStatutoryApp('legal', true, 'Board legal review');
    await projectsPage.setStatutoryApp('compliance', true, 'Regulatory compliance');
    await projectsPage.clickSaveDraft();

    await projectsPage.expectProjectInList(title, 'Draft');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectStatutoryInOverview('legal', 'Board legal review');
    await projectsPage.expectStatutoryInOverview('compliance', 'Regulatory compliance');
    await projectsPage.closeDetailModal();

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.statutory_approval_required).toBe(true);
    expect(body.data?.statutory_approvals_meta?.legal?.enabled).toBe(true);
    expect(body.data?.statutory_approvals_meta?.compliance?.remarks).toBe('Regulatory compliance');
  });
});

test.describe('E. Action items @thinkspace @authenticated', () => {
  test.setTimeout(180_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR07')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR07');
    const title = uniqueProjectTitle('Action Items Draft');
    const actionName = `Setup milestone ${Date.now()}`;

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.addActionItem({ name: actionName, priority: 'High' });
    await projectsPage.clickSaveDraft();

    await projectsPage.expectProjectInList(title, 'Draft');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.action_items?.length).toBe(1);
    expect(body.data?.action_items?.[0]?.name).toBe(actionName);
    expect(body.data?.action_items?.[0]?.priority).toBe('High');
  });

  test(`${projectsTestTitle('P-PR08')} @positive`, async (
    { projectsPage, thinkspace, thinkspaceProjectApi, thinkspaceTaskApi },
    testInfo,
  ) => {
    annotateProjectsTestCase(testInfo, 'P-PR08');
    const title = uniqueProjectTitle('Action Convert');
    const actionName = `Deliverable ${Date.now()}`;

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.addActionItem({ name: actionName, priority: 'Medium' });
    await projectsPage.clickSubmitRequest();

    await projectsPage.expectProjectInList(title, 'Under Review');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    const actionItem = body.data?.action_items?.[0];
    expect(actionItem?.converted).toBe(true);
    expect(actionItem?.task_id).toBeTruthy();
    if (actionItem?.task_id) {
      thinkspace.createdTaskIds.push(actionItem.task_id);
    }

    await projectsPage.openProjectDetail(title);
    await projectsPage.expectActionInDetailTab(actionName);
    await projectsPage.closeDetailModal();

    const task = await thinkspaceTaskApi.findTaskByTitle(actionName);
    expect(task?.task_title).toBe(actionName);
    if (task?.id) thinkspace.createdTaskIds.push(task.id);
  });
});
