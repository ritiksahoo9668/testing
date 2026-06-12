import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { getAgendaDataset } from '../../../src/data/thinkspace/load-agenda-test-data.js';
import {
  resolveAgendaFormData,
  resolveBucketAgendaTitle,
} from '../../../src/data/thinkspace/agenda-factory.js';

test.describe('H. Create agenda (UI) @thinkspace @authenticated', () => {
  test.setTimeout(180_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-AG01')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG01');
    const ds = getAgendaDataset('TS-G01');
    await taskPage.openCreateAgendaModal();
    await taskPage.quickCreate.expectAgendaAttachmentZone();
    await expect(taskPage.quickCreate.selfAssigneeRadio).toBeChecked();
    expect(ds.uiPayload.workspaceCategory).toBe('Agenda');
    await taskPage.quickCreate.cancel();
  });

  test(`${testTitle('P-AG02')} @positive`, async ({ taskPage, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG02');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G01'));
    const { agendaIds } = await taskPage.createAgendaViaUi(form);
    for (const id of agendaIds) thinkspace.createdAgendaIds.push(id);
  });

  test(`${testTitle('P-AG05')} @positive`, async ({ taskPage, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG05');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G02'));
    const { agendaIds } = await taskPage.createAgendaViaUi(form);
    for (const id of agendaIds) thinkspace.createdAgendaIds.push(id);
  });

  test(`${testTitle('P-AG06')} @positive`, async ({ taskPage, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG06');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G03'));
    const { agendaIds } = await taskPage.createAgendaViaUi(form);
    for (const id of agendaIds) thinkspace.createdAgendaIds.push(id);
  });

  test(`${testTitle('P-AG03')} @positive`, async ({ taskPage, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG03');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G04'));
    const titles = form.titles.split('\n').filter(Boolean);
    await taskPage.ensureAgendaActionWorkMode();
    const countBefore = await taskPage.readAgendasColumnCount();
    await taskPage.openCreateAgendaModal();
    const { agendaIds } = await taskPage.quickCreate.fillAndSubmitAgendaFromData(form);
    await taskPage.expectAgendaCreatedToast();

    for (const title of titles) {
      await taskPage.expectAgendaVisibleInList(title);
    }
    await taskPage.expectAgendasColumnCountAtLeast(countBefore + titles.length);
    for (const id of agendaIds) thinkspace.createdAgendaIds.push(id);
  });

  test(`${testTitle('P-AG04')} @positive`, async ({ taskPage, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-AG04');
    const ds = getAgendaDataset('TS-G05');
    const bucketTitle = resolveBucketAgendaTitle(ds);
    const form = resolveAgendaFormData(ds);
    form.titles = bucketTitle;
    form.title = bucketTitle;
    await taskPage.ensureAgendaActionWorkMode();
    const countBefore = await taskPage.readAgendasColumnCount();
    await taskPage.openQuickCreateAgendaFromBucket(bucketTitle);
    await expect(taskPage.quickCreate.agendaTitlesTextarea).toHaveValue(bucketTitle);
    const { agendaIds } = await taskPage.quickCreate.fillAndSubmitAgendaFromData(form);
    await taskPage.expectAgendaCreatedToast();
    await taskPage.expectAgendaVisibleInList(bucketTitle);
    await taskPage.expectAgendasColumnCountAtLeast(countBefore + 1);
    for (const id of agendaIds) thinkspace.createdAgendaIds.push(id);
  });

  test(`${testTitle('N-AG01')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-AG01');
    getAgendaDataset('TS-G06');
    await taskPage.openCreateAgendaModal();
    await taskPage.quickCreate.agendaTitlesTextarea.fill('');
    await taskPage.quickCreate.expectCreateAgendaDisabled();
    await taskPage.quickCreate.cancel();
  });

  test(`${testTitle('N-AG02')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-AG02');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G07'));

    await taskPage.openCreateAgendaModal();
    await taskPage.quickCreate.fillAgendaForm(form);
    await taskPage.quickCreate.cancel();
    await expect(taskPage.page.getByText('Agenda created.')).toHaveCount(0);
    await expect(taskPage.agendaCardByTitle(form.title)).toHaveCount(0);
  });

  test(`${testTitle('N-AG03')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-AG03');
    const form = resolveAgendaFormData(getAgendaDataset('TS-G08'));

    await taskPage.openCreateAgendaModal();
    await taskPage.quickCreate.agendaTitlesTextarea.fill(form.title);
    await taskPage.quickCreate.externalAssigneeRadio.check();
    await taskPage.quickCreate.expectCreateAgendaDisabled();
    await taskPage.quickCreate.cancel();
  });
});
