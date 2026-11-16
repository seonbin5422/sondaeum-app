// 시연 HTML용 _actions: DB 대신 이 브라우저 탭(sessionStorage)에 기록 하나를 둔다. AI 정리 순서는 서버(_actions.ts fillVisitRecord)와 같다.
import type { CareRecord, Signatures } from "@v/_types";
import { extractRecord, keepFilled, keptFields, overlayFields, type SaidQuotes } from "@v/_extract";
import { redactForAi, restoreNames, toRoleWords } from "@v/_redact";
import { fillGaps, fillRecord } from "@v/_ai";
import { cleanSignatures, EMPTY_SIGNATURES } from "@v/_signatures";
import { go } from "./next-navigation";

export const DEMO = { client: "김순자", guardian: "이영희", guardianRelation: "딸", caregiver: "박민지", phones: ["010-1234-5678", "010-8765-4321"] };

type Visit = { transcript: string; status: "RECORDING" | "RECORDED" | "DRAFT_READY" | "SENT"; record: CareRecord | null; quotes: SaidQuotes | null; edited: boolean; signatures: Signatures; sentAt: string | null };
const KEY = "sondaeum-demo-visit";
const fresh = (): Visit => ({ transcript: "", status: "RECORDING", record: null, quotes: null, edited: false, signatures: structuredClone(EMPTY_SIGNATURES), sentAt: null });
export function getVisit(): Visit {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fresh();
}
const put = (patch: Partial<Visit>) => {
  const v = { ...getVisit(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
  return v;
};
export const resetVisit = () => put(fresh());

const BLANK_RECORD: CareRecord = {
  physical: { personalHygiene: null, bathing: null, mealAssist: null, repositioning: null, mobility: null, toileting: null, minutes: null },
  physicalNote: null,
  cognitive: { stimulation: null, dailyLiving: null, behaviorManagement: null, emotional: null },
  household: { mealPrepCleaningLaundry: null, personalActivity: null, minutes: null },
  change: { physical: null, meal: null, cognitive: null },
  bowel: { stoolAccidents: null, urineAccidents: null, diaperChanges: null },
  notes: null,
};

async function fillVisitRecord(transcript: string) {
  const fallback = () => extractRecord(transcript);
  if (!transcript.trim() || !process.env.GROQ_API_KEY) return fallback();
  const people = { client: DEMO.client, guardian: DEMO.guardian, caregiver: DEMO.caregiver, phones: DEMO.phones };
  try {
    const { record, quotes } = fillGaps(await fillRecord(redactForAi(transcript, people)), fallback());
    const roles = (t: string | null) => (t ? toRoleWords(t) : t);
    const names = (t: string | null) => (t ? restoreNames(t, people) : t);
    return {
      record: { ...record, physicalNote: roles(record.physicalNote), notes: roles(record.notes), guardianNotes: roles(record.guardianNotes ?? null) },
      quotes: Object.fromEntries(Object.entries(quotes).map(([k, t]) => [k, names(t)])) as typeof quotes,
      byAi: true,
    };
  } catch (err) {
    console.error("AI 정리 실패, 낱말 찾기로 채움", err);
    return fallback();
  }
}

export async function saveTranscript(_id: string, transcript: string) {
  put({ transcript, status: "RECORDING" });
}
export async function finishRecording(_id: string, transcript: string, changed: string[] = []) {
  if (!transcript.trim()) throw new Error("녹음 내용이 없어요.");
  const v = getVisit();
  if (v.record) {
    const keep = keptFields(v.record, changed.slice(0, 50).map(String));
    put({ record: { ...overlayFields(BLANK_RECORD, v.record, keep), handEdited: keep, serviceStart: v.record.serviceStart ?? null, serviceEnd: v.record.serviceEnd ?? null } });
  }
  put({ transcript, status: "RECORDED" });
}
export async function summarizeVisit(_id: string) {
  const v = getVisit();
  if (v.status === "DRAFT_READY") return;
  const filled = await fillVisitRecord(v.transcript);
  const record = v.record ? keepFilled(v.record, filled.record, v.edited) : filled.record;
  put({ record, quotes: filled.quotes, status: "DRAFT_READY" });
}
export async function fillManually(_id: string) {
  if (!getVisit().record) put({ record: structuredClone(BLANK_RECORD), quotes: {} as SaidQuotes });
  put({ status: "DRAFT_READY" });
}
export async function addToNotes(_id: string, spoken: string): Promise<CareRecord> {
  const v = getVisit();
  const old = v.record;
  if (!old) throw new Error("정리된 기록이 없어요.");
  const text = spoken.trim();
  if (!text) throw new Error("말한 내용이 없어요.");
  const joined = `${old.notes ?? ""} ${text}`.trim();
  const filled = await fillVisitRecord(joined);
  const record: CareRecord =
    "byAi" in filled && filled.record.notes
      ? { ...old, notes: filled.record.notes, guardianNotes: filled.record.guardianNotes, notesNoAction: filled.record.notesNoAction, notesAsk: filled.record.notesAsk, notesUnsaid: filled.record.notesUnsaid ?? null }
      : { ...old, notes: joined, guardianNotes: null, notesNoAction: false, notesAsk: null, notesUnsaid: null };
  put({ record, transcript: `${v.transcript} ${text}`.trim(), edited: true });
  return record;
}
export async function saveRecord(_id: string, record: CareRecord) {
  put({ record, edited: true });
}
export async function saveSignatures(_id: string, value: unknown) {
  const s = cleanSignatures(value);
  put({ signatures: { ...getVisit().signatures, reason: s.reason, caregiver: s.caregiver } });
}
export async function sendReport(_id: string, form: FormData) {
  const sig = cleanSignatures(JSON.parse(String(form.get("signatures") ?? "{}")));
  if (!sig.caregiver.length) throw new Error("요양보호사 서명을 해야 보낼 수 있어요.");
  put({ signatures: sig, status: "SENT", sentAt: new Date().toISOString() });
  go("/v1120/visit/demo/sent", true);
}
export async function signAsGuardian(_token: string, strokes: unknown) {
  const { recipient } = cleanSignatures({ recipient: strokes, caregiver: [], reason: "" });
  if (!recipient.length) throw new Error("서명을 해 주세요.");
  put({ signatures: { ...getVisit().signatures, recipient } });
}
// 시연 흐름 밖 동작(수급자 관리·게시판 등)은 아무것도 하지 않는다
const noop = async (..._a: unknown[]): Promise<any> => {};
export const { closeLinks, saveClient, deleteClient, restoreClient, permanentDeleteClient, cancelPermanentDelete, logout, startVisit, commentAsCaregiver, commentAsGuardian, markReadAsCaregiver, markReadAsGuardian, shareSummary, updateMe } = Object.fromEntries(
  ["closeLinks", "saveClient", "deleteClient", "restoreClient", "permanentDeleteClient", "cancelPermanentDelete", "logout", "startVisit", "commentAsCaregiver", "commentAsGuardian", "markReadAsCaregiver", "markReadAsGuardian", "shareSummary", "updateMe"].map((k) => [k, noop]),
);
export const myUnreadTotal = async () => 0;
