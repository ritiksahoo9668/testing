import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thinkspaceTest as test } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';

const demoDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../src/data/demo');
const sampleAttachment = resolve(demoDir, 'sample-action-attachment.txt');
const demoUploadCsv = resolve(demoDir, 'agenda-action-upload-demo-template.csv');

test.describe('I. Upload & file import @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-E05')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-E05');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Attachment upload') });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.uploadAttachment(sampleAttachment);
    await taskDetailModal.expectAttachmentListed('sample-action-attachment.txt');
  });

  test(`${testTitle('P-I02')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-I02');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Demo CSV upload') });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.uploadAttachment(demoUploadCsv);
    await taskDetailModal.expectAttachmentListed('agenda-action-upload-demo-template.csv');
  });
});
