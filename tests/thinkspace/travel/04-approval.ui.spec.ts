import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { registerTravelRequestId } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTravelTestCase, travelTestTitle } from '../../../src/utils/travel-test-case.js';
import { buildTravelFormData } from '../../../src/data/thinkspace/travel-factory.js';

async function createSubmittedViaUi(
  travelPage: import('../../../src/pages/thinkspace/TravelPage.js').TravelPage,
  thinkspace: { createdTravelRequestIds: number[] },
  thinkspaceTravelApi: import('../../../src/api/ThinkspaceTravelApi.js').ThinkspaceTravelApi,
) {
  const data = buildTravelFormData();
  await travelPage.open();
  await travelPage.openCreateForm();
  await travelPage.fillCreateForm(data);
  await travelPage.saveDraft();
  const row = await thinkspaceTravelApi.findTravelByTitle(data.title);
  expect(row?.id).toBeTruthy();
  registerTravelRequestId(thinkspace, row!.id!);
  await travelPage.clickRowAction(data.title, 'Submit');
  await travelPage.expectRowStatus(data.title, 'Pending');
  return { title: data.title, id: row!.id! };
}

test.describe('D. Approval (staff) @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR08')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR08');
    const { title } = await createSubmittedViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    const approveVisible = await travelPage.rowForTitle(title).getByRole('button', { name: 'Approve' }).isVisible().catch(() => false);
    test.skip(!approveVisible, 'E2E user is not staff — Approve button not shown');

    await travelPage.clickRowAction(title, 'Approve');
    await travelPage.expectRowStatus(title, 'Approved');
    await travelPage.expectRowActionHidden(title, 'Approve');
    await travelPage.expectRowActionHidden(title, 'Reject');
  });

  test(`${travelTestTitle('P-TR09')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR09');
    const { title } = await createSubmittedViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    const rejectVisible = await travelPage.rowForTitle(title).getByRole('button', { name: 'Reject' }).isVisible().catch(() => false);
    test.skip(!rejectVisible, 'E2E user is not staff — Reject button not shown');

    await travelPage.clickRowAction(title, 'Reject');
    await travelPage.expectRowStatus(title, 'Rejected');
  });
});
