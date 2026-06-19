import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MatrixCase } from './load-test-matrix.js';

export type TravelTestMatrix = {
  module: string;
  subModule: string;
  moduleLabel: string;
  subModuleLabel: string;
  route: string;
  sections: Record<string, string>;
  cases: MatrixCase[];
};

const matrix: TravelTestMatrix = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'travel-test-matrix.json'), 'utf-8'),
);

export function getTravelTestMatrix(): TravelTestMatrix {
  return matrix;
}

export function getTravelMatrixCase(id: string): MatrixCase | undefined {
  return matrix.cases.find((c) => c.id === id);
}

export function getTravelSectionLabel(sectionKey: string): string {
  return matrix.sections[sectionKey] ?? sectionKey;
}

export function travelMatrixDisplayName(matrixCase: MatrixCase): string {
  return `${matrixCase.id} — ${matrixCase.title}`;
}
