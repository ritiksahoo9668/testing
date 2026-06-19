import { projectsTest as test, expect } from '../../../src/fixtures/projects.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { uniqueProjectTitle } from '../../../src/data/thinkspace/project-factory.js';
import { getProjectFlowDemoSteps } from '../../../src/data/thinkspace/load-project-flow-demo.js';
import { demoPause } from '../../../src/utils/demo-pause.js';
import { demoStep } from '../../../src/utils/demo-flow-step.js';
import { finishLauncherLive, resetLauncherLive } from '../../../src/utils/launcher-live.js';

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

/**
 * Thinkspace Projects — complete headed walkthrough for demo video.
 * Steps mirror project-flow-demo.json (sections A–G).
 *
 * Run: npm run demo:thinkspace-projects
 */
test.describe('Thinkspace Projects — complete flow video @demo @thinkspace', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(600_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
    resetLauncherLive();
  });

  test.afterEach(({ }, testInfo) => {
    if (process.env.E2E_LAUNCHER_LIVE_DIR) {
      finishLauncherLive(testInfo.status === 'passed' ? 'passed' : 'failed');
    }
  });

  test('Projects full workflow (hub → create → statutory → actions → detail → submit → hub)', async (
    { projectsPage, thinkspaceHubPage, thinkspace, thinkspaceProjectApi, page },
    testInfo,
  ) => {
    const flowSteps = getProjectFlowDemoSteps();
    for (const step of flowSteps) {
      testInfo.annotations.push({
        type: `Flow ${step.order}`,
        description: `[${step.section}] ${step.title} — ${step.matrixCases.join(', ')} — ${step.crud}`,
      });
    }

    const draftTitle = uniqueProjectTitle('Demo Project');
    const updatedTitle = `${draftTitle} Updated`;
    const financeTitle = uniqueProjectTitle('Demo Finance');
    const reviewTitle = uniqueProjectTitle('Demo Review');
    const cancelTitle = uniqueProjectTitle('Demo Cancelled');
    const actionName = `Deliverable ${Date.now()}`;
    const actionNameUpdated = `${actionName} Revised`;
    const milestoneTitle = `Phase 1 ${Date.now()}`;
    const commentText = `Demo workflow comment ${Date.now()}`;
    const startDate = isoDateOffset(0);
    const endDate = isoDateOffset(30);
    const dueDate = isoDateOffset(14);

    let mainProjectId = 0;
    let convertedTaskId = 0;

    await demoStep('1. [A] Open Thinkspace hub', async () => {
      await thinkspaceHubPage.open();
      await thinkspaceHubPage.expectLoaded();
      await demoPause(page);
    });

    await demoStep('2. [A] Open Projects from dock launcher (P-PR01)', async () => {
      await thinkspaceHubPage.openModuleFromLauncher('Projects');
      await projectsPage.expectLoaded();
      await demoPause(page);
    });

    await demoStep('3. [A] Refresh recent projects list (P-PR01)', async () => {
      await projectsPage.refreshButton.click();
      await expect(projectsPage.recentHeading).toBeVisible();
      await demoPause(page);
    });

    await demoStep('4. [A] Bulk import modal preview', async () => {
      await projectsPage.openBulkUploadModal();
      await projectsPage.expectBulkUploadReady();
      await demoPause(page);
      await projectsPage.closeBulkUploadModal();
      await demoPause(page);
    });

    await demoStep('5. [G] Create modal — required-field guard (N-PR02)', async () => {
      await projectsPage.openCreateModal();
      await projectsPage.fillTitle('');
      await projectsPage.expectSaveButtonsDisabled();
      await demoPause(page);
    });

    await demoStep('6. [B] Fill project details (P-PR02)', async () => {
      await projectsPage.fillRequiredFields(draftTitle);
      await projectsPage.fillExtendedProjectDetails({
        description: 'End-to-end demo project covering statutory approvals, action items, and workflow stages.',
        estimatedCost: '350000',
        durationDays: '30',
        externalMembers: 'Consultant Alex',
        startDate,
        endDate,
      });
      await demoPause(page);
    });

    await demoStep('7. [D] Configure statutory approvals (P-PR06, P-PR05)', async () => {
      await projectsPage.configureAllStatutoryApps({
        legal: 'Board legal clearance required',
        compliance: 'Regulatory compliance sign-off',
        finance: 'Finance statutory review',
        management: 'Management approval note',
      });
      await demoPause(page);
    });

    await demoStep('8. [G] Action item validation preview (N-PR03)', async () => {
      await projectsPage.trySaveActionItemWithoutRequiredFields();
      await projectsPage.expectToast('Validation Error');
      await demoPause(page);
    });

    await demoStep('9. [E] Add action item to project form (P-PR07)', async () => {
      await projectsPage.addActionItem({
        name: actionName,
        priority: 'High',
        dueDate,
        remarks: 'Demo deliverable before go-live',
      });
      await demoPause(page);
    });

    await demoStep('10. [E] Edit action item in form (P-PR07)', async () => {
      await projectsPage.editActionItemInForm(actionName, actionNameUpdated);
      await demoPause(page);
    });

    await demoStep('11. [B] Save project as Draft (P-PR02)', async () => {
      await projectsPage.clickSaveDraft();
      await projectsPage.expectProjectInList(draftTitle, 'Draft');
      mainProjectId = await projectsPage.trackProjectId(thinkspaceProjectApi, thinkspace, draftTitle);
      await demoPause(page);
    });

    await demoStep('12. [F] Detail Overview — statutory display (P-PR09, P-PR06)', async () => {
      await projectsPage.openProjectDetail(draftTitle);
      await projectsPage.expectDetailTitle(draftTitle);
      await projectsPage.expectDetailWorkflowStage('Draft');
      await projectsPage.expectStatutoryInOverview('legal', 'Board legal clearance required');
      await projectsPage.expectStatutoryInOverview('compliance', 'Regulatory compliance sign-off');
      await demoPause(page);
    });

    await demoStep('13. [F] Milestone create and edit (P-PR13)', async () => {
      await projectsPage.expectMilestonesEmptyState();
      await projectsPage.addMilestone(milestoneTitle, 'Active', {
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });
      const editedMilestone = `${milestoneTitle} Done`;
      await projectsPage.editMilestone(milestoneTitle, { title: editedMilestone, status: 'Completed' });
      await demoPause(page);
    });

    await demoStep('14. [F] Gantt Timeline tab (P-PR09)', async () => {
      await projectsPage.expectGanttTabLoaded();
      await demoPause(page);
    });

    await demoStep('15. [F] Post workflow comment (P-PR14)', async () => {
      await projectsPage.expectCommentsEmptyState();
      await projectsPage.postDetailComment(commentText);
      await demoPause(page);
    });

    await demoStep('16. [F] Browse Actions tab (P-PR09)', async () => {
      await projectsPage.switchDetailTab('Actions');
      await expect(projectsPage.detailModal.getByRole('button', { name: 'Add Action' })).toBeVisible();
      await demoPause(page);
      await projectsPage.closeDetailModal();
    });

    await demoStep('17. [F] Edit draft from list (P-PR10)', async () => {
      await projectsPage.clickEditOnProject(draftTitle);
      await projectsPage.fillTitle(updatedTitle);
      await projectsPage.fillDescription('Updated description after draft review in demo flow.');
      await projectsPage.clickSaveDraft();
      await projectsPage.expectProjectInList(updatedTitle, 'Draft');
      await demoPause(page);
    });

    await demoStep('18. [C] Submit → Compliance Review (P-PR05, P-PR12)', async () => {
      await projectsPage.clickEditOnProject(updatedTitle);
      await projectsPage.clickSubmitRequest();
      await projectsPage.expectProjectInList(updatedTitle, 'Compliance Review');
      await projectsPage.expectWorkflowTrackerContains('Statutory / Compliance Approval');
      await demoPause(page);
    });

    await demoStep('19. [E] Verify action item converted to task (P-PR08)', async () => {
      await projectsPage.openProjectDetail(updatedTitle);
      await projectsPage.expectDetailWorkflowStage('Compliance Review');
      await projectsPage.expectActionInDetailTab(actionNameUpdated);
      const { body } = await thinkspaceProjectApi.getProject(mainProjectId);
      const actionItem = body.data?.action_items?.[0];
      expect(actionItem?.converted).toBe(true);
      convertedTaskId = actionItem?.task_id ?? 0;
      if (convertedTaskId) thinkspace.createdTaskIds.push(convertedTaskId);
      await demoPause(page);
      await projectsPage.closeDetailModal();
    });

    await demoStep('20. [F] Tasks link to Action Master (P-PR09)', async () => {
      await projectsPage.clickTasksLink(updatedTitle);
      await demoPause(page);
      await projectsPage.open('/thinkspace/projects');
      await projectsPage.expectLoaded();
      await demoPause(page);
    });

    await demoStep('21. [C] Submit high-cost → Finance Review (P-PR04)', async () => {
      await projectsPage.openCreateModal();
      await projectsPage.fillRequiredFields(financeTitle);
      await projectsPage.fillEstimatedCost('750000');
      await projectsPage.clickSubmitRequest();
      await projectsPage.expectProjectInList(financeTitle, 'Finance Review');
      await projectsPage.trackProjectId(thinkspaceProjectApi, thinkspace, financeTitle);
      await demoPause(page);
    });

    await demoStep('22. [C] Submit standard → Under Review (P-PR03)', async () => {
      await projectsPage.openCreateModal();
      await projectsPage.fillRequiredFields(reviewTitle);
      await projectsPage.fillEstimatedCost('150000');
      await projectsPage.clickSubmitRequest();
      await projectsPage.expectProjectInList(reviewTitle, 'Under Review');
      await projectsPage.trackProjectId(thinkspaceProjectApi, thinkspace, reviewTitle);
      await demoPause(page);
    });

    await demoStep('23. [C] Verify all workflow stage badges (P-PR12)', async () => {
      await projectsPage.expectProjectInList(updatedTitle, 'Compliance Review');
      await projectsPage.expectProjectInList(financeTitle, 'Finance Review');
      await projectsPage.expectProjectInList(reviewTitle, 'Under Review');
      await projectsPage.expectWorkflowTrackerContains('Finance Approval');
      await demoPause(page);
    });

    await demoStep('24. [G] Cancel create does not persist (N-PR04)', async () => {
      await projectsPage.openCreateModal();
      await projectsPage.fillRequiredFields(cancelTitle);
      await projectsPage.clickCancelCreate();
      await expect(page.getByRole('status').filter({ hasText: 'Draft saved' })).toHaveCount(0);
      const ghost = await thinkspaceProjectApi.findProjectByTitle(cancelTitle);
      expect(ghost).toBeUndefined();
      await demoPause(page);
    });

    await demoStep('25. [F] Delete demo projects (P-PR11)', async () => {
      for (const title of [updatedTitle, financeTitle, reviewTitle]) {
        await projectsPage.clickDeleteOnProject(title, true);
        await demoPause(page, 800);
      }
      thinkspace.createdProjectIds.length = 0;
      if (convertedTaskId) {
        thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== convertedTaskId);
      }
    });

    await demoStep('26. [A] Return to Thinkspace hub', async () => {
      await thinkspaceHubPage.returnToHub();
      await demoPause(page, 1500);
    });
  });
});
