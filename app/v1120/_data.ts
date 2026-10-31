import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionCaregiverId } from "@/lib/session";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";
import { WEEKDAY_LABELS, getScheduleTimeRange, parseScheduleDays } from "@/lib/schedule";
import type { Client } from "@/app/generated/prisma/client";
import { decryptText, safeDecryptText } from "@/lib/crypto";
import type { BoardComment, BoardPost, CareGrade, CareRecord, ClientProfile, HistoryVisit, Signatures } from "./_types";
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
    guardianJoined: false, // shortcut: 보호자 로그인(D-44)이 생기면 보호자 첫 입장 시각으로 바꾼다
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

// 수급자 게시판(C-18·G-02)의 글: 보낸 보고서마다 하나, 최신 글이 위
type PostRow = {
  startedAt: Date | null;
  createdAt: Date;
  report: { shareToken: string; sentAt: Date | null; careRecord: string | null; comments: { id: string; author: string; body: string; createdAt: Date }[] } | null;
};
const postSelect = {
  startedAt: true,
  createdAt: true,
  report: { select: { shareToken: true, sentAt: true, careRecord: true, comments: { orderBy: { createdAt: "asc" as const } } } },
};
function toPosts(visits: PostRow[]): BoardPost[] {
  return visits
    .flatMap((v) => {
      if (!v.report) return [];
      const [, m, d] = kstYmd(v.startedAt ?? v.createdAt).split("-");
      let record: CareRecord | null = null;
      try {
        record = v.report.careRecord ? (JSON.parse(decryptText(v.report.careRecord)) as CareRecord) : null;
      } catch {}
      return [
        {
          shareToken: v.report.shareToken,
          title: `${+m}월 ${+d}일 방문 보고서`,
          at: (v.report.sentAt ?? v.createdAt).toISOString(),
          kind: "report" as const,
          period: null,
          notes: record?.guardianNotes ?? record?.notes ?? null,
          physicalNote: record?.physicalNote ?? null,
          comments: toComments(v.report.comments),
        },
      ];
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

type CommentRow = { id: string; author: string; body: string; createdAt: Date };
function toComments(rows: CommentRow[]): BoardComment[] {
  return rows.map((c) => ({
    id: c.id,
    from: c.author === "guardian" ? ("guardian" as const) : ("caregiver" as const),
    at: c.createdAt.toISOString(),
    text: safeDecryptText(c.body, "(읽을 수 없는 댓글)"),
  }));
}

// 게시판에 올린 서류(진료 참고용 요약)도 글 하나. 내용은 기간만 두고 볼 때 다시 만든다
const docSelect = { shareToken: true, from: true, to: true, createdAt: true, comments: { orderBy: { createdAt: "asc" as const } } };
const dot = (ymd: string) => `${+ymd.slice(5, 7)}/${+ymd.slice(8)}`;
function docsToPosts(docs: { shareToken: string; from: string; to: string; createdAt: Date; comments: CommentRow[] }[]): BoardPost[] {
  return docs.map((d) => ({
    shareToken: d.shareToken,
    title: `진료 참고용 요약 (${dot(d.from)}~${dot(d.to)})`,
    at: d.createdAt.toISOString(),
    kind: "summary" as const,
    period: { from: d.from, to: d.to },
    notes: `${d.from.replaceAll("-", ".")} ~ ${d.to.replaceAll("-", ".")} 방문 기록을 모은 요약이에요. 진료 때 의료진에게 보여 주세요.`,
    physicalNote: null,
    comments: toComments(d.comments),
  }));
}
const newestFirst = (posts: BoardPost[]) => posts.sort((a, b) => b.at.localeCompare(a.at));

export async function myBoard(clientId: string): Promise<BoardPost[]> {
  const caregiver = await requireCaregiver();
  const [visits, docs] = await Promise.all([
    prisma.visit.findMany({
      where: { caregiverId: caregiver.id, status: "SENT", clientId, client: { caregiverId: caregiver.id, purgeAt: null } },
      select: postSelect,
    }),
    prisma.sharedDocument.findMany({ where: { clientId, client: { caregiverId: caregiver.id, purgeAt: null } }, select: docSelect }),
  ]);
  return newestFirst([...toPosts(visits), ...docsToPosts(docs)]);
}

// 게시판 탭(목록)에 보일 수급자별 최근 글 제목과 댓글 수
export async function myBoardSummary(): Promise<Map<string, { title: string; comments: number }>> {
  const caregiver = await requireCaregiver();
  const visits = await prisma.visit.findMany({
    where: { caregiverId: caregiver.id, status: "SENT", client: { caregiverId: caregiver.id, purgeAt: null } },
    select: { clientId: true, startedAt: true, createdAt: true, report: { select: { sentAt: true, _count: { select: { comments: true } } } } },
  });
  const latest = new Map<string, { at: Date; title: string; comments: number }>();
  for (const v of visits) {
    if (!v.report) continue;
    const at = v.report.sentAt ?? v.createdAt;
    const cur = latest.get(v.clientId);
    if (cur && cur.at >= at) continue;
    const [, m, d] = kstYmd(v.startedAt ?? v.createdAt).split("-");
    latest.set(v.clientId, { at, title: `${+m}월 ${+d}일 방문 보고서`, comments: v.report._count.comments });
  }
  const docs = await prisma.sharedDocument.findMany({
    where: { client: { caregiverId: caregiver.id, purgeAt: null } },
    select: { clientId: true, from: true, to: true, createdAt: true, _count: { select: { comments: true } } },
  });
  for (const d of docs) {
    const cur = latest.get(d.clientId);
    if (cur && cur.at >= d.createdAt) continue;
    latest.set(d.clientId, { at: d.createdAt, title: `진료 참고용 요약 (${dot(d.from)}~${dot(d.to)})`, comments: d._count.comments });
  }
  return latest;
}

// 보호자 게시판 (G-02): 보고서·서류 링크 하나를 가진 보호자가 그 수급자의 게시판을 모두 본다. 로그인 없음
// shortcut: 링크만 있으면 누구나 그 수급자 게시판을 본다, 보호자 로그인(D-44)·링크 만료(STB-5)가 생기면 그걸로 막는다
export async function guardianBoard(shareToken: string) {
  const clientSelect = { id: true, name: true, guardianName: true, guardianRelation: true, isActive: true, purgeAt: true, scheduleLabel: true };
  const [r, doc] = await Promise.all([
    prisma.report.findUnique({ where: { shareToken }, select: { sentAt: true, visit: { select: { caregiver: { select: { name: true } }, client: { select: clientSelect } } } } }),
    prisma.sharedDocument.findUnique({ where: { shareToken }, select: { caregiverId: true, client: { select: clientSelect } } }),
  ]);
  const c = r?.sentAt ? r.visit.client : doc?.client;
  if (!c?.isActive || c.purgeAt) return null;
  const caregiverName = r?.sentAt ? r.visit.caregiver.name : ((await prisma.caregiver.findUnique({ where: { id: doc!.caregiverId }, select: { name: true } }))?.name ?? "");
  const [visits, docs] = await Promise.all([
    prisma.visit.findMany({ where: { clientId: c.id, status: "SENT" }, select: postSelect }),
    prisma.sharedDocument.findMany({ where: { clientId: c.id }, select: docSelect }),
  ]);
  return { clientId: c.id, clientName: c.name, guardianName: c.guardianName, guardianRelation: c.guardianRelation, caregiverName, posts: newestFirst([...toPosts(visits), ...docsToPosts(docs)]) };
}

// 보호자가 게시판에 올라온 서류를 볼 때 쓰는 방문 기록 (보낸 것만). 링크 확인은 guardianBoard에서 먼저 한다
export async function guardianHistory(clientId: string): Promise<HistoryVisit[]> {
  const visits = await prisma.visit.findMany({
    where: { clientId, status: "SENT" },
    include: { report: true, client: { select: { scheduleLabel: true } } },
    orderBy: { createdAt: "desc" },
  });
  return visits.map(toHistoryVisit);
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
  return visits.map(toHistoryVisit);
}

type HistoryRow = { id: string; startedAt: Date | null; createdAt: Date; status: HistoryVisit["status"]; client: { scheduleLabel: string | null }; report: { careRecord: string | null; shareToken: string; signatures: string | null } | null };
function toHistoryVisit(v: HistoryRow): HistoryVisit {
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
