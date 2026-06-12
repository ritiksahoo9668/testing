import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ActionFlowDemoStep = {
  order: number;
  section: string;
  matrixCases: string[];
  crud: string;
  title: string;
  userAction: string;
  uiLocation: string;
  api: string | null;
  note?: string;
};

export type ActionFlowDemo = {
  title: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  scope: string;
  prerequisites: string[];
  crudSummary: Record<string, string>;
  steps: ActionFlowDemoStep[];
  excludedFromActionDemo: Record<string, string>;
};

const flow: ActionFlowDemo = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'action-flow-demo.json'), 'utf-8'),
);

export function getActionFlowDemo(): ActionFlowDemo {
  return flow;
}

export function getActionFlowDemoSteps(): ActionFlowDemoStep[] {
  return flow.steps;
}
