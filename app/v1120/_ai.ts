import Groq from "groq-sdk";
import { cleanEnv } from "@/lib/env";
import type { CareRecord, Change } from "./_types";
import type { SaidQuotes } from "./_extract";

// C-13 정리: 개인정보를 지운 녹음 글(_redact.ts)로 AI가 급여제공기록지(D-24) 칸을 채운다 (LAW-1·2).
// AI가 실패하면 _actions.ts가 _extract.ts(낱말 찾기) 결과를 쓴다.

const SYSTEM_PROMPT = `당신은 요양보호사가 방문 중 말로 남긴 기록을 장기요양급여 제공기록지 칸에 옮기는 도우미입니다.
입력은 녹음을 글로 옮긴 것이라 군말·반복·말 끊김이 섞여 있습니다. [수급자]·[보호자]·[전화번호] 같은 표시는 가린 개인정보입니다.

반드시 지킬 것:
1. 요양보호사가 말한 사실만 옮깁니다. 말하지 않은 칸은 null로 둡니다. 짐작해서 채우지 않습니다.
2. 진단·병명 추측·처방·치료 권유는 쓰지 않습니다.
3. 요양보호사가 직접 해 드린 것만 '한 일'입니다. 권하거나 말로 안내한 것은 한 일이 아닙니다(예: '누워 계시라고 했어요'는 체위변경이 아님).
4. 시간은 그 활동에 걸렸다고 말한 시간만 씁니다. '두 시간마다'는 간격이라 시간이 아니고, 다른 활동의 시간을 옮겨 넣지 않습니다.
5. 말하다 고치면 마지막에 말한 값을 씁니다(예: '이십 분인가 아니 삼십 분'→30).
6. quotes에는 각 칸의 근거가 된 입력 문장을 입력에 있는 글자 그대로 복사합니다(고치거나 줄이지 않음). 근거가 없으면 빈 배열. 어떤 칸(notes 포함)을 채웠으면 그 칸의 quotes는 비우지 않습니다.

칸 설명:
- physical(신체활동지원): personalHygiene=세면·양치·머리 감기·면도·옷 갈아입기·몸단장, bathing=목욕·샤워, mealAssist=식사도움, repositioning=체위변경, mobility=이동도움·산책 부축·휠체어, toileting=화장실 이용 도움. 신체활동을 하나라도 말했으면 한 것은 true, 말하지 않은 것은 false. 하나도 말하지 않았으면 모두 null. minutes=신체활동에 걸린 시간(분).
- physicalNote: 신체활동으로 한 일을 가족이 읽기 쉽게 1~2문장. 없으면 null.
- cognitive(인지·정서, 각각 분): stimulation=인지자극활동(사진·퍼즐·노래·그림), dailyLiving=일상생활 함께하기(같이 요리·정리), behaviorManagement=인지행동변화 관리(배회·불안 돌봄), emotional=의사소통·말벗·격려. 했다고 말했지만 시간을 말하지 않았으면 그 칸은 null로 두되, quotes.cognitive에는 그 문장을 넣습니다(요양보호사가 확인 화면에서 시간을 채웁니다).
- household(가사·일상생활지원): mealPrepCleaningLaundry=식사준비·청소·세탁·설거지, personalActivity=외출 동행·장보기. 하나라도 말했으면 한 것 true, 말하지 않은 것 false. 하나도 없으면 모두 null. minutes=가사에 걸린 시간(분).
- change(지난 방문과 비교한 변화): physical=신체기능, meal=식사기능, cognitive=인지기능. 좋아졌다="improved", 비슷하다="same", 나빠졌다·줄었다="worse". '지난번엔 알아보셨는데 오늘은 못 알아보셨어요'처럼 지난번과 다르다고 말한 것도 변화입니다. 비교를 말하지 않았으면 null.
- bowel: stoolAccidents=대변 실수 횟수, urineAccidents=소변 실수 횟수, diaperChanges=기저귀 교환 횟수. "실수 없었다"는 0. 말하지 않았으면 null.
- notes(특이사항): 혈압·복약·통증·낙상·어지럼·병원·기분, 식사량과 음식 반응(예: '한 숟갈 드심', '짜다고 안 드심'), 반복해서 하신 말처럼 위 칸에 들어가지 않는 관찰. 한 문장이 다른 칸의 근거여도 이런 관찰이 있으면 notes에도 씁니다. 말이 서로 맞지 않으면(예: '잘 드셨다'와 '한 숟갈') 둘 다 씁니다.
- 한 활동의 시간은 가장 맞는 칸 하나에만 넣습니다(예: '사진 보며 말벗 30분'은 emotional에만). '삼십 분'·'한 시간 반'처럼 말한 시간도 분 숫자로 바꿉니다. 군말과 반복을 빼고 한 가지 사실을 한 문장으로, 최대 5문장. 숫자는 들은 그대로. 없으면 null.
- physicalNote와 notes는 모든 문장을 '-요'로 끝내고('-습니다' 금지) 사람은 '어르신'이라고 부릅니다.
  예: '음 혈압이 어 135에 85? 무릎이 아프다고 무릎이 계속' → '혈압은 135/85였어요. 무릎이 계속 아프다고 하셨어요.'`;

const n = { type: ["number", "null"] };
const b = { type: ["boolean", "null"] };
const s = { type: ["string", "null"] };
const ch = { type: ["string", "null"], enum: ["improved", "same", "worse", null] };
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const quotes = { type: "array", items: { type: "string" } };

