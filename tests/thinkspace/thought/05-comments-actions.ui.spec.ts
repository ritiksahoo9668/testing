import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';
import { uniqueMeetingTitle } from '../../../src/data/thinkspace/thought-factory.js';
import { ensureMeetingWorkspaceReady } from '../../../src/utils/thought-workspace-setup.js';

async function setupWorkspace(
  thoughtListPage: {
    open: () => Promise<void>;
    openCreateModal: () => Promise<void>;
    fillTitle: (t: string) => Promise<void>;
    submitCreate: () => Promise<void>;
  },
  thoughtWorkspacePage: Parameters<typeof ensureMeetingWorkspaceReady>[0],
  thoughtApi: Parameters<typeof ensureMeetingWorkspaceReady>[1],
  thinkspace: Parameters<typeof ensureMeetingWorkspaceReady>[2],
  title: string,
): Promise<void> {
  await thoughtListPage.open();
  await thoughtListPage.openCreateModal();
  await thoughtListPage.fillTitle(title);
  await thoughtListPage.submitCreate();
  await ensureMeetingWorkspaceReady(thoughtWorkspacePage, thoughtApi, thinkspace, title);
  await thoughtWorkspacePage.addChildNode(title);
}

test.describe('E. Comments & actions @thinkspace @authenticated', () => {
  test.setTimeout(240_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH18')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH18');
    const title = uniqueMeetingTitle('Comment');
    const comment = `E2E comment ${Date.now()}`;
    await setupWorkspace(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);

    await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.childNode(0));
    await thoughtWorkspacePage.contextMenuAction('Add comment');
    await thoughtWorkspacePage.addComment(comment);
    await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
    await thoughtWorkspacePage.expectLogEntryText(comment);
  });

  test(`${thoughtTestTitle('N-TH03')} @negative`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'N-TH03');
    const title = uniqueMeetingTitle('Action Validation');
    await setupWorkspace(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);

    await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.childNode(0));
    await thoughtWorkspacePage.openCreateActionModalFromContext();
    await thoughtWorkspacePage.submitCreateAction();
    await thoughtWorkspacePage.expectCreateActionError(/Select at least one assignee/i);
  });

  test(`${thoughtTestTitle('P-TH19')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi, thinkspaceTaskApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH19');
    const title = uniqueMeetingTitle('Create Action');
    const actionTitle = `Thought action ${Date.now()}`;
    await setupWorkspace(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);

    await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.childNode(0));
    await thoughtWorkspacePage.openCreateActionModalFromContext();
    await thoughtWorkspacePage.fillCreateActionTitle(actionTitle);
    await thoughtWorkspacePage.selectFirstAssignee();
    await thoughtWorkspacePage.submitCreateAction();
    await expect(thoughtWorkspacePage.createActionModal).toBeHidden({ timeout: 30_000 });

    const task = await thinkspaceTaskApi.findTaskByTitle(actionTitle);
    expect(task?.task_title).toBe(actionTitle);
    if (task?.id) thinkspace.createdTaskIds.push(task.id);
  });

  test(`${thoughtTestTitle('P-TH20')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH20');
    const title = uniqueMeetingTitle('Action Log Panel');
    const actionTitle = `Log action ${Date.now()}`;
    await setupWorkspace(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);

    await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.childNode(0));
    await thoughtWorkspacePage.openCreateActionModalFromContext();
    await thoughtWorkspacePage.fillCreateActionTitle(actionTitle);
    await thoughtWorkspacePage.selectFirstAssignee();
    await thoughtWorkspacePage.submitCreateAction();
    await expect(thoughtWorkspacePage.createActionModal).toBeHidden({ timeout: 30_000 });

    await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
    await thoughtWorkspacePage.expectActionInLogs();
  });

  test(`${thoughtTestTitle('P-TH21')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH21');
    const title = uniqueMeetingTitle('Comment Log Panel');
    const comment = `Panel comment ${Date.now()}`;
    await setupWorkspace(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);

    await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.childNode(0));
    await thoughtWorkspacePage.contextMenuAction('Add comment');
    await thoughtWorkspacePage.addComment(comment);

    await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
    await thoughtWorkspacePage.switchLogsTab('Comments');
    await thoughtWorkspacePage.expectLogEntryText(comment);
  });
});
