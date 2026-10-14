import Groq from "groq-sdk";
import { cleanEnv } from "@/lib/env";
import type { CareRecord, Change } from "./_types";
import { minutesIn, type SaidQuotes } from "./_extract";

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
7. notes는 관찰한 것 → 요양보호사가 한 도움·조치 → 누구에게 알렸는지(보호자·간호사·기관) 순서로 씁니다. 도움·전달을 말하지 않았으면 지어내지 않습니다(예: '보호자에게 전달함'은 전달했다고 말했을 때만).
8. notes에 '고집이 세다'·'예민하다'·'까다롭다' 같은 평가하는 말을 쓰지 않습니다. 말한 행동만 씁니다(예: '까다로우셔서 목욕 안 하신다고 하셔서' → '목욕을 하지 않겠다고 하셨어요').
9. 말이 서로 맞지 않으면 둘 다 notes에 쓰고 어느 쪽이 맞는지 결론 내지 않습니다(예: '약 드셨다고 하셨는데 약통에 그대로' → '아침 약 드셨다고 하셨으나 약통에 약이 그대로 있음.', '복용 안 함'처럼 단정하지 않음).
10. '빨갛게 된 데 없었어요'처럼 확인했더니 이상이 없었다는 말도 확인한 사항이라 notes에 씁니다(예: '엉덩이 피부 발적 없음 확인.').

칸 설명:
- physical(신체활동지원): personalHygiene=세면·양치·머리 감기·면도·옷 갈아입기·몸단장, bathing=목욕·샤워, mealAssist=식사도움, repositioning=체위변경, mobility=이동도움·산책 부축·휠체어, toileting=화장실 이용 도움. 신체활동을 하나라도 말했으면 한 것은 true, 말하지 않은 것은 false. 하나도 말하지 않았으면 모두 null. minutes=신체활동에 걸린 시간(분).
- physicalNote: 신체활동으로 한 일을 가족이 읽기 쉽게 1~2문장. 없으면 null.
- cognitive(인지·정서, 각각 분): stimulation=인지자극활동(사진·퍼즐·노래·그림), dailyLiving=일상생활 함께하기(같이 요리·정리), behaviorManagement=인지행동변화 관리(배회·불안 돌봄), emotional=의사소통·말벗·격려. 노래 같이 부르기·사진 보며 얘기 나누기처럼 함께 한 활동에 시간을 말했으면 notes에만 쓰지 말고 이 칸에 넣습니다. 했다고 말했지만 시간을 말하지 않았으면 그 칸은 null로 두되, quotes.cognitive에는 그 문장을 넣습니다(요양보호사가 확인 화면에서 시간을 채웁니다).
- household(가사·일상생활지원): mealPrepCleaningLaundry=식사준비·청소·세탁·설거지, personalActivity=외출 동행·장보기. 하나라도 말했으면 한 것 true, 말하지 않은 것 false. 하나도 없으면 모두 null. minutes=가사에 걸린 시간(분).
- change(지난 방문과 비교한 변화): physical=신체기능, meal=식사기능, cognitive=인지기능. 좋아졌다="improved", 비슷하다="same", 나빠졌다·줄었다="worse". '지난번엔 알아보셨는데 오늘은 못 알아보셨어요'처럼 지난번과 다르다고 말한 것도 변화입니다. 비교를 말하지 않았으면 null.
- bowel: stoolAccidents=대변 실수 횟수, urineAccidents=소변 실수 횟수, diaperChanges=기저귀 교환 횟수. "실수 없었다"는 0. 말하지 않았으면 null.
- notes(특이사항, 급여제공기록지 칸): 급여 제공 중 확인한 사항과 조치사항입니다. 혈압·복약·통증·낙상·어지럼·병원·기분, 식사량과 음식 반응(예: '한 숟갈 드심', '짜다고 안 드심'), 반복해서 하신 말처럼 위 칸에 들어가지 않는 관찰. 한 문장이 다른 칸의 근거여도 이런 관찰이 있으면 notes에도 씁니다.
- 한 활동의 시간은 가장 맞는 칸 하나에만 넣습니다(예: '사진 보며 말벗 30분'은 emotional에만). '삼십 분'·'한 시간 반'처럼 말한 시간도 분 숫자로 바꿉니다. 군말과 반복을 빼고 한 가지 사실을 한 문장으로, 최대 5문장. 숫자는 들은 그대로. 없으면 null.
- notes는 기록지 문체로 씁니다: '~함'·'~음'·'~섭취'처럼 짧게 끝내고 주어는 뺍니다. notes에는 '~요'로 끝나는 문장이 하나도 없어야 합니다. '상태 안 좋음'·'세면 도움 줌'처럼 뭉뚱그리지 말고, 말한 수치·양·부위·횟수·좌우·장소·준비물을 그대로 넣어 구체적으로 씁니다. 말하지 않은 좌우·횟수·수치는 예시를 따라 붙이지 않습니다(예: '무릎 아프다고' → '무릎 통증 호소함', '우측'을 붙이면 지어낸 것. '기침 좀' → '기침 보임', '몇 회'를 붙이지 않음). '드셨고'·'드렸음'처럼 말을 그대로 옮기지 말고 '섭취'·'도움'·'진행함'처럼 기록지 말로 바꿉니다. 객관적 사실만 쓰고, 요양보호사가 진단하거나 치료한 것처럼 쓰지 않습니다(예: '감기 기운 있음'이 아니라 '기침 2회, 이마가 뜨겁다고 하심').
  예: '어 점심은 반 공기? 드시다가 기침을 두 번 하셔서 천천히 드시라고 옆에서 도와드렸고 따님한테 전화로 말씀드렸어요' → '점심 식사 1/2 공기 섭취. 식사 중 기침 2회 보여 천천히 드시도록 옆에서 도움. 보호자에게 전화로 전달함.'
  예: '오른쪽 무릎 아프다 하셔서 걸으실 때 부축했어요' → '우측 무릎 통증 호소하여 이동 시 부축함.'
  자주 쓰는 문장 예(문체만 참고하고 내용은 말한 것만): '일반식 2/3 섭취. 소화 상태 양호하며 식후 따뜻한 물 복용 도움.' / '체위 변경 2시간 간격으로 시행(좌측→우측). 엉덩이 피부 발적 없음 확인.' / '오전 중 산책 후 말벗 서비스 20분 진행. 기분 양호하시며 옛날 이야기 나누심.'
  예: '약 드셨다고 하셨는데 약통 보니까 그대로 있더라고요' → '아침 약 드셨다고 하셨으나 약통에 약이 그대로 있음.' ('복용 안 함'·'안 드신 것 확인'은 틀림)
