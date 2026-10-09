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
  notes: string | null;
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
  clientName: string;
  caregiverName: string;
  startedAt: string;
  endedAt: string;
  record: CareRecord;
};

export const CARE_GRADES = ["1등급", "2등급", "3등급", "4등급", "5등급", "인지지원등급"] as const;
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
};

export type ChatMessage = {
  id: string;
  from: "caregiver" | "guardian";
  at: string; // ISO
  text?: string;
  report?: { visitId: string; title: string };
};
