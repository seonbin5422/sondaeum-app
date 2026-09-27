export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayIndex(date: Date): number {
  return date.getDay(); // 0=일 ... 6=토
}

export function parseScheduleDays(scheduleLabel: string | null): string[] {
  if (!scheduleLabel) return [];
  const match = scheduleLabel.match(/^([가-힣,]+)\s+\d{1,2}:\d{2}-\d{1,2}:\d{2}$/);
  return match ? match[1].split(",") : [];
}

export function getScheduleTimeRange(scheduleLabel: string | null): string {
  if (!scheduleLabel) return "";
  const match = scheduleLabel.match(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})$/);
  return match ? match[1] : "";
}

/** 방문 종료시각(끝나는 시:분)을 정렬용 분 단위 숫자로 반환. 스케줄이 없으면 정렬 시 맨 뒤로 가도록 큰 값을 반환. */
export function getScheduleEndMinutes(scheduleLabel: string | null): number {
  const range = getScheduleTimeRange(scheduleLabel);
  const match = range.match(/-(\d{1,2}):(\d{2})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 스케줄이 등록된 요일에 해당하면 true. 스케줄 자체가 비어있으면 false(모름). */
export function matchesScheduleDay(scheduleLabel: string | null, date: Date): boolean {
  const weekday = WEEKDAY_LABELS[weekdayIndex(date)];
  return parseScheduleDays(scheduleLabel).includes(weekday);
}

/**
 * 특정 날짜의 방문 목록에 이 어르신을 보여줄지 여부.
 * 돌봄계약시간을 아직 입력하지 않은 어르신은 요일 필터와 무관하게 항상 표시한다 —
 * 실수로 방문 목록에서 아예 사라지는 것을 막기 위함(사용자 확정 사항, 2026-08-20).
 */
export function isVisibleOn(scheduleLabel: string | null, date: Date): boolean {
  if (!scheduleLabel) return true;
  return matchesScheduleDay(scheduleLabel, date);
}
