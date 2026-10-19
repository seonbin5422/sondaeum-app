import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionCaregiverId } from "@/lib/session";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";
import { WEEKDAY_LABELS, getScheduleTimeRange, parseScheduleDays } from "@/lib/schedule";
import type { Client } from "@/app/generated/prisma/client";
import { decryptText, safeDecryptText } from "@/lib/crypto";
import type { CareGrade, CareRecord, ClientProfile, HistoryVisit, Signatures } from "./_types";
import { cleanSignatures } from "./_signatures";
import type { SaidQuotes } from "./_extract";

// 1120.ver 화면이 DB에서 읽는 곳. 수급자는 로그인한 요양보호사 것만 보인다 (SEC-2).

export const requireCaregiver = cache(async () => {
  const id = await getSessionCaregiverId();
  const caregiver = id ? await prisma.caregiver.findUnique({ where: { id } }) : null;
  if (!caregiver) redirect("/v1120/login");
  return caregiver;
});

// DB의 "월,수,금 09:00-11:00"을 화면의 "월·수·금 09:00–11:00"으로
export function displaySchedule(label: string | null) {
  return label ? label.replaceAll(",", "·").replace("-", "–") : "일정 미입력";
}

export function toProfile(c: Client): ClientProfile {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    allergies: c.allergies,
    medicalHistory: c.medicalHistory,
    medicationNotes: c.medicationNotes,
    personalNotes: c.personalNotes,
    guardianName: c.guardianName,
    guardianRelation: c.guardianRelation,
    guardianPhone: c.guardianPhone,
    guardianJoined: false, // shortcut: 대화방(DIF-5) 모델이 생기면 보호자 첫 입장 시각으로 바꾼다
    careRegistrationNumber: c.careRegistrationNumber,
    careGrade: c.careGrade as CareGrade | null,
    phone: c.phone,
    scheduleLabel: displaySchedule(c.scheduleLabel),
    scheduleDays: parseScheduleDays(c.scheduleLabel).map((d) => WEEKDAY_LABELS.indexOf(d)),
    isActive: c.isActive,
  };
}

// 내 수급자 전부 (삭제한 것 포함, 완전히 지우기 예약된 것 제외)
export async function myClients() {
  const caregiver = await requireCaregiver();
  await purgeExpiredClients();
  const rows = await prisma.client.findMany({
    where: { caregiverId: caregiver.id, purgeAt: null },
    orderBy: { name: "asc" },
  });
  return rows.map(toProfile);
}

// 내 수급자 하나. 남의 수급자거나 없으면 null
export async function myClient(id: string) {
  const caregiver = await requireCaregiver();
  const c = await prisma.client.findFirst({ where: { id, caregiverId: caregiver.id, purgeAt: null } });
  return c ? toProfile(c) : null;
}

// ---- 방문 기록 (2단계) ----

const KST = "Asia/Seoul";

// 한국 시간 기준 오늘 0시~내일 0시 (서버는 UTC)
export function kstTodayRange() {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: KST }).format(new Date()); // YYYY-MM-DD
  const start = new Date(`${ymd}T00:00:00+09:00`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function kstWeekday(d = new Date()) {
  return WEEKDAY_LABELS.indexOf(new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: KST }).format(d));
}

// 서비스 시간 = 수급자를 등록할 때 정한 계약 시간(scheduleLabel의 시작~끝)을 방문한 날에 놓은 것.
// 기록을 시작·끝낸 시각(Visit.startedAt·endedAt)과 다르다 (D-37)
export function serviceTimeOf(scheduleLabel: string | null, visitDay: Date) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: KST }).format(visitDay);
  const [start, end] = (getScheduleTimeRange(scheduleLabel) || "").split("-");
  // 계약 시간이 없는 옛 수급자는 시간을 비워 둔다
  const s = start ? new Date(`${ymd}T${start.padStart(5, "0")}:00+09:00`) : null;
  const e = end ? new Date(`${ymd}T${end.padStart(5, "0")}:00+09:00`) : null;
  const md = new Intl.DateTimeFormat("ko-KR", { timeZone: KST, month: "numeric", day: "numeric" }).formatToParts(visitDay);
  const part = (t: string) => md.find((p) => p.type === t)?.value;
  return {
    date: `${part("month")}월 ${part("day")}일 (${WEEKDAY_LABELS[kstWeekday(visitDay)]})`,
    start: start ?? "--:--",
    end: end ?? "--:--",
    minutes: s && e ? Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000)) : 0,
    startedAt: (s ?? visitDay).toISOString(),
    endedAt: (e ?? visitDay).toISOString(),
  };
}

