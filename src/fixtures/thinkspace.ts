import { test as base } from './index.js';
import { e2eConfig } from '../config/environment.js';
import { buildSpecificTaskPayload } from '../data/thinkspace/task-factory.js';
import type { ThinkspaceTaskApi } from '../api/ThinkspaceTaskApi.js';
import type { ThinkspaceAgendaApi } from '../api/ThinkspaceAgendaApi.js';

export type ThinkspaceHelpers = {
  userId: number;
  createdTaskIds: number[];
  createdProjectIds: number[];
  createdMeetingIds: string[];
  createdBucketIds: number[];
  createdAgendaIds: number[];
  createdTravelRequestIds: number[];
  createTestTask: (overrides?: Parameters<typeof buildSpecificTaskPayload>[1]) => Promise<number>;
  cleanup: () => Promise<void>;
};

export const thinkspaceTest = base.extend<{ thinkspace: ThinkspaceHelpers }>({
  thinkspace: async ({ thinkspaceTaskApi, thinkspaceAgendaApi }, use) => {
    const createdTaskIds: number[] = [];
    const createdProjectIds: number[] = [];
    const createdMeetingIds: string[] = [];
    const createdBucketIds: number[] = [];
    const createdAgendaIds: number[] = [];
    const createdTravelRequestIds: number[] = [];
    const userId = await thinkspaceTaskApi.getCurrentUserId();

    const helpers: ThinkspaceHelpers = {
      userId,
      createdTaskIds,
      createdProjectIds,
      createdMeetingIds,
      createdBucketIds,
      createdAgendaIds,
      createdTravelRequestIds,
      async createTestTask(overrides) {
        const payload = buildSpecificTaskPayload(userId, overrides);
        const { response, body } = await thinkspaceTaskApi.createTask(payload);
        if (!response.ok() && response.status() !== 201) {
          throw new Error(`createTask failed ${response.status()}: ${JSON.stringify(body)}`);
        }
        const id = thinkspaceTaskApi.extractTaskId(body);
        createdTaskIds.push(id);
        return id;
      },
      async cleanup() {
        for (const id of [...createdTaskIds].reverse()) {
          try {
            await thinkspaceTaskApi.deleteTask(id);
          } catch {
            /* best effort */
          }
        }
        for (const id of [...createdBucketIds].reverse()) {
          try {
            await thinkspaceTaskApi.deleteBucketItem(id);
          } catch {
            /* best effort */
          }
        }
        if (!e2eConfig.keepTestData) {
          for (const id of [...createdAgendaIds].reverse()) {
            try {
              await thinkspaceAgendaApi.deleteAgenda(id);
            } catch {
              /* best effort */
            }
          }
        }
        createdTaskIds.length = 0;
        createdProjectIds.length = 0;
        createdMeetingIds.length = 0;
        createdBucketIds.length = 0;
        createdAgendaIds.length = 0;
        createdTravelRequestIds.length = 0;
      },
    };

    await use(helpers);
    await helpers.cleanup();
  },
});

export { expect } from './index.js';

export function registerBucketId(thinkspace: ThinkspaceHelpers, id: number): void {
  thinkspace.createdBucketIds.push(id);
}

export type { ThinkspaceTaskApi, ThinkspaceAgendaApi };
