import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ThoughtFlowDemoStep = {
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

export type ThoughtFlowDemo = {
  title: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  scope: string;
  prerequisites: string[];
  crudSummary: Record<string, string>;
  steps: ThoughtFlowDemoStep[];
  excludedFromThoughtDemo?: Record<string, string>;
};

const flow: ThoughtFlowDemo = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'thought-flow-demo.json'), 'utf-8'),
);

export function getThoughtFlowDemo(): ThoughtFlowDemo {
  return flow;
}

export function getThoughtFlowDemoSteps(): ThoughtFlowDemoStep[] {
  return flow.steps;
}
