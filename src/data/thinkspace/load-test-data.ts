import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ActionsTestDataModule = {
  module: string;
  license: string;
  route: string;
  datasets: Array<{
    id: string;
    name: string;
    purpose: string;
    uiFlow: string;
    type: 'positive' | 'negative';
    matrixId?: string;
    apiPayload?: Record<string, string>;
    bucketPayload?: { title: string; description: string; status: string };
  }>;
};

export type ActionDataset = ActionsTestDataModule['datasets'][number];

const actionsData: ActionsTestDataModule = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'actions-test-data.json'), 'utf-8'),
);

export function getActionsModuleData(): ActionsTestDataModule {
  return actionsData;
}

export function getActionDataset(id: string): ActionDataset {
  const found = actionsData.datasets.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown action dataset id: ${id}`);
  return found;
}

export function getPositiveDatasets(): ActionDataset[] {
  return actionsData.datasets.filter((d) => d.type === 'positive');
}

export function getNegativeDatasets(): ActionDataset[] {
  return actionsData.datasets.filter((d) => d.type === 'negative');
}
