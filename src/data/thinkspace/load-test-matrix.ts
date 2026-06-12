import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type MatrixCase = {
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

export type ActionsTestMatrix = {
  module: string;
  subModule: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  sections: Record<string, string>;
  cases: MatrixCase[];
};

const matrix: ActionsTestMatrix = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'actions-test-matrix.json'), 'utf-8'),
);

export function getTestMatrix(): ActionsTestMatrix {
  return matrix;
}

export function getMatrixCase(id: string): MatrixCase | undefined {
  return matrix.cases.find((c) => c.id === id);
}

export function getMatrixCasesBySection(section: string): MatrixCase[] {
  return matrix.cases.filter((c) => c.section === section);
}

export function getSectionLabel(sectionKey: string): string {
  return matrix.sections[sectionKey] ?? sectionKey;
}

export function matrixDisplayName(matrixCase: MatrixCase): string {
  return `${matrixCase.id} — ${matrixCase.title}`;
}
