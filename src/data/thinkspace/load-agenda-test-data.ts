import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type AgendaUiPayload = {
  titlePrefix?: string;
  assigneeType?: 'self' | 'external' | 'employee';
  workspaceCategory?: string;
  modalContext?: string;
  externalName?: string;
  externalEmail?: string;
  externalEmailDomain?: string;
  useExistingDirectoryEmail?: boolean;
  employeeSearchHint?: string;
  bulkTitlePrefixes?: string[];
  bucketIdeaPrefix?: string;
  startDateOffsetHours?: number;
};

export type AgendaDataset = {
  id: string;
  name: string;
  purpose: string;
  uiFlow: string;
  type: 'positive' | 'negative';
  matrixId?: string;
  uiPayload: AgendaUiPayload;
};

export type AgendasTestDataModule = {
  module: string;
  license: string;
  route: string;
  datasets: AgendaDataset[];
};

const agendasData: AgendasTestDataModule = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'agendas-test-data.json'), 'utf-8'),
);

export function getAgendasModuleData(): AgendasTestDataModule {
  return agendasData;
}

export function getAgendaDataset(id: string): AgendaDataset {
  const found = agendasData.datasets.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown agenda dataset id: ${id}`);
  return found;
}

export function getAgendaDatasetByMatrixId(matrixId: string): AgendaDataset | undefined {
  return agendasData.datasets.find((d) => d.matrixId === matrixId);
}
