// docs/spec/02-data-model.md "급여제공기록지 기록" 절과 같은 모양. 개발 1이 API를 만들면 그쪽 타입으로 바꾼다.

export type Change = "improved" | "same" | "worse"; // 호전 / 유지 / 악화

export type CareRecord = {
  physical: {
    personalHygiene: boolean | null;
    bathing: boolean | null;
    mealAssist: boolean | null;
    repositioning: boolean | null;
    mobility: boolean | null;
    toileting: boolean | null;
    minutes: number | null;
  };
  physicalNote: string | null;
  cognitive: {
    stimulation: number | null;
    dailyLiving: number | null;
    behaviorManagement: number | null;
    emotional: number | null;
  };
  household: {
    mealPrepCleaningLaundry: boolean | null;
    personalActivity: boolean | null;
    minutes: number | null;
  };
  change: {
    physical: Change | null;
    meal: Change | null;
    cognitive: Change | null;
  };
  bowel: {
    stoolAccidents: number | null;
    urineAccidents: number | null;
    diaperChanges: number | null;
  };
  notes: string | null; // 기록지·진료 참고용 요약에 쓰는 기록체("~함")
  guardianNotes?: string | null;
  notesAsk?: string | null; // notesNoAction일 때 무엇을 더 말해야 하는지 묻는 한 문장 (예: 무릎 통증에 어떻게 도와드렸나요?)
  notesNoAction?: boolean; // AI 판단: 특이사항에 관찰만 있고 요양보호사가 한 도움·조치가 없음 → 기록 확인에서 더 말하도록 안내 // 같은 내용을 보호자 보고서용 '~요'체로. 없거나 특이사항을 직접 고치면 notes를 보여 준다
};

export type VisitStatus = "NOT_STARTED" | "RECORDING" | "RECORDED" | "SUMMARIZING" | "DRAFT_READY" | "SENT";

export type TodayVisit = {
  visitId: string;
  clientId: string;
  clientName: string;
  scheduleLabel: string;
  status: VisitStatus;
  interrupted: boolean; // 녹음이 중간에 멈춤 (D-27)
};

export type GuardianReportProps = {
  guardianName: string;
  guardianTitle?: string; // contactTitle, 없으면 "보호자"
  clientName: string;
  caregiverName: string;
  startedAt: string;
  endedAt: string;
  record: CareRecord;
};

// 보호자와 수급자의 관계. 가족이 없는 어르신은 기관·공공 담당자가 받고, 아무도 없으면 "없음" (D-49)
export const FAMILY_RELATIONS = ["딸", "아들", "배우자", "이웃·친척", "기타"] as const;
export const STAFF_RELATIONS = ["기관 사회복지사", "주민센터 담당자", "후견인"] as const;
export const NO_CONTACT = "없음";

// 이름 뒤에 붙이는 호칭: "김○○ 보호자님", "박○○ 사회복지사님"
export function contactTitle(relation: string) {
  return ({ "기관 사회복지사": "사회복지사", "주민센터 담당자": "담당자", 후견인: "후견인" } as Record<string, string>)[relation] ?? "보호자";
}

export const CARE_GRADES =["1등급", "2등급", "3등급", "4등급", "5등급", "인지지원등급"] as const;
export type CareGrade = (typeof CARE_GRADES)[number];

export type ClientProfile = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  allergies: string | null;
  medicalHistory: string | null;
  medicationNotes: string | null;
  personalNotes: string | null;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string | null; // 보호자 전화번호 (대화방 초대 문자에 씀)
  guardianJoined: boolean; // 보호자가 대화방에 들어왔는지
  careRegistrationNumber: string | null;
  careGrade: CareGrade | null; // 장기요양등급 (LAW-4)
  phone: string | null; // 수급자 전화번호
  scheduleLabel: string;
  scheduleDays: number[]; // 0=일 … 6=토
  isActive: boolean;
};

export type HistoryVisit = {
  visitId: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
  status: VisitStatus;
  record: CareRecord;
  shareToken?: string; // 보낸 기록의 보호자 링크 (/v1120/g/[token])
  signatures?: Signatures; // 급여제공기록지 서명 (LAW-9). 요양보호사 쪽에서만 읽고 저장한다
};

// 서명 한 획 = 점 목록. 좌표는 서명칸 크기와 상관없는 0~400 · 0~120 값 (SignatureBox의 W·H)
export type Stroke = [number, number][];
export type Signatures = { recipient: Stroke[]; caregiver: Stroke[]; reason: string };

export type ChatMessage = {
  id: string;
  from: "caregiver" | "guardian";
  at: string; // ISO
  text?: string;
  report?: { shareToken: string; title: string }; // 보고서 카드. DB는 Message.reportId, 링크는 /g/[shareToken] (D-45)
};