- notesNoAction: notes에 관찰(통증·기침·식사량 감소·혈압 이상 등)만 있고 그에 대해 요양보호사가 한 도움·조치를 말하지 않았으면 true. 조치가 있거나, 조치가 필요 없는 일상 사실만 있거나, notes가 null이면 false.
- guardianNotes: notes의 문장을 하나도 빼거나 더하지 않고 한 문장씩 그대로 옮기며 말투만 바꿉니다(혈압·전달 문장도 빠짐없이). 섭취·호소·발적·우측 같은 기록지 말은 '드셨어요'·'아프다고 하셨어요'·'빨갛게 된 곳'·'오른쪽'처럼 쉬운 말로 바꿉니다. notes가 null이면 null.
- guardianNotes에서 누가 한 일인지 바뀌면 안 됩니다. 요양보호사가 해 드린 일은 '~해 드렸어요'·'~드렸어요', 어르신이 하신 일은 '~하셨어요'로 씁니다(예: '따뜻한 물 제공 및 등 두드림함' → '따뜻한 물을 드리고 등을 두드려 드렸어요', '따뜻한 물 드시고 등 두드리셨어요'는 틀림).
- physicalNote와 guardianNotes는 모든 문장을 '~했어요'·'~셨어요'처럼 끝내고('~습니다' 금지) 사람은 '어르신'이라고 부릅니다.
  예: notes '점심 식사 1/2 공기 섭취. 식사 중 기침 2회 보여 천천히 드시도록 옆에서 도움. 보호자에게 전화로 전달함.' → guardianNotes '점심을 반 공기 드셨어요. 드시다가 기침을 2번 하셔서 천천히 드시도록 옆에서 도와드렸어요. 보호자님께 전화로 알려 드렸어요.'`;

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
  guardianNotes: s,
  notesNoAction: { type: "boolean" },
  quotes: obj({ physical: quotes, cognitive: quotes, household: quotes, change: quotes, bowel: quotes, notes: quotes }),
});

type Section = keyof SaidQuotes;

const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
const int = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.replace(/\.?-요/g, ".").trim() : null); // 모델이 가끔 ".-요"를 붙인다
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
    guardianNotes: str(r.guardianNotes),
    notesNoAction: r.notesNoAction === true,
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
    notes: () => { record.notes = null; record.guardianNotes = null; record.notesNoAction = false; },
  };
  for (const k of Object.keys(empty) as Section[]) {
    const hits = found(k);
    said[k] = hits.length ? hits.join(" ") : null;
    if (!hits.length) empty[k]();
  }
  // 인지·정서 근거 문장에 시간이 없으면 그 분은 다른 활동 시간을 옮겨 온 것이다(식사도움 30분이 말벗 30분으로) → 비워서 "확인 필요"로
  if (said.cognitive && minutesIn(said.cognitive) === null) {
    record.cognitive = { stimulation: null, dailyLiving: null, behaviorManagement: null, emotional: null };
  }
  return { record, quotes: said };
}

// AI가 특이사항을 쓰고 근거 문장을 빠뜨리면 checkAiRecord가 특이사항을 통째로 지운다 → 그때만 한 번 더 묻는다
export const notesLost = (raw: unknown, checked: { record: CareRecord }) =>
  !!str((raw as { notes?: unknown } | null)?.notes) && checked.record.notes === null;

async function askAi(redacted: string) {
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
  return JSON.parse(raw) as unknown;
}

export async function fillRecord(redacted: string) {
  const raw = await askAi(redacted);
  const first = checkAiRecord(raw, redacted);
  if (!notesLost(raw, first)) return first;
  // 다시 묻는 것도 실패하면(무료 한도 등) 첫 결과를 쓴다. SEC-3 호출 수는 한 번으로 센다
  try {
    return checkAiRecord(await askAi(redacted), redacted);
  } catch {
    return first;
  }
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
    // 인지·정서는 한 활동 시간이 여러 칸에 들어가기 쉽다(사진 보며 얘기 30분 → 인지자극 30·말벗 30). AI가 한 칸이라도 채웠으면 메우지 않는다
    if (g === "cognitive" && Object.values(mine).some((v) => v !== null)) continue;
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
