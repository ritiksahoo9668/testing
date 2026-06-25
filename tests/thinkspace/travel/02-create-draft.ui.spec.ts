import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { registerTravelRequestId } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTravelTestCase, travelTestTitle } from '../../../src/utils/travel-test-case.js';
import { buildTravelFormData, uniqueTravelTitle } from '../../../src/data/thinkspace/travel-factory.js';

async function trackTravelRequest(
  thinkspace: { createdTravelRequestIds: number[] },
  thinkspaceTravelApi: { findTravelByTitle: (title: string) => Promise<{ id?: number } | undefined> },
  title: string,
): Promise<number> {
  const row = await thinkspaceTravelApi.findTravelByTitle(title);
  expect(row?.id).toBeTruthy();
  registerTravelRequestId(thinkspace, row!.id!);
  return row!.id!;
}

test.describe('B. Create draft @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR03')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR03');
    const data = buildTravelFormData();

    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.fillCreateForm(data);
    await travelPage.saveDraft();

    await travelPage.expectRowVisible(data.title);
    await travelPage.expectRowStatus(data.title, 'Draft');
    await trackTravelRequest(thinkspace, thinkspaceTravelApi, data.title);
  });

  test(`${travelTestTitle('P-TR04')} @positive`, async (
    { travelPage, thinkspace, thinkspaceTravelApi },
    testInfo,
  ) => {
    annotateTravelTestCase(testInfo, 'P-TR04');
    const data = buildTravelFormData({
      fromLoc: 'Delhi',
      toLoc: 'Bangalore',
    });

    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.fillCreateForm(data);
    await travelPage.saveDraft();

    await travelPage.expectRowVisible(data.title);
    await travelPage.expectRowLeg(data.title, 'Delhi', 'Bangalore');
    await trackTravelRequest(thinkspace, thinkspaceTravelApi, data.title);
  });

  test(`${travelTestTitle('P-TR05')} @positive`, async ({ travelPage }, testInfo) => {
    annotateTravelTestCase(testInfo, 'P-TR05');
    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.expectCreateFormVisible();
    await travelPage.closeCreateForm();
    await travelPage.expectCreateFormHidden();
  });
});

test.describe('G. Create validation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('N-TR03')} @negative`, async ({ travelPage }, testInfo) => {
    annotateTravelTestCase(testInfo, 'N-TR03');
    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.clickSaveDraftWithoutValidation();
    await travelPage.expectCreateFormVisible();
  });

  test(`${travelTestTitle('N-TR04')} @negative`, async ({ travelPage, thinkspaceTravelApi }, testInfo) => {
    annotateTravelTestCase(testInfo, 'N-TR04');
    const title = uniqueTravelTitle('Abandoned');

    await travelPage.open();
    await travelPage.openCreateForm();
    await travelPage.page.locator('#travel-title').fill(title);
    await travelPage.closeCreateForm();
    await travelPage.expectCreateFormHidden();

    const found = await thinkspaceTravelApi.findTravelByTitle(title);
    expect(found).toBeUndefined();
  });
});
