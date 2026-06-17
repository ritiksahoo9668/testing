import type { ThoughtApi } from '../api/ThoughtApi.js';
import type { ThoughtWorkspacePage } from '../pages/thinkspace/ThoughtWorkspacePage.js';
import { registerMeetingId } from '../fixtures/thought.js';

export async function registerCreatedMeeting(
  thoughtApi: ThoughtApi,
  thinkspace: { createdMeetingIds: string[] },
  title: string,
): Promise<string> {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const meeting = await thoughtApi.findMeetingByTitle(title);
    const id = meeting?.name ? String(meeting.name) : '';
    if (id) {
      registerMeetingId(thinkspace, id);
      return id;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  return '';
}

export async function ensureMeetingWorkspaceReady(
  thoughtWorkspacePage: ThoughtWorkspacePage,
  thoughtApi: ThoughtApi,
  thinkspace: { createdMeetingIds: string[] },
  title: string,
): Promise<string> {
  await thoughtWorkspacePage.expectLoaded();
  const id = await registerCreatedMeeting(thoughtApi, thinkspace, title);
  if (!id) {
    throw new Error(`Could not resolve meeting id for title: ${title}`);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await thoughtApi.seedMeetingCanvas(id, title);
      await thoughtWorkspacePage.page.reload();
      await thoughtWorkspacePage.expectLoaded();
      await thoughtWorkspacePage.waitForCanvasReady(title);
      return id;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
