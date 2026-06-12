export type ThinkspaceTaskPayload = {
  task_title: string;
  task_details?: string;
  start_date: string;
  end_date?: string;
  priority?: string;
  assign_to?: number;
  action_source?: string;
  task_source_category?: string;
  task_type?: string;
  parent_task?: number;
  status?: string;
};

export function uniqueTaskTitle(prefix = 'E2E Action'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isoNow(offsetHours = 0): string {
  const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  return d.toISOString();
}

export function datetimeLocalValue(offsetHours = 0): string {
  const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildSpecificTaskPayload(
  assignToUserId: number,
  overrides: Partial<ThinkspaceTaskPayload> = {},
): ThinkspaceTaskPayload {
  const title = overrides.task_title ?? uniqueTaskTitle();
  const start = overrides.start_date ?? isoNow();
  return {
    task_title: title,
    task_details: overrides.task_details ?? title,
    start_date: start,
    end_date: overrides.end_date ?? isoNow(24),
    priority: overrides.priority ?? 'Normal',
    assign_to: assignToUserId,
    action_source: overrides.action_source ?? 'Action Page',
    task_source_category: overrides.task_source_category ?? '',
    task_type: overrides.task_type ?? 'Specific Action',
    status: overrides.status ?? 'Due',
    ...overrides,
  };
}

export function buildBucketItemPayload(title?: string) {
  return {
    title: title ?? uniqueTaskTitle('E2E Bucket'),
    description: '',
    status: 'Pending',
  };
}
