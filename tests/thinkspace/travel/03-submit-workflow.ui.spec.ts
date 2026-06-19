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
  await travelPage.expectRowVisible(data.title);
  const row = await thinkspaceTravelApi.findTravelByTitle(data.title);
  expect(row?.id).toBeTruthy();
  registerTravelRequestId(thinkspace, row!.id!);
  return data.title;
}

test.describe('C. Submit workflow @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR06')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR06');
    const title = await createDraftViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    await travelPage.clickRowAction(title, 'Submit');
    await travelPage.expectRowStatus(title, 'Submitted');
  });

  test(`${travelTestTitle('P-TR07')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR07');
    const title = await createDraftViaUi(travelPage, thinkspace, thinkspaceTravelApi);

    await travelPage.clickRowAction(title, 'Submit');
    await travelPage.expectRowStatus(title, 'Submitted');
    await travelPage.expectRowActionHidden(title, 'Submit');
  });
});
