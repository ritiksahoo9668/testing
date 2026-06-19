import { thinkspaceTest as base, expect } from './thinkspace.js';
import { createTravelPage } from '../pages/thinkspace/TravelPage.js';
import { createThinkspaceTravelApi } from '../api/ThinkspaceTravelApi.js';
import type { ThinkspaceTravelApi } from '../api/ThinkspaceTravelApi.js';

type TravelFixtures = {
  travelPage: ReturnType<typeof createTravelPage>;
  thinkspaceTravelApi: ThinkspaceTravelApi;
  _travelCleanup: void;
};

export const travelTest = base.extend<TravelFixtures>({
  travelPage: async ({ page }, use) => {
    await use(createTravelPage(page));
  },

  thinkspaceTravelApi: async ({ request, erpAccessToken }, use) => {
    await use(createThinkspaceTravelApi(request, erpAccessToken));
  },

  _travelCleanup: [
    async ({ thinkspace, thinkspaceTravelApi }, use) => {
      await use();
      for (const id of [...thinkspace.createdTravelRequestIds].reverse()) {
        try {
          await thinkspaceTravelApi.cancelIfActive(id);
        } catch {
          /* best effort */
        }
      }
      thinkspace.createdTravelRequestIds.length = 0;
    },
    { auto: true },
  ],
});

export { expect };

export function registerTravelRequestId(thinkspace: { createdTravelRequestIds: number[] }, id: number): void {
  thinkspace.createdTravelRequestIds.push(id);
}

export type { ThinkspaceTravelApi };
