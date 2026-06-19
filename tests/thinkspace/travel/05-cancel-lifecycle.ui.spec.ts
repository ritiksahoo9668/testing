import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { registerTravelRequestId } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTravelTestCase, travelTestTitle } from '../../../src/utils/travel-test-case.js';
import { buildTravelFormData } from '../../../src/data/thinkspace/travel-factory.js';

async function createDraftViaUi(
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
  return data.title;
}

test.describe('E. Cancel lifecycle @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR10')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR10');
    const title = await createDraftViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    await travelPage.clickRowAction(title, 'Cancel');
    await travelPage.expectRowStatus(title, 'Cancelled');
    await travelPage.expectRowActionHidden(title, 'Cancel');
  });

  test(`${travelTestTitle('P-TR11')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR11');
    const title = await createDraftViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    await travelPage.clickRowAction(title, 'Submit');
    await travelPage.clickRowAction(title, 'Cancel');
    await travelPage.expectRowStatus(title, 'Cancelled');
  });

  test(`${travelTestTitle('P-TR12')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR12');
    const title = await createDraftViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    await travelPage.clickRowAction(title, 'Cancel');
    await travelPage.expectRowStatus(title, 'Cancelled');
    await travelPage.expectRowActionHidden(title, 'Cancel');
  });
});

test.describe('G. Cancel validation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('N-TR08')} @negative`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'N-TR08');
    const data = buildTravelFormData();
    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.fillCreateForm(data);
    await travelPage.saveDraft();

    const row = await thinkspaceTravelApi.findTravelByTitle(data.title);
    expect(row?.id).toBeTruthy();
    registerTravelRequestId(thinkspace, row!.id!);

    await travelPage.clickRowAction(data.title, 'Submit');

    const rejectVisible = await travelPage.rowForTitle(data.title).getByRole('button', { name: 'Reject' }).isVisible().catch(() => false);
    test.skip(!rejectVisible, 'E2E user is not staff — cannot reject for N-TR08 setup');

    await travelPage.clickRowAction(data.title, 'Reject');
    await travelPage.expectRowStatus(data.title, 'Rejected');

    await travelPage.clickRowAction(data.title, 'Cancel');
    await travelPage.expectErrorAlert();
    await travelPage.expectRowStatus(data.title, 'Rejected');
  });
});
