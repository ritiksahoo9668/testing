export function uniqueMeetingTitle(prefix = 'E2E Meeting'): string {
  return `${prefix} ${Date.now()}`;
}

export function uniqueNodeLabel(prefix = 'Node'): string {
  return `${prefix} ${Date.now()}`;
}

/** Value for `input[type=datetime-local]` (local timezone). */
export function datetimeLocalOffset(hoursFromNow = 24): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
