import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { registerTravelRequestId } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { buildTravelFormData, uniqueTravelTitle } from '../../../src/data/thinkspace/travel-factory.js';
import { getTravelFlowDemoSteps } from '../../../src/data/thinkspace/load-travel-flow-demo.js';
import { demoPause } from '../../../src/utils/demo-pause.js';

/**
 * Thinkspace Travel — complete headed walkthrough for demo video.
 * Steps mirror travel-flow-demo.json (sections A–G).
 *
 * Run: npm run demo:thinkspace-travel
 */
test.describe('Thinkspace Travel — complete flow video @demo @thinkspace', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(420_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test('Travel full workflow (create → submit → approve → reject → cancel → hub)', async (
    { travelPage, thinkspace, thinkspaceTravelApi, page },
    testInfo,
  ) => {
    const flowSteps = getTravelFlowDemoSteps();
    for (const step of flowSteps) {
      testInfo.annotations.push({
        type: `Flow ${step.order}`,
        description: `[${step.section}] ${step.title} — ${step.matrixCases.join(', ')} — ${step.crud}`,
      });
    }

    const approveTitle = uniqueTravelTitle('Demo Approve');
    const rejectTitle = uniqueTravelTitle('Demo Reject');
    const cancelTitle = uniqueTravelTitle('Demo Cancel');
    const abandonTitle = uniqueTravelTitle('Demo Abandon');

    async function track(title: string): Promise<number> {
      const row = await thinkspaceTravelApi.findTravelByTitle(title);
      expect(row?.id).toBeTruthy();
      registerTravelRequestId(thinkspace, row!.id!);
      return row!.id!;
    }

    await test.step('1. [A] Open Travel Desk (P-TR01)', async () => {
      await travelPage.open('/thinkspace/travel');
      await travelPage.expectLoaded();
      await demoPause(page);
    });

    await test.step('2. [F] List or empty state (P-TR13)', async () => {
      const count = await travelPage.rowCount();
      if (count === 0) {
        await travelPage.expectEmptyState();
      } else {
        await expect(travelPage.page.locator('tbody tr').first()).toBeVisible();
      }
      await demoPause(page);
    });

    await test.step('3. [B] Open create form (P-TR05)', async () => {
      await travelPage.openCreateForm();
      await travelPage.expectCreateFormVisible();
      await demoPause(page);
    });

    await test.step('4. [G] Required-field guard (N-TR03)', async () => {
      await travelPage.clickSaveDraftWithoutValidation();
      await travelPage.expectCreateFormVisible();
      await demoPause(page);
    });

    const approveData = buildTravelFormData({
      title: approveTitle,
      destination: 'Mumbai',
      fromLoc: 'Delhi',
      toLoc: 'Mumbai',
      notes: 'Demo trip — client visit and site review.',
    });

    await test.step('5. [B] Save draft with leg and notes (P-TR03, P-TR04)', async () => {
      await travelPage.fillCreateForm(approveData);
      await demoPause(page);
      await travelPage.saveDraft();
      await travelPage.expectRowVisible(approveTitle);
      await track(approveTitle);
      await demoPause(page);
    });

    await test.step('6. [F] Verify list row metadata (P-TR14)', async () => {
      await travelPage.expectRowMetadata(
        approveTitle,
        approveData.destination,
        approveData.startDate,
        approveData.endDate,
        'Draft',
      );
      await travelPage.expectRowLeg(approveTitle, 'Delhi', 'Mumbai');
      await demoPause(page);
    });

    await test.step('7. [C] Submit draft (P-TR06, P-TR07)', async () => {
      await travelPage.clickRowAction(approveTitle, 'Submit');
      await travelPage.expectRowStatus(approveTitle, 'Pending');
      await travelPage.expectRowActionHidden(approveTitle, 'Submit');
      await demoPause(page);
    });

    await test.step('8. [D] Staff approve (P-TR08, P-TR16)', async () => {
      const approveVisible = await travelPage.rowForTitle(approveTitle).getByRole('button', { name: 'Approve' }).isVisible().catch(() => false);
      if (!approveVisible) {
        test.skip(true, 'E2E user is not staff — skip approve demo step');
      }
      await travelPage.clickRowAction(approveTitle, 'Approve');
      await travelPage.expectRowStatus(approveTitle, 'Approved');
      const row = await thinkspaceTravelApi.findTravelByTitle(approveTitle);
      const claim = row?.id ? await thinkspaceTravelApi.findExpenseClaimForTravel(row.id) : undefined;
      if (claim?.id) {
        testInfo.annotations.push({ type: 'Expense claim', description: `Draft claim #${claim.id} seeded for travel #${row!.id}` });
      }
      await demoPause(page);
    });

    const rejectData = buildTravelFormData({ title: rejectTitle, destination: 'Bangalore' });

    await test.step('9. [B] Create second request (P-TR03)', async () => {
      await travelPage.openCreateForm();
      await travelPage.fillCreateForm(rejectData);
      await travelPage.saveDraft();
      await travelPage.expectRowVisible(rejectTitle);
      await track(rejectTitle);
      await demoPause(page);
    });

    await test.step('10. [C] Submit second request (P-TR06)', async () => {
      await travelPage.clickRowAction(rejectTitle, 'Submit');
      await travelPage.expectRowStatus(rejectTitle, 'Pending');
      await demoPause(page);
    });

    await test.step('11. [D] Staff reject (P-TR09)', async () => {
      const rejectVisible = await travelPage.rowForTitle(rejectTitle).getByRole('button', { name: 'Reject' }).isVisible().catch(() => false);
      if (!rejectVisible) {
        test.skip(true, 'E2E user is not staff — skip reject demo step');
      }
      await travelPage.clickRowAction(rejectTitle, 'Reject');
      await travelPage.expectRowStatus(rejectTitle, 'Rejected');
      await demoPause(page);
    });

    await test.step('12. [G] Invalid cancel on Rejected (N-TR08)', async () => {
      const cancelBtn = travelPage.rowForTitle(rejectTitle).getByRole('button', { name: 'Cancel', exact: true });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await travelPage.expectErrorAlert();
        await travelPage.expectRowStatus(rejectTitle, 'Rejected');
      }
      await demoPause(page);
    });

    await test.step('13. [B] Abandon create form (N-TR04)', async () => {
      await travelPage.openCreateForm();
      await travelPage.page.locator('#travel-title').fill(abandonTitle);
      await demoPause(page, 800);
      await travelPage.closeCreateForm();
      expect(await thinkspaceTravelApi.findTravelByTitle(abandonTitle)).toBeUndefined();
      await demoPause(page);
    });

    const cancelData = buildTravelFormData({ title: cancelTitle, destination: 'Hyderabad' });

    await test.step('14. [B] Create third request (P-TR03)', async () => {
      await travelPage.openCreateForm();
      await travelPage.fillCreateForm(cancelData);
      await travelPage.saveDraft();
      await travelPage.expectRowVisible(cancelTitle);
      await track(cancelTitle);
      await demoPause(page);
    });

    await test.step('15. [E] Cancel draft (P-TR10, P-TR12)', async () => {
      await travelPage.clickRowAction(cancelTitle, 'Cancel');
      await travelPage.expectRowStatus(cancelTitle, 'Cancelled');
      await travelPage.expectRowActionHidden(cancelTitle, 'Cancel');
      await demoPause(page);
    });

    await test.step('16. [A] Back to Thinkspace hub (P-TR02)', async () => {
      await travelPage.backLink.click();
      await expect(page).toHaveURL(/\/thinkspace\/?$/);
      await demoPause(page);
    });

    await test.step('17. [A] Return to Travel Desk — final list (P-TR01)', async () => {
      await travelPage.open('/thinkspace/travel');
      await travelPage.expectLoaded();
      await travelPage.expectRowVisible(approveTitle);
      await travelPage.expectRowVisible(rejectTitle);
      await travelPage.expectRowVisible(cancelTitle);
      await demoPause(page, 1500);
    });
  });
});
