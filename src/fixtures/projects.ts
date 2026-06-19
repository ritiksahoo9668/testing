import { thinkspaceTest as base, expect } from './thinkspace.js';
import { createProjectsPage } from '../pages/thinkspace/ProjectsPage.js';
import { createThinkspaceHubPage } from '../pages/thinkspace/ThinkspaceHubPage.js';
import { createThinkspaceProjectApi } from '../api/ThinkspaceProjectApi.js';
import type { ThinkspaceProjectApi } from '../api/ThinkspaceProjectApi.js';

type ProjectsFixtures = {
  projectsPage: ReturnType<typeof createProjectsPage>;
  thinkspaceHubPage: ReturnType<typeof createThinkspaceHubPage>;
  thinkspaceProjectApi: ThinkspaceProjectApi;
  _projectCleanup: void;
};

export const projectsTest = base.extend<ProjectsFixtures>({
  projectsPage: async ({ page }, use) => {
    await use(createProjectsPage(page));
  },

  thinkspaceHubPage: async ({ page }, use) => {
    await use(createThinkspaceHubPage(page));
  },

  thinkspaceProjectApi: async ({ request, erpAccessToken }, use) => {
    await use(createThinkspaceProjectApi(request, erpAccessToken));
  },

  _projectCleanup: [
    async ({ thinkspace, thinkspaceProjectApi }, use) => {
      await use();
      for (const id of [...thinkspace.createdProjectIds].reverse()) {
        try {
          await thinkspaceProjectApi.deleteProject(id);
        } catch {
          /* best effort */
        }
      }
      thinkspace.createdProjectIds.length = 0;
    },
    { auto: true },
  ],
});

export { expect };

export function registerProjectId(thinkspace: { createdProjectIds: number[] }, id: number): void {
  thinkspace.createdProjectIds.push(id);
}