// 오늘 내 방문들 (수급자별로 가장 최근 것)
export async function myTodayVisits() {
  const caregiver = await requireCaregiver();
  const { start, end } = kstTodayRange();
  const visits = await prisma.visit.findMany({
    where: { caregiverId: caregiver.id, createdAt: { gte: start, lt: end } },
    orderBy: { createdAt: "desc" },
    select: { id: true, clientId: true, status: true, transcript: true },
  });
  const byClient = new Map<string, (typeof visits)[number]>();
  for (const v of visits) if (!byClient.has(v.clientId)) byClient.set(v.clientId, v);
  return byClient;
}

// 내 방문 하나 + 수급자 + 복호화한 기록. 남의 방문이면 null
export async function myVisit(visitId: string) {
  const caregiver = await requireCaregiver();
  const v = await prisma.visit.findFirst({
    where: { id: visitId, caregiverId: caregiver.id },
    include: { client: true, report: true },
  });
  if (!v) return null;
  const json = <T>(enc: string | null | undefined): T | null => {
    if (!enc) return null;
    try {
      return JSON.parse(decryptText(enc)) as T;
    } catch {
      return null;
    }
  };
  return {
    id: v.id,
    status: v.status,
    caregiverName: caregiver.name,
    client: toProfile(v.client),
    transcript: v.transcript ? safeDecryptText(v.transcript, "") : "",
    record: json<CareRecord>(v.report?.careRecord),
    quotes: json<SaidQuotes>(v.report?.aiRawJson),
    edited: v.report?.wasEdited ?? false,
    shareToken: v.report?.shareToken ?? null,
    sentAt: v.report?.sentAt ?? null,
    time: serviceTimeOf(v.client.scheduleLabel, v.startedAt ?? v.createdAt),
  };
}

// ---- 이력·서류 (3단계) ----

export function kstYmd(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST }).format(d); // YYYY-MM-DD
}

export function kstYmdDaysAgo(days: number) {
  return kstYmd(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

const EMPTY_RECORD: CareRecord = {
  physical: { personalHygiene: null, bathing: null, mealAssist: null, repositioning: null, mobility: null, toileting: null, minutes: null },
  physicalNote: null,
  cognitive: { stimulation: null, dailyLiving: null, behaviorManagement: null, emotional: null },
  household: { mealPrepCleaningLaundry: null, personalActivity: null, minutes: null },
  change: { physical: null, meal: null, cognitive: null },
  bowel: { stoolAccidents: null, urineAccidents: null, diaperChanges: null },
  notes: null,
};

// 내 수급자의 방문 기록 (최근 것부터). 시간은 서비스 시간(계약 시간, D-37)
export async function myHistory(clientId: string): Promise<HistoryVisit[]> {
  const caregiver = await requireCaregiver();
  const visits = await prisma.visit.findMany({
    where: { clientId, caregiverId: caregiver.id, client: { caregiverId: caregiver.id } },
    include: { report: true, client: { select: { scheduleLabel: true } } },
    orderBy: { createdAt: "desc" },
  });
  return visits.map((v) => {
    const day = v.startedAt ?? v.createdAt;
    const time = serviceTimeOf(v.client.scheduleLabel, day);
    let record = EMPTY_RECORD;
    try {
      if (v.report?.careRecord) record = JSON.parse(decryptText(v.report.careRecord)) as CareRecord;
    } catch {}
    return {
      visitId: v.id,
      date: kstYmd(day),
      start: time.start,
      end: time.end,
      status: v.status,
      record,
      shareToken: v.status === "SENT" ? v.report?.shareToken : undefined,
      signatures: readSignatures(v.report?.signatures),
    };
  });
}

// 저장된 서명을 풀어 읽는다. 풀 수 없으면 빈 서명칸으로 보여 준다
function readSignatures(enc: string | null | undefined): Signatures | undefined {
  if (!enc) return undefined;
  try {
    return cleanSignatures(JSON.parse(decryptText(enc)));
  } catch {
    return undefined;
  }
}
