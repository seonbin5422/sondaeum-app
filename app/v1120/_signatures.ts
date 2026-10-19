import type { Signatures, Stroke } from "./_types";

// 급여제공기록지 서명 (LAW-9). 화면에서 온 값은 믿지 않고 모양·크기를 확인한 뒤 저장한다.
export const SIGN_W = 400;
export const SIGN_H = 120;
const MAX_STROKES = 100; // 서명칸 하나에 획 수
const MAX_POINTS = 4000; // 서명칸 하나에 점 수
const MAX_REASON = 200;

export const EMPTY_SIGNATURES: Signatures = { recipient: [], caregiver: [], reason: "" };

function cleanStrokes(v: unknown): Stroke[] {
  if (!Array.isArray(v) || v.length > MAX_STROKES) throw new Error("서명 모양이 올바르지 않아요.");
  let points = 0;
  return v.map((s) => {
    if (!Array.isArray(s) || s.length === 0) throw new Error("서명 모양이 올바르지 않아요.");
    points += s.length;
    if (points > MAX_POINTS) throw new Error("서명이 너무 길어요. 다시 써 주세요.");
    return s.map((p) => {
      if (!Array.isArray(p) || p.length !== 2) throw new Error("서명 모양이 올바르지 않아요.");
      const [x, y] = p.map(Number);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("서명 모양이 올바르지 않아요.");
      // 칸 밖으로 나간 점은 칸 끝에 붙이고, 소수 한 자리로 줄여 저장 크기를 줄인다
      const clamp = (n: number, max: number) => Math.round(Math.min(Math.max(n, 0), max) * 10) / 10;
      return [clamp(x, SIGN_W), clamp(y, SIGN_H)] as [number, number];
    });
  });
}

export function cleanSignatures(v: unknown): Signatures {
  if (!v || typeof v !== "object") throw new Error("서명 모양이 올바르지 않아요.");
  const o = v as Record<string, unknown>;
  const reason = typeof o.reason === "string" ? o.reason.trim().slice(0, MAX_REASON) : "";
  return { recipient: cleanStrokes(o.recipient ?? []), caregiver: cleanStrokes(o.caregiver ?? []), reason };
}

export const isEmptySignatures = (s: Signatures) => !s.recipient.length && !s.caregiver.length && !s.reason;
