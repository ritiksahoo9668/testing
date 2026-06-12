import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type LoginMatrixCase = {
  id: string;
  section: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  type: 'positive' | 'negative';
  crud: string;
  entity: string;
  workflowStep: string;
  uiLocation: string;
  title: string;
  what: string;
  steps: string;
  validationPoints: string[];
  expected: string;
  automated: boolean;
};

export type LoginTestMatrix = {
  module: string;
  subModule: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  sections: Record<string, string>;
  cases: LoginMatrixCase[];
};

const matrix: LoginTestMatrix = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'login-test-matrix.json'), 'utf-8'),
);

export function getLoginTestMatrix(): LoginTestMatrix {
  return matrix;
}

export function getLoginMatrixCase(id: string): LoginMatrixCase | undefined {
  return matrix.cases.find((c) => c.id === id);
}

export function getLoginSectionLabel(sectionKey: string): string {
  return matrix.sections[sectionKey] ?? sectionKey;
}

export function loginMatrixDisplayName(matrixCase: LoginMatrixCase): string {
  return `${matrixCase.id} — ${matrixCase.title}`;
}
