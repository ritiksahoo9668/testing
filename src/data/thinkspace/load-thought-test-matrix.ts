import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MatrixCase } from './load-test-matrix.js';

export type ThoughtTestMatrix = {
  module: string;
  subModule: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  sections: Record<string, string>;
  cases: MatrixCase[];
};

const matrix: ThoughtTestMatrix = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'thought-test-matrix.json'), 'utf-8'),
);

export function getThoughtTestMatrix(): ThoughtTestMatrix {
  return matrix;
}

export function getThoughtMatrixCase(id: string): MatrixCase | undefined {
  return matrix.cases.find((c) => c.id === id);
}

export function getThoughtSectionLabel(sectionKey: string): string {
  return matrix.sections[sectionKey] ?? sectionKey;
}

export function thoughtMatrixDisplayName(matrixCase: MatrixCase): string {
  return `${matrixCase.id} — ${matrixCase.title}`;
}
