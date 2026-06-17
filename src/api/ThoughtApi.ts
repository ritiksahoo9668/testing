import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';

type ApiEnvelope<T = unknown> = {
  status: string;
  data?: T;
  msg?: string;
};

export type ThoughtMeetingRecord = {
  name: string | number;
  meeting_title?: string;
  meeting_date?: string | null;
  meeting_agenda?: string;
  status?: string;
  participants_json?: string;
  canvas_state?: string;
};

export type ThoughtCreateMeetingPayload = {
  meeting_title: string;
  meeting_date?: string | null;
  meeting_agenda?: string;
  participants_json?: string;
};

function extractMeetingList(body: ApiEnvelope<ThoughtMeetingRecord[]>): ThoughtMeetingRecord[] {
  const data = body.data;
  return Array.isArray(data) ? data : [];
}

export class ThoughtApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  private client() {
    return createErpApiClient(this.request).withAuth(this.accessToken);
  }

  async listMeetings() {
    return this.client().post<ApiEnvelope<ThoughtMeetingRecord[]>>('thought/meetings/list-for-user/', {});
  }

  async createMeeting(payload: ThoughtCreateMeetingPayload) {
    return this.client().post<ApiEnvelope<ThoughtMeetingRecord>>('thought/meetings/create/', payload);
  }

  async deleteMeeting(meetingName: string | number) {
    return this.client().post<ApiEnvelope<unknown>>('thought/meetings/delete/', {
      meeting_name: String(meetingName),
    });
  }

  async getMeetingNote(meetingId: string | number) {
    return this.client().get<ApiEnvelope<ThoughtMeetingRecord>>(`thought/meeting-notes/${String(meetingId)}/`);
  }

  async seedMeetingCanvas(meetingId: string, title: string): Promise<void> {
    const rid = `root-${String(meetingId).replace(/\W+/g, '-')}`;
    const canvasState = {
      nodes: [
        {
          id: rid,
          label: title.slice(0, 240),
          parentId: null,
          isCentral: true,
          type: 'topic',
          position: { x: 400, y: 280 },
        },
      ],
      pan: { x: 0, y: 0 },
      zoom: 1,
      decisionLog: [],
      ui: {
        activeTab: 'canvas',
        meetingStage: 'live',
        dockView: 'logs',
        panelStage: 'logs',
        splitRatio: 0.5,
        timer: 0,
        dockCollapsed: true,
        smartPanelOpen: true,
        focusMode: false,
        showStageBar: false,
        workspaceChromeHidden: false,
        appDockHidden: false,
      },
    };
    await this.client().patch(`thought/meeting-notes/${meetingId}/`, {
      canvas_state: JSON.stringify(canvasState),
    });
  }

  extractMeetingId(body: ApiEnvelope<ThoughtMeetingRecord>): string {
    const meeting = body.data;
    const id = meeting?.name ?? (meeting as { id?: string | number })?.id;
    if (id == null) {
      throw new Error(`Meeting id missing in response: ${JSON.stringify(body).slice(0, 240)}`);
    }
    return String(id);
  }

  async findMeetingByTitle(title: string): Promise<ThoughtMeetingRecord | undefined> {
    const { body } = await this.listMeetings();
    return extractMeetingList(body).find((m) => m.meeting_title === title);
  }
}

export function createThoughtApi(request: APIRequestContext, accessToken: string): ThoughtApi {
  return new ThoughtApi(request, accessToken);
}
