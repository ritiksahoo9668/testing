import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { registerTravelRequestId } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTravelTestCase, travelTestTitle } from '../../../src/utils/travel-test-case.js';
import { buildTravelFormData } from '../../../src/data/thinkspace/travel-factory.js';

test.describe('F. List & read @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR13')} @positive`, async ({ travelPage, thinkspaceTravelApi }, testInfo) => {
    annotateTravelTestCase(testInfo, 'P-TR13');
    await travelPage.open();
    const count = await travelPage.rowCount();
    test.skip(count > 0, 'List is not empty — empty-state test requires no existing travel requests');
    await travelPage.expectEmptyState();
  });

  test(`${travelTestTitle('P-TR14')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR14');
    const data = buildTravelFormData({ destination: 'Chennai' });

    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.fillCreateForm(data);
    await travelPage.saveDraft();

    await travelPage.expectRowMetadata(data.title, 'Chennai', data.startDate, data.endDate, 'Draft');
    const row = await thinkspaceTravelApi.findTravelByTitle(data.title);
    expect(row?.id).toBeTruthy();
    registerTravelRequestId(thinkspace, row!.id!);
  });

  test(`${travelTestTitle('P-TR16')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR16');
    const data = buildTravelFormData();

    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.fillCreateForm(data);
    await travelPage.saveDraft();

    const row = await thinkspaceTravelApi.findTravelByTitle(data.title);
    expect(row?.id).toBeTruthy();
    registerTravelRequestId(thinkspace, row!.id!);

    await travelPage.clickRowAction(data.title, 'Submit');

    const approveVisible = await travelPage.rowForTitle(data.title).getByRole('button', { name: 'Approve' }).isVisible().catch(() => false);
    test.skip(!approveVisible, 'E2E user is not staff — cannot approve for P-TR16');

    await travelPage.clickRowAction(data.title, 'Approve');
    await travelPage.expectRowStatus(data.title, 'Approved');

    const claim = await thinkspaceTravelApi.findExpenseClaimForTravel(row!.id!);
    expect(claim?.id).toBeTruthy();
    expect(claim?.status).toBe('Draft');
    expect(claim?.travel_request).toBe(row!.id);
  });
});
