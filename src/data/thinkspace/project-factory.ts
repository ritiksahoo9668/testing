import type { StatutoryApprovalsMeta } from '../../api/ThinkspaceProjectApi.js';

export function uniqueProjectTitle(prefix = 'E2E Project'): string {
  return `${prefix} ${Date.now()}`;
}

export type ProjectFormData = {
  title: string;
  description?: string;
  estimatedCost?: string;
  ownerLabel?: string;
  companyLabel?: string;
};

export function defaultStatutoryMeta(): StatutoryApprovalsMeta {
  return {
    legal: { enabled: false, remarks: '' },
    compliance: { enabled: false, remarks: '' },
    finance: { enabled: false, remarks: '' },
    management: { enabled: false, remarks: '' },
  };
}

export function statutoryMetaWith(
  enabled: Array<'legal' | 'compliance' | 'finance' | 'management'>,
  remarks: Partial<Record<'legal' | 'compliance' | 'finance' | 'management', string>> = {},
): StatutoryApprovalsMeta {
  const meta = defaultStatutoryMeta();
  for (const key of enabled) {
    meta[key] = { enabled: true, remarks: remarks[key] ?? '' };
  }
  return meta;
}
