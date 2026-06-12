import type { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons/sync';
import {
  getLoginMatrixCase,
  getLoginSectionLabel,
  getLoginTestMatrix,
  loginMatrixDisplayName,
  type LoginMatrixCase,
} from '../data/login/load-login-test-matrix.js';

function applyLoginAllureHierarchy(matrixCase: LoginMatrixCase): void {
  const matrix = getLoginTestMatrix();
  const sectionLabel = getLoginSectionLabel(matrixCase.section);

  allure.parentSuite(matrix.moduleLabel);
  allure.suite(matrix.subModuleLabel);
  allure.subSuite(sectionLabel);

  allure.epic(matrix.moduleLabel);
  allure.feature(matrix.subModuleLabel);
  allure.story(loginMatrixDisplayName(matrixCase));

  allure.tag(matrixCase.type);
  allure.tag(matrixCase.crud.toLowerCase());
  allure.layer('UI');
}

export function annotateLoginTestCase(testInfo: TestInfo, caseId: string): LoginMatrixCase {
  const matrixCase = getLoginMatrixCase(caseId);
  if (!matrixCase) {
    throw new Error(`Unknown login matrix case id: ${caseId}`);
  }

  const matrix = getLoginTestMatrix();
  applyLoginAllureHierarchy(matrixCase);

  const annotations: { type: string; description: string }[] = [
    ...(matrixCase.type === 'negative'
      ? [
          {
            type: 'Pass criteria',
            description:
              'Login must be rejected (red error on screen). Test FAILS only if sign-in succeeds.',
          },
        ]
      : []),
    { type: 'Case ID', description: matrixCase.id },
    { type: 'Module', description: matrix.moduleLabel },
    { type: 'Submodule', description: matrix.subModuleLabel },
    { type: 'Section', description: getLoginSectionLabel(matrixCase.section) },
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

export function loginTestTitle(caseId: string): string {
  const matrixCase = getLoginMatrixCase(caseId);
  if (!matrixCase) return caseId;
  return loginMatrixDisplayName(matrixCase);
}
