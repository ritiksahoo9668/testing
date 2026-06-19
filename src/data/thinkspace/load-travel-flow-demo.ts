import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TravelFlowDemoStep = {
  order: number;
  section: string;
  matrixCases: string[];
  crud: string;
  title: string;
  userAction: string;
  uiLocation: string;
  api: string | null;
  functionality?: string;
  note?: string;
};

export type TravelFlowDemo = {
  title: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  scope: string;
  prerequisites: string[];
  crudSummary: Record<string, string>;
  steps: TravelFlowDemoStep[];
  excludedFromTravelDemo: Record<string, string>;
};

const flow: TravelFlowDemo = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'travel-flow-demo.json'), 'utf-8'),
);

export function getTravelFlowDemo(): TravelFlowDemo {
  return flow;
}

export function getTravelFlowDemoSteps(): TravelFlowDemoStep[] {
  return flow.steps;
}
