import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';
import { getActionFlowDemoSteps } from '../../../src/data/thinkspace/load-action-flow-demo.js';
import { demoPause } from '../../../src/utils/demo-pause.js';

const demoDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../src/data/demo');
const sampleAttachment = resolve(demoDir, 'sample-action-attachment.txt');

/**
 * Thinkspace Action Master — complete headed walkthrough for demo video.
 * Steps mirror action-flow-demo.json (sections A–G, I + lifecycle status).
 *
 * Run: npm run demo:thinkspace-action
 */
test.describe('Thinkspace Action Master — complete flow video @demo @thinkspace', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(420_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test('Action Master full workflow (bucket → create → update → status → attach → done → delete)', async (
    { taskPage, taskDetailModal, thinkspace, thinkspaceTaskApi, page },
    testInfo,
  ) => {
    const flowSteps = getActionFlowDemoSteps();
    for (const step of flowSteps) {
      testInfo.annotations.push({
        type: `Flow ${step.order}`,
        description: `[${step.section}] ${step.title} — ${step.matrixCases.join(', ')} — ${step.crud}`,
      });
    }

    const bucketTitle = uniqueTaskTitle('Demo Bucket');
    const actionTitle = uniqueTaskTitle('Demo Action');
    const doneTitle = uniqueTaskTitle('Demo Done');
    const description = getActionDataset('TS-A01').apiPayload!.task_details ?? 'Demo action description';
    let taskId = 0;
    let doneTaskId = 0;

    await test.step('1. [A] Open Actions workspace (P-A01)', async () => {
      await taskPage.open('/thinkspace/task');
      await taskPage.expectLoaded();
      await demoPause(page);
    });

    await test.step('2. [A] Agenda/Action work mode active (P-A03)', async () => {
      await taskPage.clickWorkModeAgendaAction();
      await taskPage.workMode.expectAgendaActionActive();
      await demoPause(page);
    });

    await test.step('3. [D] Action type filter — Specific (P-D02)', async () => {
      if (await taskPage.actionTypeFilterBar.isVisible()) {
        await taskPage.actionTypeFilterBar.expectFilterOption('Specific');
        await taskPage.actionTypeFilterBar.selectFilter('Specific');
        await taskPage.actionTypeFilterBar.selectFilter('Specific');
        await demoPause(page);
      }
    });

    await test.step('4. [G] Week view (P-A02, P-G01)', async () => {
      await taskPage.switchView('week');
      await expect(taskPage.page).toHaveURL(/view=week/);
      await taskPage.expectWeekNavigationVisible();
      await demoPause(page);
    });

    await test.step('5. [G] Previous week → Next week (P-G02)', async () => {
      await taskPage.navigatePreviousWeek();
      await demoPause(page, 800);
      await taskPage.navigateNextWeek();
      await expect(taskPage.page).toHaveURL(/view=week/);
      await demoPause(page);
    });

    await test.step('6. [G] Return to Today (P-A02)', async () => {
      await taskPage.switchView('today');
      await expect(taskPage.page).not.toHaveURL(/view=week/);
      await demoPause(page);
    });

    await test.step('7. [B] Open bucketlist panel (P-B02)', async () => {
      await taskPage.ensureBucketlistOpen();
      await expect(taskPage.bucketInput).toBeVisible();
      await demoPause(page);
    });

    await test.step('8. [B] Capture idea in bucketlist (P-B01)', async () => {
      await taskPage.addBucketItem(bucketTitle);
      await demoPause(page);
    });

    await test.step('9. [B] Preview Routine quick-create (P-B04)', async () => {
      await taskPage.bucketRow(bucketTitle).getByRole('button', { name: 'Routine', exact: true }).click();
      await taskPage.quickCreate.expectRoutineMode();
      await demoPause(page);
      await taskPage.quickCreate.cancel();
      await demoPause(page);
    });

    await test.step('10. [C] Create Specific action from bucket (P-C01, P-B03)', async () => {
      await taskPage.bucketRow(bucketTitle).getByRole('button', { name: 'Specific', exact: true }).click();
      await taskPage.quickCreate.expectOpen();
      await taskPage.quickCreate.expectTitlePrefilled(bucketTitle);
      await taskPage.quickCreate.fillAndSubmit(actionTitle, { description });
      await taskPage.expectActionCreatedToast();

      await expect
        .poll(async () => {
          const found = await thinkspaceTaskApi.findTaskByTitle(actionTitle);
          taskId = found?.id ?? 0;
          return taskId;
        }, { timeout: 45_000 })
        .toBeGreaterThan(0);
      thinkspace.createdTaskIds.push(taskId);
      await demoPause(page);
    });

    await test.step('11. [A] Deep link opens detail modal (P-A04)', async () => {
      await taskPage.openTaskById(taskId);
      await taskDetailModal.waitForDetailReady();
      await taskDetailModal.expectOpen(taskId);
      await taskDetailModal.expectTitleVisible(actionTitle);
      await demoPause(page);
    });

    await test.step('12. [E] Browse all detail tabs (P-E01)', async () => {
      for (const tab of ['Progress', 'Updates', 'Attachments', 'Hierarchy'] as const) {
        await taskDetailModal.selectTab(tab);
        await demoPause(page, 700);
      }
    });

    await test.step('13. [E] Update description and progress (P-E02, P-E03)', async () => {
      const updated = `Updated in demo flow ${Date.now()}`;
      await taskDetailModal.updateDescription(updated);
      await taskDetailModal.setProgressAndSave(30);
      await expect(taskDetailModal.progressSlider).toHaveValue('30');
      await demoPause(page);
    });

    await test.step('14. [F] Status — Do more with note (P-F02)', async () => {
      await taskDetailModal.clickDoMore('Demo: needs additional review before sign-off.');
      await demoPause(page);
    });

    await test.step('15. [F] Status — Derailed with note (P-F03)', async () => {
      await taskDetailModal.clickDerailed('Demo: blocked by missing vendor confirmation.');
      await demoPause(page);
    });

    await test.step('16. [E] Post progress update (P-E04)', async () => {
      await taskDetailModal.postUpdate(`Demo progress note ${Date.now()}`);
      await demoPause(page);
    });

    await test.step('17. [I] Upload attachment (P-E05)', async () => {
      await taskDetailModal.uploadAttachment(sampleAttachment);
      await taskDetailModal.expectAttachmentListed('sample-action-attachment.txt');
      await demoPause(page);
    });

    await test.step('18. [F] Mark separate action Done (P-F01)', async () => {
      doneTaskId = await thinkspace.createTestTask({ task_title: doneTitle });
      await taskPage.openTaskById(doneTaskId);
      await taskDetailModal.waitForDetailReady();
      await taskDetailModal.markDone();
      await expect(page).toHaveURL(/\/thinkspace\/task\/?(\?|$)/, { timeout: 20_000 });
      await demoPause(page);

      thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== doneTaskId);
      await thinkspaceTaskApi.deleteTask(doneTaskId).catch(() => undefined);
    });

    await test.step('19. [F] Delete primary demo action (P-F04, P-F05)', async () => {
      await taskPage.openTaskById(taskId);
      await taskDetailModal.waitForDetailReady();
      await taskDetailModal.expectDeleteEnabled();
      await taskDetailModal.deleteTask();
      thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== taskId);
      await demoPause(page);
    });

    await test.step('20. [B] Cleanup leftover bucket item if present (P-B06)', async () => {
      await taskPage.ensureBucketlistOpen();
      const row = taskPage.bucketRow(bucketTitle);
      if (await row.isVisible().catch(() => false)) {
        await taskPage.deleteBucketItem(bucketTitle);
      }
    });
  });
});
