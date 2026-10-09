"use client";

// 1120.ver 화면 사이에서 기록을 넘기는 임시 저장소. 이 브라우저 탭(sessionStorage)에만 남고 DB에는 쓰지 않는다.
// API 연결 때 이 파일 대신 서버 액션·API 호출을 쓴다.
import type { CareRecord } from "./_types";
import { aiDraftRecord } from "./_mock";

type VisitDraft = {
  transcript: string;
  record: CareRecord;
  sentAt: string | null;
};

const key = (visitId: string) => `v1120:visit:${visitId}`;

export function loadDraft(visitId: string): VisitDraft {
  try {
    const raw = sessionStorage.getItem(key(visitId));
    if (raw) return JSON.parse(raw) as VisitDraft;
  } catch {}
  return { transcript: "", record: structuredClone(aiDraftRecord), sentAt: null };
}

export function saveDraft(visitId: string, patch: Partial<VisitDraft>) {
  const next = { ...loadDraft(visitId), ...patch };
  try {
    sessionStorage.setItem(key(visitId), JSON.stringify(next));
  } catch {}
  return next;
}

// C-15에서 보여 줄 "아직 확인하지 않은 항목". null = 말하지도 입력하지도 않음.
export function missingItems(r: CareRecord): string[] {
  const out: string[] = [];
  if (r.physical.minutes === null) out.push("신체활동지원: 제공시간");
  const cog = [
    ["인지자극활동", r.cognitive.stimulation],
    ["일상생활 함께하기", r.cognitive.dailyLiving],
    ["인지행동변화 관리", r.cognitive.behaviorManagement],
    ["의사소통·말벗·격려", r.cognitive.emotional],
  ] as const;
  const cogMissing = cog.filter(([, v]) => v === null).map(([n]) => n);
  if (cogMissing.length) out.push(`인지·정서 지원: ${cogMissing.join(", ")}`);
  if (r.household.minutes === null) out.push("가사·일상생활지원: 제공시간");
  const ch = [
    ["신체", r.change.physical],
    ["식사", r.change.meal],
    ["인지기능", r.change.cognitive],
  ] as const;
  const chMissing = ch.filter(([, v]) => v === null).map(([n]) => n);
  if (chMissing.length) out.push(`변화상태: ${chMissing.join("·")}`);
  const bw = [
    ["대변 실수", r.bowel.stoolAccidents],
    ["소변 실수", r.bowel.urineAccidents],
  ] as const;
  const bwMissing = bw.filter(([, v]) => v === null).map(([n]) => n);
  if (bwMissing.length) out.push(`배변 변화: ${bwMissing.join(", ")}`);
  if (!r.notes) out.push("특이사항");
  return out;
}
