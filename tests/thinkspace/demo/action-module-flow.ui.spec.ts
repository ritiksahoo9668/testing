import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';
import { getActionFlowDemoSteps } from '../../../src/data/thinkspace/load-action-flow-demo.js';

/**
 * Thinkspace Action Master — single walkthrough video aligned with action-flow-demo.json
 * and actions-test-matrix sections A–F (+ partial G).
 *
 * Run: npm run demo:thinkspace-action
 */
test.describe('Thinkspace Action Master — flow video @demo @thinkspace', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(300_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test('Action module CRUD walkthrough (matrix sections A–F)', async (
    { taskPage, taskDetailModal, thinkspace, thinkspaceTaskApi },
    testInfo,
  ) => {
    const flowSteps = getActionFlowDemoSteps();
    for (const step of flowSteps) {
      testInfo.annotations.push({
        type: `Flow ${step.order}`,
        description: `[${step.section}] ${step.title} — cases: ${step.matrixCases.join(', ')} — ${step.crud}`,
      });
    }

    const bucketSeed = uniqueTaskTitle('Demo Bucket');
    const actionTitle = uniqueTaskTitle('Demo Action');
    const description = getActionDataset('TS-A01').apiPayload!.task_details ?? 'Demo action description';
    let taskId = 0;

    await test.step('1. [A] Open Actions workspace (P-A01)', async () => {
      await taskPage.open('/thinkspace/task');
      await taskPage.expectLoaded();
    });

    await test.step('2. [A] Switch work mode to Agenda/Action (P-A03)', async () => {
      await taskPage.clickWorkModeAgendaAction();
      await expect(taskPage.workMode.agendaActionButton).toBeVisible();
    });

    await test.step('3. [G] Week view then back to Today (P-A02, P-G02)', async () => {
      await taskPage.switchView('week');
      await expect(taskPage.page).toHaveURL(/view=week/);
      await taskPage.switchView('today');
      await expect(taskPage.page).not.toHaveURL(/view=week/);
    });

    await test.step('4. [B] Bucketlist — add capture item (P-B01)', async () => {
      await taskPage.addBucketItem(bucketSeed);
    });

    await test.step('5. [C] Create Specific action from bucket (P-C01)', async () => {
      await taskPage.switchBucketCategory('action');
      await taskPage.bucketRow(bucketSeed).getByRole('button', { name: 'Specific', exact: true }).click();
      await taskPage.quickCreate.expectOpen();
      await taskPage.quickCreate.fillAndSubmit(actionTitle, { description });
      await taskPage.expectActionCreatedToast();

      await expect
        .poll(async () => {
          const found = await thinkspaceTaskApi.findTaskByTitle(actionTitle);
          taskId = found?.id ?? 0;
          return taskId;
        }, { timeout: 30_000 })
        .toBeGreaterThan(0);
      thinkspace.createdTaskIds.push(taskId);
    });

    await test.step('6. [D] Read — open action from Today list (P-D01)', async () => {
      await taskPage.openTaskFromListByTitle(actionTitle, { reload: true });
      await taskDetailModal.waitForDetailReady();
      await taskDetailModal.expectTitleVisible(actionTitle);
    });

    await test.step('7. [E] Browse detail modal tabs (P-E01)', async () => {
      for (const tab of ['Progress', 'Updates', 'Attachments', 'Hierarchy'] as const) {
        await taskDetailModal.selectTab(tab);
      }
    });

    await test.step('8. [E] Update description and progress (P-E02, P-E03)', async () => {
      const updated = `Updated in demo flow ${Date.now()}`;
      await taskDetailModal.updateDescription(updated);
      await taskDetailModal.setProgressAndSave(75);
      await expect(taskDetailModal.progressSlider).toHaveValue('75');
    });

    await test.step('9. [E] Post progress note (P-E04)', async () => {
      await taskDetailModal.postUpdate(`Demo progress note ${Date.now()}`);
    });

    await test.step('10. [F] Delete action (P-F04, P-F05)', async () => {
      await taskDetailModal.deleteTask();
      thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== taskId);
    });
  });
});