const SCHEMA = obj({
  physical: obj({ personalHygiene: b, bathing: b, mealAssist: b, repositioning: b, mobility: b, toileting: b, minutes: n }),
  physicalNote: s,
  cognitive: obj({ stimulation: n, dailyLiving: n, behaviorManagement: n, emotional: n }),
  household: obj({ mealPrepCleaningLaundry: b, personalActivity: b, minutes: n }),
  change: obj({ physical: ch, meal: ch, cognitive: ch }),
  bowel: obj({ stoolAccidents: n, urineAccidents: n, diaperChanges: n }),
  notes: s,
  quotes: obj({ physical: quotes, cognitive: quotes, household: quotes, change: quotes, bowel: quotes, notes: quotes }),
});

type Section = keyof SaidQuotes;

const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
const int = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const change = (v: unknown): Change | null => (v === "improved" || v === "same" || v === "worse" ? v : null);
const squash = (t: string) => t.replace(/\s+/g, "");

// AI 응답을 CareRecord 모양으로 거르고, 근거 문장이 입력에 없는 칸은 비운다 (LAW-2: 지어낸 기록 막기)
export function checkAiRecord(raw: unknown, input: string): { record: CareRecord; quotes: SaidQuotes } {
  const r = (raw ?? {}) as Record<string, Record<string, unknown> | unknown>;
  const g = (k: string) => (r[k] ?? {}) as Record<string, unknown>;
  const p = g("physical"), c = g("cognitive"), h = g("household"), cg = g("change"), bw = g("bowel"), q = g("quotes");
  const record: CareRecord = {
    physical: {
      personalHygiene: bool(p.personalHygiene), bathing: bool(p.bathing), mealAssist: bool(p.mealAssist),
      repositioning: bool(p.repositioning), mobility: bool(p.mobility), toileting: bool(p.toileting), minutes: int(p.minutes, 600),
    },
    physicalNote: str(r.physicalNote),
    cognitive: { stimulation: int(c.stimulation, 600), dailyLiving: int(c.dailyLiving, 600), behaviorManagement: int(c.behaviorManagement, 600), emotional: int(c.emotional, 600) },
    household: { mealPrepCleaningLaundry: bool(h.mealPrepCleaningLaundry), personalActivity: bool(h.personalActivity), minutes: int(h.minutes, 600) },
    change: { physical: change(cg.physical), meal: change(cg.meal), cognitive: change(cg.cognitive) },
    bowel: { stoolAccidents: int(bw.stoolAccidents, 50), urineAccidents: int(bw.urineAccidents, 50), diaperChanges: int(bw.diaperChanges, 50) },
    notes: str(r.notes),
  };
  for (const group of [record.physical, record.household] as Record<string, boolean | number | null>[]) {
    const checks = Object.keys(group).filter((k) => k !== "minutes");
    if (checks.some((k) => group[k] === true)) for (const k of checks) group[k] ??= false;
  }
  const whole = squash(input);
  const found = (k: Section) => (Array.isArray(q[k]) ? (q[k] as unknown[]) : []).filter((x): x is string => typeof x === "string" && !!x.trim() && whole.includes(squash(x)));
  const said = {} as SaidQuotes;
  const empty: { [K in Section]: () => void } = {
    physical: () => { record.physical = { personalHygiene: null, bathing: null, mealAssist: null, repositioning: null, mobility: null, toileting: null, minutes: null }; record.physicalNote = null; },
    cognitive: () => { record.cognitive = { stimulation: null, dailyLiving: null, behaviorManagement: null, emotional: null }; },
    household: () => { record.household = { mealPrepCleaningLaundry: null, personalActivity: null, minutes: null }; },
    change: () => { record.change = { physical: null, meal: null, cognitive: null }; },
    bowel: () => { record.bowel = { stoolAccidents: null, urineAccidents: null, diaperChanges: null }; },
    notes: () => { record.notes = null; },
  };
  for (const k of Object.keys(empty) as Section[]) {
    const hits = found(k);
    said[k] = hits.length ? hits.join(" ") : null;
    if (!hits.length) empty[k]();
  }
  return { record, quotes: said };
}

export async function fillRecord(redacted: string) {
  // 키가 없을 때 파일을 불러오기만 해도 죽지 않게 부를 때 만든다
  const groq = new Groq({ apiKey: cleanEnv(process.env.GROQ_API_KEY) });
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    reasoning_effort: "low", // 무료 한도(분당 토큰)를 아끼려고
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: redacted },
    ],
    response_format: { type: "json_schema", json_schema: { name: "care_record", strict: true, schema: SCHEMA } },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI 정리 응답이 비어 있어요.");
  return checkAiRecord(JSON.parse(raw), redacted);
}

// AI가 비운 숫자 칸(시간·횟수)만 낱말 찾기(_extract.ts) 결과로 메운다. 숫자는 말한 그대로라 낱말 찾기도 잘 맞는다.
// 체크 칸은 AI 판단을 둔다('반찬 만들어 드림'을 식사도움으로 잘못 잡는 등 낱말 찾기가 틀리기 쉬움), 글 칸은 군말이 다시 들어와서 메우지 않는다
export function fillGaps(ai: { record: CareRecord; quotes: SaidQuotes }, old: { record: CareRecord; quotes: SaidQuotes }) {
  const groups = { physical: "physical", cognitive: "cognitive", household: "household", bowel: "bowel" } as const;
  const record = structuredClone(ai.record);
  const quotes = { ...ai.quotes };
  for (const [g, q] of Object.entries(groups) as [keyof typeof groups, Section][]) {
    const mine = record[g] as Record<string, unknown>;
    const theirs = old.record[g] as Record<string, unknown>;
    let used = false;
    for (const k of Object.keys(mine)) {
      if (mine[k] === null && typeof theirs[k] === "number") {
        mine[k] = theirs[k];
        used = true;
      }
    }
    if (used && !quotes[q]) quotes[q] = old.quotes[q];
  }
  return { record, quotes };
}
