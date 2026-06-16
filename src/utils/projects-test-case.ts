import type { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons/sync';
import {
  getProjectsMatrixCase,
  getProjectsSectionLabel,
  getProjectsTestMatrix,
  projectsMatrixDisplayName,
  type ProjectsTestMatrix,
} from '../data/thinkspace/load-projects-test-matrix.js';
import type { MatrixCase } from '../data/thinkspace/load-test-matrix.js';

function applyAllureHierarchy(matrixCase: MatrixCase, matrix: ProjectsTestMatrix): void {
  const sectionLabel = getProjectsSectionLabel(matrixCase.section);

  allure.parentSuite(matrix.moduleLabel);
  allure.suite(matrix.subModuleLabel);
  allure.subSuite(sectionLabel);

  allure.epic(matrix.moduleLabel);
  allure.feature(matrix.subModuleLabel);
  allure.story(projectsMatrixDisplayName(matrixCase));

  allure.tag(matrixCase.type);
  allure.tag(matrixCase.crud.toLowerCase());
  allure.layer('UI');
}

export function annotateProjectsTestCase(testInfo: TestInfo, caseId: string): MatrixCase {
  const matrixCase = getProjectsMatrixCase(caseId);
  if (!matrixCase) {
    throw new Error(`Unknown projects matrix case id: ${caseId}`);
  }

  const matrix = getProjectsTestMatrix();
  applyAllureHierarchy(matrixCase, matrix);

  const annotations: { type: string; description: string }[] = [
    { type: 'Case ID', description: matrixCase.id },
    { type: 'Module', description: matrix.moduleLabel },
    { type: 'Submodule', description: matrix.subModuleLabel },
    { type: 'Section', description: getProjectsSectionLabel(matrixCase.section) },
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

export function projectsTestTitle(caseId: string): string {
  const matrixCase = getProjectsMatrixCase(caseId);
  if (!matrixCase) return caseId;
  return projectsMatrixDisplayName(matrixCase);
}
