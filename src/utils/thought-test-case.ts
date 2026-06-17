import type { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons/sync';
import {
  getThoughtMatrixCase,
  getThoughtSectionLabel,
  getThoughtTestMatrix,
  thoughtMatrixDisplayName,
  type ThoughtTestMatrix,
} from '../data/thinkspace/load-thought-test-matrix.js';
import type { MatrixCase } from '../data/thinkspace/load-test-matrix.js';

function applyAllureHierarchy(matrixCase: MatrixCase, matrix: ThoughtTestMatrix): void {
  const sectionLabel = getThoughtSectionLabel(matrixCase.section);

  allure.parentSuite(matrix.moduleLabel);
  allure.suite(matrix.subModuleLabel);
  allure.subSuite(sectionLabel);

  allure.epic(matrix.moduleLabel);
  allure.feature(matrix.subModuleLabel);
  allure.story(thoughtMatrixDisplayName(matrixCase));

  allure.tag(matrixCase.type);
  allure.tag(matrixCase.crud.toLowerCase());
  allure.layer('UI');
}

export function annotateThoughtTestCase(testInfo: TestInfo, caseId: string): MatrixCase {
  const matrixCase = getThoughtMatrixCase(caseId);
  if (!matrixCase) {
    throw new Error(`Unknown thought matrix case id: ${caseId}`);
  }

  const matrix = getThoughtTestMatrix();
  applyAllureHierarchy(matrixCase, matrix);

  const annotations: { type: string; description: string }[] = [
    { type: 'Case ID', description: matrixCase.id },
    { type: 'Module', description: matrix.moduleLabel },
    { type: 'Submodule', description: matrix.subModuleLabel },
    { type: 'Section', description: getThoughtSectionLabel(matrixCase.section) },
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

export function thoughtTestTitle(caseId: string): string {
  const matrixCase = getThoughtMatrixCase(caseId);
  if (!matrixCase) return caseId;
  return thoughtMatrixDisplayName(matrixCase);
}
