const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  return new Date(key + "T00:00:00");
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function dateLabel(key: string): string {
  // 데모: "YYYY-MM-DD (요일)" 또는 "YYYY-MM-DD\n(요일)" 형태
  const d = fromDateKey(key);
  return `${key} (${WEEKDAYS[d.getDay()]})`;
}

export function shiftDateKey(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}
