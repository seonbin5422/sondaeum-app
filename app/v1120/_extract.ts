// 1120.ver 임시 "AI 정리": 녹음 내용에서 낱말과 숫자를 찾아 CareRecord를 채운다.
// 진짜 AI(개발 1의 요약 API, LAW-1·2 프롬프트)를 연결하면 이 파일을 지운다.
// 원칙은 AI와 같다: 말하지 않은 칸은 null로 두어 C-14에서 "확인 필요"가 되게 한다.
import type { CareRecord, Change } from "./_types";

export type SaidQuotes = { physical: string | null; cognitive: string | null; household: string | null; change: string | null; bowel: string | null; notes: string | null };

const KO_NUM: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10 };

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|(?<=요)\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// "30분", "한 시간", "1시간 반" → 분
function minutesIn(s: string): number | null {
  const m = s.match(/(\d+)\s*분/);
  if (m) return Number(m[1]);
  const h = s.match(/(\d+|한|두|세)\s*시간(\s*반)?/);
  if (h) return (Number(h[1]) || KO_NUM[h[1]] || 0) * 60 + (h[2] ? 30 : 0);
  return null;
}

// "한 번", "2번", "두 차례" → 횟수. "없었" → 0
function countIn(s: string): number | null {
  if (/없었|없어|안 했|없음/.test(s)) return 0;
  const d = s.match(/(\d+)\s*(번|회|차례)/);
  if (d) return Number(d[1]);
  const k = s.match(/(한|두|세|네|다섯)\s*(번|회|차례)/);
  if (k) return KO_NUM[k[1]];
  return null;
}

const pick = (ss: string[], re: RegExp) => ss.filter((s) => re.test(s));
const join = (ss: string[]) => (ss.length ? ss.join(" ") : null);

const RE = {
  hygiene: /세면|세수|양치|옷|머리|면도|몸단장|구강/,
  bathing: /목욕|샤워|몸\s?씻/,
  meal: /식사|밥|드셨|죽|점심|아침 식|저녁 식|반찬/,
  reposition: /체위|돌려\s?눕|자세/,
  mobility: /이동|산책|걸으|걸어|걷|부축|휠체어/,
  toilet: /화장실/,
  stimulation: /사진|퍼즐|인지|노래|그림|색칠|회상/,
  dailyLiving: /함께\s?(요리|정리|빨래)|같이\s?(요리|정리|빨래)/,
  behavior: /배회|불안해|화를|공격|소리를 지르/,
  emotional: /말벗|이야기|대화|격려|말동무/,
  household: /청소|빨래|세탁|설거지|식사\s?준비|정리/,
  outing: /외출|병원\s?동행|장보|같이 나가/,
  better: /좋아졌|나아졌|호전|더 잘/,
  worse: /나빠졌|안 좋아|줄었|악화|못 드셨|힘들어하/,
  same: /비슷|똑같|그대로|변화 없/,
  stool: /대변|변을/,
  urine: /소변|오줌/,
  diaper: /기저귀/,
  notes: /혈압|약|아프|통증|넘어|열이|기침|병원|어지러/,
};

