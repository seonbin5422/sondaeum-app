// 1120.ver 화면용 임시 데이터. DB에 쓰지 않는다. API 연결 때 page.tsx의 조회로 바꾼다.
import type { CareRecord, GuardianReportProps, TodayVisit } from "./_types";

export const caregiverName = "박현우";

export const todayVisits: TodayVisit[] = [
  { visitId: "v-hong", clientId: "c-hong", clientName: "홍길순", scheduleLabel: "월·수·금 09:00–11:00", status: "RECORDING", interrupted: true },
  { visitId: "v-kim", clientId: "c-kim", clientName: "김영자", scheduleLabel: "화·목 13:00–15:00", status: "NOT_STARTED", interrupted: false },
  { visitId: "v-lee", clientId: "c-lee", clientName: "이복순", scheduleLabel: "매일 16:00–17:00", status: "SENT", interrupted: false },
];

export function findVisit(visitId: string) {
  return todayVisits.find((v) => v.visitId === visitId) ?? null;
}

export const sampleRecord: CareRecord = {
  physical: { personalHygiene: true, bathing: false, mealAssist: true, repositioning: null, mobility: true, toileting: false, minutes: 60 },
  physicalNote: "세수를 도와드리고, 점심을 다 드시도록 도와드렸어요. 산책을 다녀오셨어요.",
  cognitive: { stimulation: 20, dailyLiving: 0, behaviorManagement: 0, emotional: 30 },
  household: { mealPrepCleaningLaundry: true, personalActivity: false, minutes: 40 },
  change: { physical: "worse", meal: "same", cognitive: "same" },
  bowel: { stoolAccidents: 0, urineAccidents: 0, diaperChanges: null },
  notes: "오후에 오른쪽 무릎이 아프다고 하셨어요. 혈압 128/82, 점심 약 드셨어요.",
};

export const sampleGuardianReport: GuardianReportProps = {
  guardianName: "김○○",
  clientName: "홍길순",
  caregiverName: "이○○",
  startedAt: "2026-10-06T09:00:00+09:00",
  endedAt: "2026-10-06T12:00:00+09:00",
  record: sampleRecord,
};

export const guardianName = "김○○";

// AI가 녹음 내용으로 채운 초안 (C-14 와이어 263:171). 말하지 않은 칸은 null → "확인 필요".
export const aiDraftRecord: CareRecord = {
  physical: { personalHygiene: true, bathing: false, mealAssist: true, repositioning: false, mobility: true, toileting: false, minutes: 60 },
  physicalNote: "세수를 도와드리고, 점심을 다 드시도록 도와드렸어요. 산책을 다녀오셨어요.",
  cognitive: { stimulation: 20, dailyLiving: null, behaviorManagement: null, emotional: 30 },
  household: { mealPrepCleaningLaundry: true, personalActivity: false, minutes: 40 },
  change: { physical: null, meal: null, cognitive: null },
  bowel: { stoolAccidents: 0, urineAccidents: null, diaperChanges: null },
  notes: "오후에 오른쪽 무릎이 아프다고 하심. 혈압 128/82, 점심 약 드심.",
};

// 항목마다 보여 줄 "내가 한 말" (AI가 근거로 쓴 문장). 개발 1의 aiRawJson 항목별 근거로 바꾼다.
export const saidQuotes = {
  physical: "세수 도와드리고, 점심 다 드시게 도와드렸어요. 산책 다녀왔어요",
  cognitive: "옛날 사진 보면서 20분 이야기했어요",
  notes: "오후에 무릎 아프다고 하셨어요. 혈압은 128에 82",
};

export const sampleTranscript =
  "아침에 세면하고 옷 갈아입는 거 도와드렸어요. 식사는 죽 반 그릇 드셨고, 말벗은 30분 정도 했어요.";

export const visitTime = { date: "10월 6일", start: "09:00", end: "12:00", minutes: 180 };
