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

test.describe('B. Create draft @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR02')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR02');
    const title = uniqueProjectTitle('Draft');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.fillDescription('E2E draft project description.');
    await projectsPage.clickSaveDraft();

    await projectsPage.expectProjectInList(title, 'Draft');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.workflow_stage).toBe('Draft');
    expect(body.data?.status).toBe('Planning');
  });
});

test.describe('C. Submit workflow @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${projectsTestTitle('P-PR03')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR03');
    const title = uniqueProjectTitle('Under Review');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.fillEstimatedCost('100000');
    await projectsPage.clickSubmitRequest();

    await projectsPage.expectProjectInList(title, 'Under Review');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);
    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.workflow_stage).toBe('Under Review');
    expect(body.data?.status).toBe('Active');
  });

  test(`${projectsTestTitle('P-PR04')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR04');
    const title = uniqueProjectTitle('Finance Review');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.fillEstimatedCost('600000');
    await projectsPage.clickSubmitRequest();

    await projectsPage.expectProjectInList(title, 'Finance Review');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);
    await projectsPage.openProjectDetail(title);
    await projectsPage.expectWorkflowTrackerContains('Finance Approval');
    await projectsPage.closeDetailModal();

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.workflow_stage).toBe('Finance Review');
  });

  test(`${projectsTestTitle('P-PR05')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR05');
    const title = uniqueProjectTitle('Compliance Review');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.fillEstimatedCost('250000');
    await projectsPage.setStatutoryRequired(true);
    await projectsPage.setStatutoryApp('legal', true, 'Legal clearance required');
    await projectsPage.setStatutoryApp('compliance', true, 'Compliance sign-off');
    await projectsPage.clickSubmitRequest();

    await projectsPage.expectProjectInList(title, 'Compliance Review');
    const projectId = await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);
    await projectsPage.openProjectDetail(title);
    await projectsPage.expectDetailWorkflowStage('Compliance Review');
    await projectsPage.expectWorkflowTrackerContains('Statutory / Compliance Approval');
    await projectsPage.closeDetailModal();

    const { body } = await thinkspaceProjectApi.getProject(projectId);
    expect(body.data?.workflow_stage).toBe('Compliance Review');
    expect(body.data?.statutory_approval_required).toBe(true);
  });

  test(`${projectsTestTitle('P-PR12')} @positive`, async ({ projectsPage, thinkspace, thinkspaceProjectApi }, testInfo) => {
    annotateProjectsTestCase(testInfo, 'P-PR12');
    const title = uniqueProjectTitle('Tracker Statutory');

    await projectsPage.open();
    await projectsPage.openCreateModal();
    await projectsPage.fillRequiredFields(title);
    await projectsPage.setStatutoryRequired(true);
    await projectsPage.setStatutoryApp('management', true);
    await projectsPage.clickSubmitRequest();

    await projectsPage.expectProjectInList(title, 'Compliance Review');
    await trackCreatedProject(thinkspace, thinkspaceProjectApi, title);
    await projectsPage.expectWorkflowTrackerContains('Statutory / Compliance Approval');
  });
});
