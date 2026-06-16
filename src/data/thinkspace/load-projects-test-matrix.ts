import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MatrixCase } from './load-test-matrix.js';

export type ProjectsTestMatrix = {
  module: string;
  subModule: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  sections: Record<string, string>;
  cases: MatrixCase[];
};

const matrix: ProjectsTestMatrix = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'projects-test-matrix.json'), 'utf-8'),
);

export function getProjectsTestMatrix(): ProjectsTestMatrix {
  return matrix;
}

export function getProjectsMatrixCase(id: string): MatrixCase | undefined {
  return matrix.cases.find((c) => c.id === id);
}

export function getProjectsSectionLabel(sectionKey: string): string {
  return matrix.sections[sectionKey] ?? sectionKey;
}

export function projectsMatrixDisplayName(matrixCase: MatrixCase): string {
  return `${matrixCase.id} — ${matrixCase.title}`;
}
