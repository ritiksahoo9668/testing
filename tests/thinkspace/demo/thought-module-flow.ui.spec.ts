import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { uniqueMeetingTitle, uniqueNodeLabel } from '../../../src/data/thinkspace/thought-factory.js';
import { getThoughtFlowDemoSteps } from '../../../src/data/thinkspace/load-thought-flow-demo.js';
import { demoPause } from '../../../src/utils/demo-pause.js';
import {
  ensureMeetingWorkspaceReady,
  registerCreatedMeeting,
} from '../../../src/utils/thought-workspace-setup.js';

const materialFixture = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../src/data/demo/1. Material Mater JSON .txt',
);

/**
 * Thinkspace Thought — complete headed walkthrough for demo video.
 * Steps mirror thought-flow-demo.json (sections A–H).
 *
 * Run: npm run demo:thinkspace-thought
 */
test.describe('Thinkspace Thought — complete flow video @demo @thinkspace', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(900_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test('Thought full workflow (list → create → open → canvas → materials → export → cleanup)', async (
    {
      thoughtListPage,
      thoughtWorkspacePage,
      thoughtAnalyticsPage,
      thinkspace,
      thoughtApi,
      thinkspaceTaskApi,
      page,
    },
    testInfo,
  ) => {
    const flowSteps = getThoughtFlowDemoSteps();
    for (const step of flowSteps) {
      testInfo.annotations.push({
        type: `Flow ${step.order}`,
        description: `[${step.section}] ${step.title} — ${step.matrixCases.join(', ')} — ${step.crud}`,
      });
    }

    const meetingTitle = uniqueMeetingTitle('Demo Meeting');
    const nodeLabel = uniqueNodeLabel('Demo Node');
    const commentText = `Demo comment ${Date.now()}`;
    const actionTitle = `Demo action ${Date.now()}`;
    const commentActionTitle = `Comment action ${Date.now()}`;
    let meetingId = '';

    await test.step('1. [A] Open Meeting Notes list (P-TH01)', async () => {
      await thoughtListPage.open('/thinkspace/thought');
      await thoughtListPage.expectLoaded();
      await demoPause(page);
    });

    await test.step('2. [A] Preview Meeting intelligence (P-TH02)', async () => {
      await thoughtListPage.intelligenceLink.click();
      await thoughtAnalyticsPage.expectLoaded();
      await thoughtAnalyticsPage.expectStatsVisible();
      await demoPause(page);
      await thoughtAnalyticsPage.backLink.click();
      await thoughtListPage.expectLoaded();
      await demoPause(page);
    });

    await test.step('3. [H] Create modal — empty title guard (N-TH02)', async () => {
      await thoughtListPage.openCreateModal();
      const valid = await thoughtListPage.titleInput.evaluate((el: HTMLInputElement) => el.checkValidity());
      expect(valid).toBe(false);
      await demoPause(page);
      await thoughtListPage.cancelCreate();
    });

    await test.step('4. [B] Fill meeting title (P-TH03)', async () => {
      await thoughtListPage.openCreateModal();
      await thoughtListPage.fillTitle(meetingTitle);
      await demoPause(page);
    });

    await test.step('5. [B] Set meeting date (P-TH04)', async () => {
      const { datetimeLocalOffset } = await import('../../../src/data/thinkspace/thought-factory.js');
      await thoughtListPage.fillDateLocal(datetimeLocalOffset(48));
      await demoPause(page);
    });

    await test.step('6. [B] Add contributor from directory (P-TH29)', async () => {
      await thoughtListPage.openContributorDropdown();
      await demoPause(page);
      await thoughtListPage.searchContributor('Demo');
      const firstOption = thoughtListPage.contributorListbox.locator('button.thought-contributor-combobox__option').first();
      await expect(firstOption).toBeVisible({ timeout: 10_000 });
      await firstOption.click();
      await demoPause(page);
    });

    await test.step('7. [B] Set contributor access to Editor (P-TH30)', async () => {
      await thoughtListPage.closeContributorDropdown();
      const chip = thoughtListPage.createForm.locator('ul.flex.flex-wrap li').first();
      const name = (await chip.locator('span.font-medium').innerText().catch(() => '')).trim();
      if (name) {
        await thoughtListPage.setContributorAccess(name, 'Editor');
        await demoPause(page);
      }
    });

    await test.step('8. [B] Add guest contributor (P-TH31)', async () => {
      const guestName = `Demo Guest ${Date.now()}`;
      await thoughtListPage.addGuestContributor(guestName, `demo.guest@demo.local`);
      await demoPause(page);
    });

    await test.step('9. [B] Agenda, submit, return to list (P-TH04)', async () => {
      await thoughtListPage.fillAgenda('Demo walkthrough agenda for Thought module.');
      await thoughtListPage.submitCreate();
      await thoughtWorkspacePage.expectLoaded();
      await thoughtWorkspacePage.expectTitleVisible(meetingTitle);
      meetingId = await registerCreatedMeeting(thoughtApi, thinkspace, meetingTitle);
      await demoPause(page);
      await thoughtListPage.open();
      await thoughtListPage.searchMeetings(meetingTitle);
      await thoughtListPage.expectMeetingInList(meetingTitle);
      await demoPause(page);
    });

    await test.step('10. [C] Open workspace from meeting card (P-TH10)', async () => {
      await thoughtListPage.openMeetingWorkspace(meetingTitle);
      meetingId = await ensureMeetingWorkspaceReady(thoughtWorkspacePage, thoughtApi, thinkspace, meetingTitle);
      await demoPause(page);
    });

    await test.step('11. [D] Dock panels — Canvas, Logs, AI (P-TH16)', async () => {
      await thoughtWorkspacePage.cycleDockTools(meetingTitle);
      await demoPause(page);
    });

    await test.step('12. [D] Central node — context menu and create child (P-TH11)', async () => {
      await thoughtWorkspacePage.openContextMenuOnNode(thoughtWorkspacePage.centralNode);
      await thoughtWorkspacePage.expectContextMenuItems(['Create child node', 'Create action', 'Edit label', 'Add comment']);
      await demoPause(page);
      await thoughtWorkspacePage.contextMenuAction('Create child node');
      await expect(thoughtWorkspacePage.childNode(0)).toBeVisible({ timeout: 30_000 });
      await demoPause(page);
    });

    await test.step('13. [E] Child node — add comment (P-TH18)', async () => {
      await thoughtWorkspacePage.addCommentOnNode(thoughtWorkspacePage.childNode(0), commentText);
      await demoPause(page);
    });

    await test.step('14. [D] Child node — create nested child (P-TH11)', async () => {
      await thoughtWorkspacePage.addChildNodeOn(thoughtWorkspacePage.childNode(0), meetingTitle);
      await demoPause(page);
    });

    await test.step('15. [D] Child node — edit label (P-TH12)', async () => {
      await thoughtWorkspacePage.editNodeLabelOn(thoughtWorkspacePage.childNode(0), nodeLabel);
      await thoughtWorkspacePage.searchNodes(nodeLabel);
      await expect(thoughtWorkspacePage.childNodes.filter({ hasText: nodeLabel }).first()).toBeVisible({
        timeout: 20_000,
      });
      await demoPause(page);
    });

    await test.step('16. [D] Labeled node — create parent (P-TH11)', async () => {
      const labeledNode = thoughtWorkspacePage.childNodes.filter({ hasText: nodeLabel }).first();
      await thoughtWorkspacePage.openContextMenuOnNode(labeledNode);
      await thoughtWorkspacePage.expectContextMenuItems([
        'Create child node',
        'Create parent node',
        'Create sibling node',
        'Create action',
        'Edit label',
        'Add comment',
        'Delete',
      ]);
      await demoPause(page);
      await thoughtWorkspacePage.addParentNodeOn(labeledNode, meetingTitle);
      await demoPause(page);
    });

    await test.step('17. [D] Labeled node — create sibling (P-TH12)', async () => {
      const labeledNode = thoughtWorkspacePage.childNodes.filter({ hasText: nodeLabel }).first();
      const before = await thoughtWorkspacePage.childNodeCount();
      await thoughtWorkspacePage.addSiblingNodeOn(labeledNode, meetingTitle);
      await expect(thoughtWorkspacePage.childNodes).toHaveCount(before + 1, { timeout: 15_000 });
      await demoPause(page);
    });

    await test.step('18. [D] Undo/redo and zoom (P-TH13, P-TH15)', async () => {
      await thoughtWorkspacePage.clickUndo();
      await thoughtWorkspacePage.clickRedo();
      await thoughtWorkspacePage.zoomIn(meetingTitle);
      await thoughtWorkspacePage.zoomOut(meetingTitle);
      await thoughtWorkspacePage.fitCanvas(meetingTitle);
      await demoPause(page);
    });

    await test.step('19. [D] Node search and contributors (P-TH14, P-TH17)', async () => {
      await thoughtWorkspacePage.searchNodes(nodeLabel);
      await thoughtWorkspacePage.openContributorsPanel();
      await demoPause(page);
      await thoughtWorkspacePage.selectDockTool('Canvas');
      await thoughtWorkspacePage.waitForCanvasReady(meetingTitle);
    });

    await test.step('20. [H] Create action — assignee validation (N-TH03)', async () => {
      const labeledNode = thoughtWorkspacePage.childNodes.filter({ hasText: nodeLabel }).first();
      await thoughtWorkspacePage.openContextMenuOnNode(labeledNode);
      await thoughtWorkspacePage.openCreateActionModalFromContext();
      await thoughtWorkspacePage.submitCreateAction();
      await thoughtWorkspacePage.expectCreateActionError(/Select at least one assignee/i);
      await demoPause(page);
      await page.keyboard.press('Escape');
    });

    await test.step('21. [E] Create action from context menu (P-TH19)', async () => {
      const labeledNode = thoughtWorkspacePage.childNodes.filter({ hasText: nodeLabel }).first();
      await thoughtWorkspacePage.openContextMenuOnNode(labeledNode);
      await thoughtWorkspacePage.openCreateActionModalFromContext();
      await thoughtWorkspacePage.fillCreateActionTitle(actionTitle);
      await thoughtWorkspacePage.selectFirstAssignee();
      await thoughtWorkspacePage.submitCreateAction();
      await expect(thoughtWorkspacePage.createActionModal).toBeHidden({ timeout: 30_000 });
      const task = await thinkspaceTaskApi.findTaskByTitle(actionTitle);
      if (task?.id) thinkspace.createdTaskIds.push(task.id);
      await demoPause(page);
    });

    await test.step('22. [E] Comments log — expand metadata and view on canvas (P-TH21)', async () => {
      await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
      await thoughtWorkspacePage.switchLogsTab('Comments');
      await thoughtWorkspacePage.expectCommentsTabCountAtLeast(1);
      await demoPause(page);
      await thoughtWorkspacePage.expandFirstCommentInLogs();
      await thoughtWorkspacePage.expectExpandedCommentMetadata(commentText);
      await demoPause(page);
      await thoughtWorkspacePage.viewCommentOnCanvas();
      await demoPause(page);
    });

    await test.step('23. [E] Comments log — Create Action from comment (P-TH20)', async () => {
      await thoughtWorkspacePage.expandFirstCommentInLogs();
      await thoughtWorkspacePage.createActionFromCommentLogs(commentActionTitle);
      const commentTask = await thinkspaceTaskApi.findTaskByTitle(commentActionTitle);
      if (commentTask?.id) thinkspace.createdTaskIds.push(commentTask.id);
      await demoPause(page);
    });

    await test.step('24. [E] Actions log — expand action details (P-TH20)', async () => {
      await thoughtWorkspacePage.expandFirstActionInLogs();
      await thoughtWorkspacePage.expectExpandedActionMetadata();
      await demoPause(page);
    });

    await test.step('25. [F] Materials tab — open upload modal (P-TH22)', async () => {
      await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
      await thoughtWorkspacePage.switchLogsTab('Materials');
      await thoughtWorkspacePage.expectMaterialsTabCount(0);
      await demoPause(page);
      await thoughtWorkspacePage.openAddMaterialSourceModal();
      await demoPause(page);
      await page.keyboard.press('Escape');
    });

    await test.step('26. [F] Upload meeting material JSON (P-TH22)', async () => {
      await thoughtWorkspacePage.switchLogsTab('Materials');
      await thoughtWorkspacePage.uploadMaterial(materialFixture);
      await thoughtWorkspacePage.expectMaterialsTabCount(1);
      await thoughtWorkspacePage.expectMaterialFilename('1. Material Mater JSON .txt');
      await demoPause(page);
    });

    await test.step('27. [F] Material preview, select file, edit mode (P-TH22)', async () => {
      await thoughtWorkspacePage.clickMaterialInList('1. Material Mater JSON .txt');
      await thoughtWorkspacePage.expectPreviewModeVisible();
      await thoughtWorkspacePage.expectMaterialPreviewContains('material_type');
      await thoughtWorkspacePage.expectMaterialPreviewContains('GI UNION SOCKET-1/2 INCH');
      await demoPause(page);
      await thoughtWorkspacePage.openMaterialEditMode();
      await demoPause(page);
      await thoughtWorkspacePage.cancelMaterialEdit();
      await demoPause(page);
    });

    await test.step('28. [F] Delete meeting material (P-TH28)', async () => {
      await thoughtWorkspacePage.deleteSelectedMaterial();
      await expect(thoughtWorkspacePage.page.getByText('No files yet')).toBeVisible({ timeout: 30_000 });
      await demoPause(page);
    });

    await test.step('29. [D] Delete canvas sibling node', async () => {
      await thoughtWorkspacePage.selectDockTool('Canvas');
      await thoughtWorkspacePage.waitForCanvasReady(meetingTitle);
      const sibling = thoughtWorkspacePage.childNodes.filter({ hasNotText: nodeLabel }).last();
      if (await sibling.isVisible().catch(() => false)) {
        await thoughtWorkspacePage.deleteNodeViaContext(sibling);
      }
      await demoPause(page);
    });

    await test.step('30. [F] Export JSON (P-TH23)', async () => {
      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
      await thoughtWorkspacePage.openExportMenu();
      await thoughtWorkspacePage.exportMenuItem('Export as JSON');
      await downloadPromise;
      await demoPause(page);
    });

    await test.step('31. [F] AI Summary panel (P-TH24)', async () => {
      await thoughtWorkspacePage.selectDockTool('AI Summary');
      await thoughtWorkspacePage.expectAiSummaryPanel();
      await demoPause(page);
    });

    await test.step('32. [D] Back to Actions & agendas (P-TH27)', async () => {
      await thoughtWorkspacePage.backLink.click();
      await expect(page).toHaveURL(/\/thinkspace\/task/);
      await demoPause(page);
    });

    await test.step('33. [C] List search and RSVP (P-TH06, P-TH07)', async () => {
      await thoughtListPage.open();
      await thoughtListPage.searchMeetings(meetingTitle);
      await thoughtListPage.expectMeetingInList(meetingTitle);
      await thoughtListPage.setRsvp(meetingTitle, 'accepted');
      await demoPause(page);
    });

    await test.step('34. [C] List log modals (P-TH08, P-TH09)', async () => {
      await thoughtListPage.openActionLogsModal(meetingTitle);
      await demoPause(page);
      await thoughtListPage.closeLogsModal();
      await thoughtListPage.openCommentsModal(meetingTitle);
      await demoPause(page);
      await thoughtListPage.closeLogsModal();
    });

    await test.step('35. [G] Analytics global search (P-TH25, P-TH26)', async () => {
      await thoughtListPage.intelligenceLink.click();
      await thoughtAnalyticsPage.expectStatsVisible();
      await thoughtAnalyticsPage.runGlobalSearch(meetingTitle);
      await demoPause(page);
    });

    await test.step('36. [B] Cancel create preview (P-TH05)', async () => {
      await thoughtAnalyticsPage.backLink.click();
      await thoughtListPage.openCreateModal();
      await thoughtListPage.fillTitle('Should not persist');
      await thoughtListPage.cancelCreate();
      await demoPause(page);
    });

    await test.step('37. [F] Cleanup demo meeting (API)', async () => {
      if (meetingId) {
        await thoughtApi.deleteMeeting(meetingId);
        thinkspace.createdMeetingIds = thinkspace.createdMeetingIds.filter((id) => id !== meetingId);
      }
      await demoPause(page);
    });
  });
});
