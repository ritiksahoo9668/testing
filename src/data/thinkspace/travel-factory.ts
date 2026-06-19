export function uniqueTravelTitle(prefix = 'E2E Travel'): string {
  return `${prefix} ${Date.now()}`;
}

export type TravelFormDates = {
  startDate: string;
  endDate: string;
};

/** ISO date strings (YYYY-MM-DD) for start = today+1, end = today+3. */
export function defaultTravelDates(): TravelFormDates {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date();
  end.setDate(end.getDate() + 3);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export type TravelCreateFormData = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string;
  fromLoc?: string;
  toLoc?: string;
};

export function buildTravelFormData(overrides: Partial<TravelCreateFormData> = {}): TravelCreateFormData {
  const dates = defaultTravelDates();
  return {
    title: uniqueTravelTitle(),
    destination: 'Mumbai',
    startDate: dates.startDate,
    endDate: dates.endDate,
    ...overrides,
  };
}
