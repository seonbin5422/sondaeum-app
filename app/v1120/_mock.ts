// 1120.ver 화면용 임시 데이터. DB에 쓰지 않는다. API 연결 때 page.tsx의 조회로 바꾼다.
import type { CareRecord, ChatMessage, ClientProfile, GuardianReportProps, HistoryVisit, TodayVisit } from "./_types";

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

export const sampleTranscript =
  "아침에 세수하고 옷 갈아입는 거 도와드렸어요. 점심은 죽 반 그릇 드셨어요. 세면이랑 식사 도와드리는 데 40분 걸렸어요. 옛날 사진 보면서 말벗 30분 했어요. 설거지랑 빨래 20분 했어요. 소변 실수 한 번 있었고 대변 실수는 없었어요. 지난번보다 식사량이 줄었어요. 혈압은 135에 85였고 아침 약 드셨어요.";

// 오늘 방문의 서비스 시간: 그 수급자 일정(scheduleLabel의 시작·끝)과 오늘 날짜로 계산한다.
// 실제로는 출근·퇴근 버튼을 누른 시각(Visit.startedAt·endedAt)을 쓴다.
export const TODAY_ISO = "2026-10-09";
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
export function visitInfo(visitId: string) {
  const v = findVisit(visitId);
  const m = v?.scheduleLabel.match(/(\d\d):(\d\d)–(\d\d):(\d\d)/);
  const [sh, sm, eh, em] = m ? m.slice(1).map(Number) : [9, 0, 11, 0];
  const d = new Date(`${TODAY_ISO}T12:00:00+09:00`);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`,
    start: `${pad(sh)}:${pad(sm)}`,
    end: `${pad(eh)}:${pad(em)}`,
    minutes: eh * 60 + em - (sh * 60 + sm),
    startedAt: `${TODAY_ISO}T${pad(sh)}:${pad(sm)}:00+09:00`,
    endedAt: `${TODAY_ISO}T${pad(eh)}:${pad(em)}:00+09:00`,
  };
}


export const caregiverLicense = "2019-서울-012345";

export const clients: ClientProfile[] = [
  {
    id: "c-hong", name: "홍길순", age: 82, gender: "여", allergies: "없음", medicalHistory: "고혈압, 무릎 관절염",
    medicationNotes: "혈압약(아침), 당뇨약(아침·저녁)", personalNotes: "오른쪽 무릎이 자주 아프심. 계단 이동 때 부축",
    guardianName: "김○○", guardianRelation: "딸", guardianPhone: "010-1111-2222", guardianJoined: true, careRegistrationNumber: "L1234567890", careGrade: "3등급", phone: "010-0000-0000",
    scheduleLabel: "월·수·금 09:00–11:00", scheduleDays: [1, 3, 5], isActive: true,
  },
  {
    id: "c-kim", name: "김영자", age: 79, gender: "여", allergies: "페니실린", medicalHistory: "경도 치매",
    medicationNotes: "치매약(저녁)", personalNotes: null, guardianName: "박○○", guardianRelation: "아들", guardianPhone: "010-3333-4444", guardianJoined: false,
    careRegistrationNumber: "L2345678901", careGrade: "5등급", phone: null, scheduleLabel: "화·목 13:00–15:00", scheduleDays: [2, 4], isActive: true,
  },
  {
    id: "c-lee", name: "이복순", age: 88, gender: "여", allergies: null, medicalHistory: "당뇨",
    medicationNotes: "당뇨약(아침)", personalNotes: "저녁 식사량 확인", guardianName: "이○○", guardianRelation: "아들", guardianPhone: "010-5555-6666", guardianJoined: true,
    careRegistrationNumber: "L3456789012", careGrade: "2등급", phone: null, scheduleLabel: "매일 16:00–17:00", scheduleDays: [0, 1, 2, 3, 4, 5, 6], isActive: true,
  },
  {
    id: "c-choi", name: "최말순", age: 91, gender: "여", allergies: null, medicalHistory: null, medicationNotes: null,
    personalNotes: null, guardianName: "최○○", guardianRelation: "딸", guardianPhone: null, guardianJoined: false, careRegistrationNumber: "L4567890123", careGrade: "1등급", phone: null,
    scheduleLabel: "월 10:00–12:00", scheduleDays: [1], isActive: false,
  },
];

export function findClient(id: string) {
  return clients.find((c) => c.id === id) ?? null;
}

export const unreadByClient: Record<string, number> = { "c-hong": 2, "c-kim": 0, "c-lee": 1 };

// 홍길순 수급자 지난 한 달 방문 (9/9 ~ 10/9, 월·수·금). 진료 참고용 요약·이력 화면이 쓴다.
function makeHistory(): HistoryVisit[] {
  const out: HistoryVisit[] = [];
  const special: Record<string, Partial<CareRecord>> = {
    "2026-10-07": { change: { physical: "same", meal: "worse", cognitive: "same" }, bowel: { stoolAccidents: 0, urineAccidents: 2, diaperChanges: null }, notes: "점심을 반만 드셨어요. 혈압 142/90." },
    "2026-10-05": { change: { physical: "worse", meal: "same", cognitive: "same" }, bowel: { stoolAccidents: 0, urineAccidents: 1, diaperChanges: null }, notes: "오른쪽 무릎이 아프다고 하셨어요. 혈압 128/82." },
    "2026-10-02": { change: { physical: "same", meal: "same", cognitive: "same" }, bowel: { stoolAccidents: 1, urineAccidents: 0, diaperChanges: null }, notes: null },
    "2026-09-30": { change: { physical: "same", meal: "improved", cognitive: "same" }, bowel: { stoolAccidents: 0, urineAccidents: 1, diaperChanges: null }, notes: "밤에 두 번 깨셨다고 하셨어요." },
  };
  for (let d = new Date("2026-09-09T12:00:00+09:00"); d <= new Date("2026-10-09T12:00:00+09:00"); d.setDate(d.getDate() + 1)) {
    if (![1, 3, 5].includes(d.getDay())) continue;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const base: CareRecord = {
      ...structuredClone(sampleRecord),
      change: { physical: "same", meal: "same", cognitive: "same" },
      bowel: { stoolAccidents: 0, urineAccidents: 0, diaperChanges: null },
      notes: null,
      ...structuredClone(special[date] ?? {}),
    };
    out.push({ visitId: `h-${date}`, date, start: "09:00", end: "11:00", status: date === "2026-10-09" ? "RECORDING" : "SENT", record: base });
  }
  return out.reverse(); // 최근 것부터
}

export const historyByClient: Record<string, HistoryVisit[]> = { "c-hong": makeHistory() };

export function historyOf(clientId: string) {
  return historyByClient[clientId] ?? [];
}

export const chatByClient: Record<string, ChatMessage[]> = {
  "c-hong": [
    { id: "m1", from: "caregiver", at: "2026-10-05T12:05:00+09:00", report: { visitId: "h-2026-10-05", title: "10월 5일 방문 보고서" } },
    { id: "m2", from: "guardian", at: "2026-10-05T19:20:00+09:00", text: "무릎이 아프시다고 해서 걱정이네요. 병원에 가 봐야 할까요?" },
    { id: "m3", from: "caregiver", at: "2026-10-06T09:10:00+09:00", text: "걸으실 때 조금 불편해하셨어요. 진료 받아 보시면 좋겠어요. 진료 참고용 요약을 만들어 드릴게요." },
    { id: "m4", from: "caregiver", at: "2026-10-07T12:02:00+09:00", report: { visitId: "h-2026-10-07", title: "10월 7일 방문 보고서" } },
    { id: "m5", from: "guardian", at: "2026-10-07T20:41:00+09:00", text: "식사를 반만 드셨네요. 내일 반찬을 좀 보낼게요." },
    { id: "m6", from: "guardian", at: "2026-10-07T20:42:00+09:00", text: "감사합니다." },
  ],
  "c-kim": [],
  "c-lee": [
    { id: "l1", from: "caregiver", at: "2026-10-08T17:05:00+09:00", report: { visitId: "v-lee", title: "10월 8일 방문 보고서" } },
    { id: "l2", from: "guardian", at: "2026-10-08T21:00:00+09:00", text: "저녁은 잘 드셨나요?" },
  ],
};

export const chatTokenToClient: Record<string, string> = { "hong-demo": "c-hong", "lee-demo": "c-lee", "kim-demo": "c-kim" };

export function chatTokenOf(clientId: string) {
  return Object.keys(chatTokenToClient).find((t) => chatTokenToClient[t] === clientId) ?? null;
}
