import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';
import { uniqueMeetingTitle } from '../../../src/data/thinkspace/thought-factory.js';
import { ensureMeetingWorkspaceReady, registerCreatedMeeting } from '../../../src/utils/thought-workspace-setup.js';

async function createMeetingAndOpen(
  thoughtListPage: { open: () => Promise<void>; openCreateModal: () => Promise<void>; fillTitle: (t: string) => Promise<void>; submitCreate: () => Promise<void> },
  thoughtWorkspacePage: Parameters<typeof ensureMeetingWorkspaceReady>[0],
  thoughtApi: Parameters<typeof ensureMeetingWorkspaceReady>[1],
  thinkspace: Parameters<typeof ensureMeetingWorkspaceReady>[2],
  title: string,
  options: { requireCanvas?: boolean } = {},
): Promise<string> {
  await thoughtListPage.open();
  await thoughtListPage.openCreateModal();
  await thoughtListPage.fillTitle(title);
  await thoughtListPage.submitCreate();
  if (options.requireCanvas) {
    return ensureMeetingWorkspaceReady(thoughtWorkspacePage, thoughtApi, thinkspace, title);
  }
  await thoughtWorkspacePage.expectLoaded();
  return registerCreatedMeeting(thoughtApi, thinkspace, title);
}

test.describe('D. Workspace & canvas @thinkspace @authenticated', () => {
  test.setTimeout(180_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH11')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH11');
    const title = uniqueMeetingTitle('Canvas Child');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title, { requireCanvas: true });
    await thoughtWorkspacePage.addChildNode(title);
    await expect(thoughtWorkspacePage.childNode(0)).toBeVisible();
  });

  test(`${thoughtTestTitle('P-TH12')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH12');
    const title = uniqueMeetingTitle('Context Menu');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title, { requireCanvas: true });
    await thoughtWorkspacePage.addChildNode(title);
    const child = thoughtWorkspacePage.childNode(0);
    await thoughtWorkspacePage.openContextMenuOnNode(child);
    await thoughtWorkspacePage.contextMenuAction('Create sibling node');
    await expect(thoughtWorkspacePage.childNode(1)).toBeVisible({ timeout: 15_000 });
  });

  test(`${thoughtTestTitle('P-TH13')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH13');
    const title = uniqueMeetingTitle('Undo Redo');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title, { requireCanvas: true });
    await thoughtWorkspacePage.addChildNode(title);
    await expect(thoughtWorkspacePage.childNode(0)).toBeVisible();
    await thoughtWorkspacePage.clickUndo();
    await expect(thoughtWorkspacePage.childNodes).toHaveCount(0, { timeout: 15_000 });
    await thoughtWorkspacePage.clickRedo();
    await expect(thoughtWorkspacePage.childNode(0)).toBeVisible({ timeout: 15_000 });
  });

  test(`${thoughtTestTitle('P-TH14')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH14');
    const title = uniqueMeetingTitle('Node Search');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);
    await thoughtWorkspacePage.searchNodes(title);
    await expect(thoughtWorkspacePage.nodeSearchInput).toHaveValue(title);
  });

  test(`${thoughtTestTitle('P-TH15')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH15');
    const title = uniqueMeetingTitle('Zoom');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title, { requireCanvas: true });
    await thoughtWorkspacePage.zoomIn(title);
    await thoughtWorkspacePage.zoomOut(title);
    await thoughtWorkspacePage.fitCanvas(title);
    await expect(thoughtWorkspacePage.page.getByRole('button', { name: 'Fit canvas' })).toBeVisible();
  });

  test(`${thoughtTestTitle('P-TH16')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH16');
    const title = uniqueMeetingTitle('Dock');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title, { requireCanvas: true });
    await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
    await expect(thoughtWorkspacePage.logsTablist).toBeVisible();
    await thoughtWorkspacePage.selectDockTool('AI Summary');
    await thoughtWorkspacePage.expectAiSummaryPanel();
    await thoughtWorkspacePage.selectDockTool('Canvas');
    await thoughtWorkspacePage.waitForCanvasReady(title);
    await expect(thoughtWorkspacePage.centralNode).toBeVisible();
  });

  test(`${thoughtTestTitle('P-TH17')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH17');
    const title = uniqueMeetingTitle('Contributors');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);
    await thoughtWorkspacePage.openContributorsPanel();
  });

  test(`${thoughtTestTitle('P-TH27')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH27');
    const title = uniqueMeetingTitle('Back Nav');
    await createMeetingAndOpen(thoughtListPage, thoughtWorkspacePage, thoughtApi, thinkspace, title);
    await thoughtWorkspacePage.backLink.click();
    await expect(thoughtWorkspacePage.page).toHaveURL(/\/thinkspace\/task/);
  });
});
