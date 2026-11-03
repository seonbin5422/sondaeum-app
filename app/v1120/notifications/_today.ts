import "server-only";
import { cookies } from "next/headers";
import {
  kstTodayRange,
  kstWeekday,
  myClients,
  myRecentGuardianComments,
  myRecentUnsentVisits,
  myTodayVisits,
  myUnreadByClient,
  serviceTimeOf,
} from "../_data";
import type { TodayVisit, VisitStatus } from "../_types";

// 홈(C-03)과 알림이 같이 쓰는 계산. 알림은 따로 저장하지 않고 방문·댓글에서 바로 만든다.
export type HomeVisit = TodayVisit & { time: string; start: string };

export const SEEN_COOKIE = "v1120_noti_seen";

export const timeOf = (label: string) => (/\d/.test(label) ? (label.split(" ").pop() ?? "") : "");
export const startOf = (label: string) => timeOf(label).split("–")[0].padStart(5, "0");

const hm = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
export const kstNowHm = () => hm(new Date());

// 이어서 할 화면 (startVisit과 같은 갈래. 지난 날 방문은 startVisit이 오늘 새 방문을 만들어 버려서 바로 연다)
export function visitHref(visitId: string, status: VisitStatus) {
  const next = { DRAFT_READY: "review?resume=1", RECORDED: "processing", SUMMARIZING: "processing" }[status as string] ?? "record";
  return `/v1120/visit/${visitId}/${next}`;
}

// 오늘 방문 목록. 서버(Vercel)는 UTC라서 한국 시간 기준 요일로 센다. 오늘 요일이 아니어도 오늘 기록을 시작했으면 보여 준다. 시작 시각 순
export async function todayVisitList() {
  const clients = await myClients();
  const [visits, unread] = await Promise.all([myTodayVisits(), myUnreadByClient()]);
  const today = kstWeekday();
  const list: HomeVisit[] = clients
    .filter((c) => c.isActive && (c.scheduleDays.includes(today) || visits.has(c.id)))
    .map((c) => {
      const v = visits.get(c.id);
      return {
        visitId: v?.id ?? "",
        clientId: c.id,
        clientName: c.name,
        scheduleLabel: c.scheduleLabel,
        status: v?.status ?? "NOT_STARTED",
        interrupted: v?.status === "RECORDING" && !!v.transcript, // 녹음이 중간에 멈춤 (D-27)
        unread: unread.get(c.id) ?? 0,
        time: timeOf(c.scheduleLabel),
        start: startOf(c.scheduleLabel),
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  return { clients, list };
}

export type Noti = {
  key: string;
  kind: "interrupted" | "ready" | "unsent" | "comment" | "schedule";
  href: string;
  name: string;
  title: string;
  desc: string;
  at: Date | null; // 일정 알림은 시각이 없다
  today: boolean;
  unread: boolean;
};

// "모두 읽음"을 마지막으로 누른 시각 (없으면 0 → 전부 새 알림)
async function seenAt() {
  const v = Number((await cookies()).get(SEEN_COOKIE)?.value);
  return Number.isFinite(v) ? v : 0;
}

// 최근 7일 알림 (최근 것부터). 오늘 것: 멈춘 녹음 · 정리 끝남 · 오늘 방문 일정, 지난 것: 아직 안 보낸 기록. 댓글은 7일 모두
export async function notifications(list: HomeVisit[]) {
  const [visits, comments, seen] = await Promise.all([myRecentUnsentVisits(), myRecentGuardianComments(), seenAt()]);
  const todayStart = kstTodayRange().start.getTime();
  const out: Noti[] = [];
  for (const v of visits) {
    const isToday = v.day.getTime() >= todayStart;
    const base = { key: `v-${v.visitId}`, href: visitHref(v.visitId, v.status), name: v.clientName, at: v.at };
    if (!isToday) {
      out.push({ ...base, kind: "unsent", title: "기록을 아직 안 보냈어요", desc: `${serviceTimeOf(null, v.day).date} 기록이에요. 7일이 지나면 홈에서 안 보여요.`, today: false, unread: false });
    } else if (v.status === "RECORDING" && v.hasTranscript) {
      out.push({ ...base, kind: "interrupted", title: "기록이 중간에 멈췄어요", desc: "녹음한 데까지 저장돼 있어요. 이어서 기록해 주세요.", today: true, unread: false });
    } else if (v.status === "DRAFT_READY") {
      out.push({ ...base, kind: "ready", title: "기록 정리가 끝났어요", desc: "확인하고 보호자에게 보내 주세요.", today: true, unread: false });
    }
  }
  for (const c of comments) {
    out.push({ key: `c-${c.id}`, kind: "comment", href: `/v1120/chats/${c.clientId}`, name: c.clientName, title: "댓글을 남겼어요", desc: `“${c.text}”`, at: c.at, today: c.at.getTime() >= todayStart, unread: false });
  }
  for (const n of out) n.unread = !!n.at && n.at.getTime() > seen;
  out.sort((a, b) => b.at!.getTime() - a.at!.getTime());
  if (list.length > 0) {
    const first = list[0];
    out.push({
      key: "schedule",
      kind: "schedule",
      href: "/v1120",
      name: "",
      title: `오늘 방문 ${list.length}건이 있어요`,
      desc: `첫 방문은 ${first.time ? `${first.start} ` : ""}${first.clientName} 수급자예요.`,
      at: null,
      today: true,
      unread: false,
    });
  }
  return { items: out, unsent: visits };
}

// 알림 시각: 오늘이면 "13:42", 지난 날이면 "11월 2일"
export function notiTime(n: Noti) {
  if (!n.at) return "";
  if (n.today) return hm(n.at);
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" }).format(n.at);
}
