import { thinkspaceTest as base, expect } from './thinkspace.js';
import { createThoughtListPage } from '../pages/thinkspace/ThoughtListPage.js';
import { createThoughtWorkspacePage } from '../pages/thinkspace/ThoughtWorkspacePage.js';
import { createThoughtAnalyticsPage } from '../pages/thinkspace/ThoughtAnalyticsPage.js';
import { createThoughtApi } from '../api/ThoughtApi.js';
import type { ThoughtApi } from '../api/ThoughtApi.js';

type ThoughtFixtures = {
  thoughtListPage: ReturnType<typeof createThoughtListPage>;
  thoughtWorkspacePage: ReturnType<typeof createThoughtWorkspacePage>;
  thoughtAnalyticsPage: ReturnType<typeof createThoughtAnalyticsPage>;
  thoughtApi: ThoughtApi;
  _thoughtCleanup: void;
};

export const thoughtTest = base.extend<ThoughtFixtures>({
  thoughtListPage: async ({ page }, use) => {
    await use(createThoughtListPage(page));
  },

  thoughtWorkspacePage: async ({ page }, use) => {
    await use(createThoughtWorkspacePage(page));
  },

  thoughtAnalyticsPage: async ({ page }, use) => {
    await use(createThoughtAnalyticsPage(page));
  },

  thoughtApi: async ({ request, erpAccessToken }, use) => {
    await use(createThoughtApi(request, erpAccessToken));
  },

  _thoughtCleanup: [
    async ({ thinkspace, thoughtApi }, use) => {
      await use();
      for (const id of [...thinkspace.createdMeetingIds].reverse()) {
        try {
          await thoughtApi.deleteMeeting(id);
        } catch {
          /* best effort */
        }
      }
      thinkspace.createdMeetingIds.length = 0;
    },
    { auto: true },
  ],
});

export { expect };

export function registerMeetingId(thinkspace: { createdMeetingIds: string[] }, id: string): void {
  thinkspace.createdMeetingIds.push(id);
}
