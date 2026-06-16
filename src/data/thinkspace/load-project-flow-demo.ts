import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ProjectFlowDemoStep = {
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

export type ProjectFlowDemo = {
  title: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  scope: string;
  prerequisites: string[];
  crudSummary: Record<string, string>;
  steps: ProjectFlowDemoStep[];
};

const flow: ProjectFlowDemo = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'project-flow-demo.json'), 'utf-8'),
);

export function getProjectFlowDemo(): ProjectFlowDemo {
  return flow;
}

export function getProjectFlowDemoSteps(): ProjectFlowDemoStep[] {
  return flow.steps;
}