export function extractRecord(transcript: string): { record: CareRecord; quotes: SaidQuotes } {
  const ss = sentences(transcript);

  // 신체활동지원: 하나라도 말했으면 말한 것만 ✓, 나머지는 안 함. 아무것도 안 말했으면 모두 null.
  const physMatch = { personalHygiene: RE.hygiene, bathing: RE.bathing, mealAssist: RE.meal, repositioning: RE.reposition, mobility: RE.mobility, toileting: RE.toilet };
  // 변화를 말한 문장("식사량이 줄었어요")과 특이사항 문장("약 드셨어요")은 신체활동에서 뺀다
  const isChange = (s: string) => RE.better.test(s) || RE.worse.test(s) || RE.same.test(s);
  const physSentences = ss.filter(
    (s) => Object.values(physMatch).some((re) => re.test(s)) && !RE.emotional.test(s) && !RE.notes.test(s) && !isChange(s),
  );
  const anyPhys = physSentences.length > 0;
  const phys = Object.fromEntries(
    Object.entries(physMatch).map(([k, re]) => [k, anyPhys ? physSentences.some((s) => re.test(s)) : null]),
  ) as Omit<CareRecord["physical"], "minutes">;
  const physMinutes = physSentences.map(minutesIn).find((m) => m !== null) ?? null;

  // 인지·정서: 항목별 분. 말했지만 시간이 없으면 null(확인 필요).
  // 한 문장에 말벗과 다른 활동이 같이 있으면 시간은 말벗(의사소통·말벗·격려)에만 넣는다
  const cogMin = (re: RegExp) => {
    const hit = pick(ss, re).filter((s) => re === RE.emotional || !RE.emotional.test(s));
    if (!hit.length) return null;
    return hit.map(minutesIn).find((m) => m !== null) ?? null;
  };

  // 가사
  const hhSentences = pick(ss, RE.household).filter((s) => !RE.emotional.test(s));
  const outing = pick(ss, RE.outing);
  const anyHh = hhSentences.length > 0 || outing.length > 0;

  // 변화상태: 영역 + 좋아짐/나빠짐/비슷 낱말이 같은 문장에 있을 때만
  const changeOf = (area: RegExp): Change | null => {
    const s = ss.find((x) => area.test(x) && (RE.better.test(x) || RE.worse.test(x) || RE.same.test(x)));
    if (!s) return null;
    return RE.worse.test(s) ? "worse" : RE.better.test(s) ? "improved" : "same";
  };
  const changeSentences = ss.filter((x) => RE.better.test(x) || RE.worse.test(x) || RE.same.test(x));

  // 배변: 실수 횟수
  const countFor = (re: RegExp) => {
    const s = ss.find((x) => re.test(x) && /실수|지렸|못 가리/.test(x)) ?? ss.find((x) => re.test(x) && /없었/.test(x));
    if (!s) return null;
    // "소변 실수 한 번, 대변 실수는 없었어요"처럼 한 문장에 둘이 있으면 그 낱말 뒤만 본다
    const part = s.slice(s.search(re));
    const cut = part.search(re === RE.stool ? RE.urine : RE.stool);
    return countIn(cut > 0 ? part.slice(0, cut) : part);
  };
  const diaperS = ss.find((x) => RE.diaper.test(x));

  const notesS = pick(ss, RE.notes);

  const record: CareRecord = {
    physical: { ...phys, minutes: physMinutes },
    physicalNote: join(physSentences),
    cognitive: {
      stimulation: cogMin(RE.stimulation),
      dailyLiving: cogMin(RE.dailyLiving),
      behaviorManagement: cogMin(RE.behavior),
      emotional: cogMin(RE.emotional),
    },
    household: {
      mealPrepCleaningLaundry: anyHh ? hhSentences.length > 0 : null,
      personalActivity: anyHh ? outing.length > 0 : null,
      minutes: [...hhSentences, ...outing].map(minutesIn).find((m) => m !== null) ?? null,
    },
    change: {
      physical: changeOf(/걸으|걸어|걷|다리|무릎|움직|기운|몸/),
      meal: changeOf(/식사|밥|드시|식사량|입맛/),
      cognitive: changeOf(/기억|정신|헷갈|알아보/),
    },
    bowel: {
      stoolAccidents: countFor(RE.stool),
      urineAccidents: countFor(RE.urine),
      diaperChanges: diaperS ? countIn(diaperS) : null,
    },
    notes: join(notesS),
  };

  const quotes: SaidQuotes = {
    physical: join(physSentences),
    cognitive: join(pick(ss, new RegExp(`${RE.stimulation.source}|${RE.emotional.source}|${RE.behavior.source}`))),
    household: join([...hhSentences, ...outing]),
    change: join(changeSentences),
    bowel: join(pick(ss, new RegExp(`${RE.stool.source}|${RE.urine.source}|${RE.diaper.source}`))),
    notes: join(notesS),
  };

  return { record, quotes };
}
