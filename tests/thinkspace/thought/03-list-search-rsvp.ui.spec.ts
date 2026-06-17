import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { registerMeetingId } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';
import { uniqueMeetingTitle } from '../../../src/data/thinkspace/thought-factory.js';

test.describe('C. List, search & RSVP @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH06')} @positive`, async (
    { thoughtListPage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH06');
    const title = uniqueMeetingTitle('Search Target');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    await expect(thoughtListPage.page).toHaveURL(/workspace\?meeting=/);
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtListPage.open();
    await thoughtListPage.searchMeetings(title);
    await thoughtListPage.expectMeetingInList(title);
    await thoughtListPage.searchMeetings('zzz-no-meeting-match-xyz');
    await thoughtListPage.expectNoSearchMatches();
  });

  test(`${thoughtTestTitle('P-TH07')} @positive`, async (
    { thoughtListPage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH07');
    const title = uniqueMeetingTitle('RSVP');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtListPage.open();
    await thoughtListPage.setRsvp(title, 'accepted');
    await thoughtListPage.expectMeetingInList(title);
  });

  test(`${thoughtTestTitle('P-TH08')} @positive`, async (
    { thoughtListPage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH08');
    const title = uniqueMeetingTitle('Action Logs');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtListPage.open();
    await thoughtListPage.openActionLogsModal(title);
    await expect(
      thoughtListPage.page.getByText(/No action items in this meeting|Fetching workspace logs/i),
    ).toBeVisible();
    await thoughtListPage.closeLogsModal();
  });

  test(`${thoughtTestTitle('P-TH09')} @positive`, async (
    { thoughtListPage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH09');
    const title = uniqueMeetingTitle('Comments Log');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtListPage.open();
    await thoughtListPage.openCommentsModal(title);
    await expect(
      thoughtListPage.page.getByText(/No comments in this meeting|Fetching workspace logs/i),
    ).toBeVisible();
    await thoughtListPage.closeLogsModal();
  });

  test(`${thoughtTestTitle('P-TH10')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH10');
    const title = uniqueMeetingTitle('Open Card');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    const id = meeting?.name ? String(meeting.name) : '';
    if (id) registerMeetingId(thinkspace, id);

    await thoughtListPage.open();
    await thoughtListPage.openMeetingWorkspace(title);
    await thoughtWorkspacePage.expectLoaded();
    await thoughtWorkspacePage.expectTitleVisible(title);
  });
});
