import type { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons/sync';
import {
  getMatrixCase,
  getSectionLabel,
  getTestMatrix,
  matrixDisplayName,
  type MatrixCase,
} from '../data/thinkspace/load-test-matrix.js';

function applyAllureHierarchy(matrixCase: MatrixCase): void {
  const matrix = getTestMatrix();
  const sectionLabel = getSectionLabel(matrixCase.section);

  // Thinkspace module → Action Master → workflow section
  allure.parentSuite(matrix.moduleLabel);
  allure.suite(matrix.subModuleLabel);
  allure.subSuite(sectionLabel);

  allure.epic(matrix.moduleLabel);
  allure.feature(matrix.subModuleLabel);
  allure.story(matrixDisplayName(matrixCase));

  allure.tag(matrixCase.type);
  allure.tag(matrixCase.crud.toLowerCase());
  allure.layer('UI');
}

/**
 * Attach human-readable test case metadata to Playwright + Allure reports.
 */
export function annotateTestCase(testInfo: TestInfo, caseId: string): MatrixCase {
  const matrixCase = getMatrixCase(caseId);
  if (!matrixCase) {
    throw new Error(`Unknown matrix case id: ${caseId}`);
  }

  const matrix = getTestMatrix();
  applyAllureHierarchy(matrixCase);

  const annotations: { type: string; description: string }[] = [
    { type: 'Case ID', description: matrixCase.id },
    { type: 'Module', description: matrix.moduleLabel },
    { type: 'Submodule', description: matrix.subModuleLabel },
    { type: 'Section', description: getSectionLabel(matrixCase.section) },
    { type: 'Type', description: matrixCase.type },
    { type: 'CRUD', description: matrixCase.crud },
    { type: 'Entity', description: matrixCase.entity },
    { type: 'UI location', description: matrixCase.uiLocation },
    { type: 'Workflow', description: matrixCase.workflowStep },
    { type: 'Summary', description: matrixCase.what },
    { type: 'Steps', description: matrixCase.steps },
    { type: 'Validation', description: matrixCase.validationPoints.join(' | ') },
    { type: 'Expected', description: matrixCase.expected },
  ];

  for (const annotation of annotations) {
    if (annotation.description?.trim()) {
      testInfo.annotations.push(annotation);
    }
  }

  return matrixCase;
}

export function testTitle(caseId: string): string {
  const matrixCase = getMatrixCase(caseId);
  if (!matrixCase) return caseId;
  return matrixDisplayName(matrixCase);
}
