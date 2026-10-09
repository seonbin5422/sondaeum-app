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
