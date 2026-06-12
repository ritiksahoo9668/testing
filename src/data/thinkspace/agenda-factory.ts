import type { AgendaDataset } from './load-agenda-test-data.js';
import { datetimeLocalValue } from './task-factory.js';

export type AgendaAssigneeType = 'self' | 'external' | 'employee';

export function uniqueAgendaTitle(prefix = 'E2E Agenda'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueExternalEmail(domain = 'test.maithan.in'): string {
  return `e2e-external-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@${domain}`;
}

export type ResolvedAgendaFormData = {
  titles: string;
  title: string;
  assigneeType: AgendaAssigneeType;
  externalName?: string;
  externalEmail?: string;
  employeeSearchHint?: string;
  startDateTime: string;
  workspaceCategory: 'Agenda';
  modalContext: string;
};

export function resolveAgendaFormData(dataset: AgendaDataset): ResolvedAgendaFormData {
  const payload = dataset.uiPayload;
  const assigneeType = (payload.assigneeType ?? 'self') as AgendaAssigneeType;

  const startDateTime = datetimeLocalValue(payload.startDateOffsetHours ?? 0);
  const workspaceCategory = 'Agenda' as const;
  const modalContext = payload.modalContext ?? 'Adding to: Agenda';

  if (payload.bulkTitlePrefixes?.length) {
    const lines = payload.bulkTitlePrefixes.map((p) => uniqueAgendaTitle(p));
    return {
      titles: lines.join('\n'),
      title: lines[0]!,
      assigneeType,
      employeeSearchHint: payload.employeeSearchHint,
      startDateTime,
      workspaceCategory,
      modalContext,
    };
  }

  const title = payload.titlePrefix?.trim()
    ? uniqueAgendaTitle(payload.titlePrefix)
    : '';

  const externalEmail = payload.externalEmail
    ?? (payload.useExistingDirectoryEmail
      ? (process.env.E2E_ERP_USERNAME ?? uniqueExternalEmail(payload.externalEmailDomain ?? 'test.maithan.in'))
      : uniqueExternalEmail(payload.externalEmailDomain ?? 'test.maithan.in'));

  return {
    titles: title,
    title,
    assigneeType,
    externalName: payload.externalName ?? 'E2E External Guest',
    externalEmail,
    employeeSearchHint: payload.employeeSearchHint ?? 'admin',
    startDateTime,
    workspaceCategory,
    modalContext,
  };
}

export function resolveBucketAgendaTitle(dataset: AgendaDataset): string {
  const prefix = dataset.uiPayload.bucketIdeaPrefix ?? dataset.uiPayload.titlePrefix ?? 'E2E Bucket Agenda';
  return uniqueAgendaTitle(prefix);
}
