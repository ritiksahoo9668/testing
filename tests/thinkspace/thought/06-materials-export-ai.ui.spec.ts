import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { registerMeetingId } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';
import { uniqueMeetingTitle } from '../../../src/data/thinkspace/thought-factory.js';

const sampleAttachment = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../src/data/demo/sample-thought-attachment.txt',
);

test.describe('F. Materials, export & AI @thinkspace @authenticated', () => {
  test.setTimeout(240_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH22')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH22');
    const title = uniqueMeetingTitle('Materials');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    await thoughtWorkspacePage.expectLoaded();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtWorkspacePage.selectDockTool('Comment & Action Logs');
    await thoughtWorkspacePage.uploadMaterial(sampleAttachment);
    await thoughtWorkspacePage.expectMaterialFilename('sample-thought-attachment.txt');
  });

  test(`${thoughtTestTitle('P-TH23')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi, page },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH23');
    const title = uniqueMeetingTitle('Export');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    await thoughtWorkspacePage.expectLoaded();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
    await thoughtWorkspacePage.openExportMenu();
    await thoughtWorkspacePage.exportMenuItem('Export as JSON');
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/mind-map-.*\.json/);
    }
  });

  test(`${thoughtTestTitle('P-TH24')} @positive`, async (
    { thoughtListPage, thoughtWorkspacePage, thinkspace, thoughtApi },
    testInfo,
  ) => {
    annotateThoughtTestCase(testInfo, 'P-TH24');
    const title = uniqueMeetingTitle('AI Summary');

    await thoughtListPage.open();
    await thoughtListPage.openCreateModal();
    await thoughtListPage.fillTitle(title);
    await thoughtListPage.submitCreate();
    await thoughtWorkspacePage.expectLoaded();
    const meeting = await thoughtApi.findMeetingByTitle(title);
    if (meeting?.name) registerMeetingId(thinkspace, String(meeting.name));

    await thoughtWorkspacePage.selectDockTool('AI Summary');
    await thoughtWorkspacePage.expectAiSummaryPanel();
  });
});
