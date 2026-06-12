import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type WorkflowStep = {
  order: number;
  action: string;
  expected: string;
  crud?: string;
};

export type ActionTestWorkflow = {
  id: string;
  name: string;
  priority: string;
  persona: string;
  goal: string;
  preconditions: string[];
  steps: WorkflowStep[];
  matrixCases: string[];
  testData?: string[];
  spec?: string;
  demoSpec?: string;
  automated: boolean;
  note?: string;
};

export type ActionTestWorkflowsFile = {
  module: string;
  subModule: string;
  uiLabel: string;
  route: string;
  license: string;
  matrixFile: string;
  testDataFile: string;
  workflows: ActionTestWorkflow[];
  recommendedExecutionOrder: string[];
  entities: Record<string, { crud: string[]; api: string }>;
};

const data: ActionTestWorkflowsFile = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'action-test-workflows.json'), 'utf-8'),
);

export function getActionTestWorkflows(): ActionTestWorkflowsFile {
  return data;
}

export function getActionWorkflowById(id: string): ActionTestWorkflow | undefined {
  return data.workflows.find((w) => w.id === id);
}

export function getActionWorkflowsInOrder(): ActionTestWorkflow[] {
  const byId = new Map(data.workflows.map((w) => [w.id, w]));
  return data.recommendedExecutionOrder.map((id) => byId.get(id)).filter(Boolean) as ActionTestWorkflow[];
}
