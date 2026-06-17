import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { registerMeetingId } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';
import { datetimeLocalOffset, uniqueMeetingTitle } from '../../../src/data/thinkspace/thought-factory.js';

async function trackMeeting(
  thinkspace: { createdMeetingIds: string[] },
  thoughtApi: { findMeetingByTitle: (t: string) => Promise<{ name?: string | number } | undefined> },
  title: string,
): Promise<string> {
  const meeting = await thoughtApi.findMeetingByTitle(title);
  expect(meeting?.name).toBeTruthy();
  const id = String(meeting!.name!);
  registerMeetingId(thinkspace, id);
  return id;
}

test.describe('B. Create meeting @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH03')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH03');
    const title = uniqueMeetingTitle('Create Flow');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();

    await thoughtWorkspacePage.expectLoaded();
    await thoughtWorkspacePage.expectTitleVisible(title);
    await trackMeeting(thinkspace, thoughtApi, title);
  });

  test(`${thoughtTestTitle('P-TH04')} @positive`, async (
    { thoughtListPage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH04');
    const title = uniqueMeetingTitle('Agenda Flow');
    const agenda = `Demo agenda ${Date.now()}`;
    const meetingDate = datetimeLocalOffset(48);

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.fillDateLocal(meetingDate);
    await thoughtListPage.fillAgenda(agenda);
    await thoughtListPage.submitCreate();

    await expect(thoughtListPage.page).toHaveURL(/\/thinkspace\/thought\/workspace\?meeting=/);
    const meetingId = await trackMeeting(thinkspace, thoughtApi, title);
    const { body } = await thoughtApi.getMeetingNote(meetingId);
    expect(body.data?.meeting_agenda).toBe(agenda);
    expect(body.data?.meeting_date).toBeTruthy();
  });

  test(`${thoughtTestTitle('P-TH29')} @positive`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH29');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(uniqueMeetingTitle('Contributor Search'));
    const name = await thoughtListPage.addFirstMatchingContributor('Demo');
    await thoughtListPage.expectContributorsCount(1);
    await expect(thoughtListPage.contributorChip(name)).toBeVisible();
    await thoughtListPage.cancelCreate();
  });

  test(`${thoughtTestTitle('P-TH30')} @positive`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH30');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(uniqueMeetingTitle('Contributor Access'));
    const name = await thoughtListPage.addFirstMatchingContributor('Demo');
    await thoughtListPage.setContributorAccess(name, 'Editor');
    await thoughtListPage.setContributorAccess(name, 'Viewer');
    await thoughtListPage.cancelCreate();
  });

  test(`${thoughtTestTitle('P-TH31')} @positive`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH31');
    const guestName = `Guest ${Date.now()}`;
    const guestEmail = `guest.${Date.now()}@demo.local`;

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(uniqueMeetingTitle('Guest Contributor'));
    await thoughtListPage.addGuestContributor(guestName, guestEmail);
    await expect(thoughtListPage.contributorChip(guestName)).toBeVisible();
    await thoughtListPage.cancelCreate();
  });

  test('P-TH32 — Full create form like demo @positive', async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    const title = uniqueMeetingTitle('Demo Meeting');
    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.fillDateLocal(datetimeLocalOffset(48));
    const name = await thoughtListPage.addFirstMatchingContributor('Demo');
    await thoughtListPage.setContributorAccess(name, 'Editor');
    await thoughtListPage.addGuestContributor(`Guest ${Date.now()}`, `guest.${Date.now()}@demo.local`);
    await thoughtListPage.fillAgenda('Demo walkthrough agenda for Thought module.');
    await thoughtListPage.submitCreate();
    await thoughtWorkspacePage.expectLoaded();
    await trackMeeting(thinkspace, thoughtApi, title);
  });

  test(`${thoughtTestTitle('P-TH05')} @positive`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH05');
    const title = uniqueMeetingTitle('Cancel Flow');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.cancelCreate();
    await expect(thoughtListPage.page).toHaveURL(/\/thinkspace\/thought\/?$/);
  });

  test(`${thoughtTestTitle('N-TH02')} @negative`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'N-TH02');
    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.titleInput.evaluate((el: HTMLInputElement) => el.reportValidity());
    const valid = await thoughtListPage.titleInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(valid).toBe(false);
  });
});
