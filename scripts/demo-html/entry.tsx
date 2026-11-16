// 손다음 시연 HTML: 1120 버전의 기록 흐름 화면(C-12~C-16, G-01)을 그대로 쓰고, 서버 대신 shims/actions.ts가 기록을 들고 있다
import { createRoot } from "react-dom/client";
import { useSyncExternalStore } from "react";
import { currentPath, go } from "./shims/next-navigation";
import { DEMO, getVisit, resetVisit } from "./shims/actions";
import { RecordScreen } from "@/app/v1120/visit/[id]/record/RecordScreen";
import ProcessingPage from "@/app/v1120/visit/[id]/processing/page";
import { ReviewScreen } from "@/app/v1120/visit/[id]/review/ReviewScreen";
import { ConfirmScreen } from "@/app/v1120/visit/[id]/confirm/ConfirmScreen";
import { SentScreen } from "@/app/v1120/visit/[id]/sent/SentScreen";
import { GuardianReport } from "@/app/v1120/g/[token]/GuardianReport";
import { fixRecordText } from "@/app/v1120/_ai";
import { WEEKDAY_LABELS } from "@/lib/schedule";
import { whisper } from "./shims/whisper";

const ID = "demo";
const base = `/v1120/visit/${ID}`;

// 계약 시간: 오늘 10:00~13:00 (_data.ts serviceTimeOf와 같은 모양)
function serviceTime(actual?: { serviceStart?: string | null; serviceEnd?: string | null } | null) {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
  const start = actual?.serviceStart || "10:00";
  const end = actual?.serviceEnd || "13:00";
  const s = new Date(`${ymd}T${start}:00+09:00`);
  const e = new Date(`${ymd}T${end}:00+09:00`);
  const md = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" }).formatToParts(now);
  const part = (t: string) => md.find((p) => p.type === t)?.value;
  const wd = WEEKDAY_LABELS[new Date(`${ymd}T12:00:00+09:00`).getUTCDay()];
  return { date: `${part("month")}월 ${part("day")}일 (${wd})`, start, end, minutes: Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000)), startedAt: s.toISOString(), endedAt: e.toISOString() };
}

function Page({ path }: { path: string }) {
  const [p, q = ""] = path.split("?");
  const v = getVisit();
  const record = v.record && fixRecordText(v.record);
  const resumed = new URLSearchParams(q).get("resume") === "1";
  const time = serviceTime(record);

  if (p === "/v1120" || p === "/v1120/") {
    // 처음으로: 새 기록으로 다시 시작
    resetVisit();
    go(`${base}/record`, true);
    return null;
  }
  if (p.startsWith("/v1120/g/")) {
    if (!record || !v.sentAt) return <GuardianReport token="sample" order="base" sent={null} />;
    return (
      <GuardianReport
        token={ID}
        order="base"
        sent={{ guardianName: DEMO.guardian, guardianTitle: "보호자", clientName: DEMO.client, caregiverName: DEMO.caregiver, startedAt: time.startedAt, endedAt: time.endedAt, record, recipientSigned: v.signatures.recipient.length > 0 }}
        asCaregiver // 보낸 화면에서 연 요양보호사 기기: 배포 앱처럼 서명칸은 보기만 (대리 서명 막기, 사용자 11/14)
      />
    );
  }
  if (p === `${base}/processing`) return <ProcessingPage />;
  if (v.status === "SENT" && p !== `${base}/sent`) return go(`${base}/sent`, true), null;
  if ((p === `${base}/review` || p === `${base}/confirm`) && !record) return go(`${base}/processing`, true), null;
  if (p === `${base}/review`)
    return <ReviewScreen id={ID} initialRecord={record!} said={v.quotes} transcript={v.transcript} visitTime={serviceTime()} clientName={DEMO.client} caregiverName={DEMO.caregiver} resumed={resumed} />;
  if (p === `${base}/confirm`)
    return <ConfirmScreen id={ID} record={record!} reviewHref={`${base}/review${resumed ? "?resume=1" : ""}`} recipient="보호자님" date={time.date} clientName={DEMO.client} caregiverName={DEMO.caregiver} signatures={v.signatures} />;
  if (p === `${base}/sent`) {
    if (v.status !== "SENT") return go(`${base}/confirm`, true), null;
    return <SentScreen visitId={ID} shareToken={ID} clientName={DEMO.client} guardianName={DEMO.guardian} guardianTitle="보호자" noContact={false} date={time.date} caregiverName={DEMO.caregiver} />;
  }
  // 그 밖의 주소(시연에 없는 화면)는 기록 화면으로
  if (p !== `${base}/record`) return go(`${base}/record`, true), null;
  return <RecordScreen showSample visitId={ID} clientName={DEMO.client} initialTranscript={v.transcript} saved={record} />;
}

const sub = (cb: () => void) => (addEventListener("hashchange", cb), () => removeEventListener("hashchange", cb));
function App() {
  const path = useSyncExternalStore(sub, currentPath);
  return (
    <div className="v1120 flex min-h-full flex-1 flex-col bg-(--bg-secondary)">
      <Page key={path} path={path} />
    </div>
  );
}

// next/link가 아닌 그냥 <a href="/v1120/...">도 해시로 옮긴다 (file://에서는 /v1120이 디스크 맨 위 폴더가 된다)
document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest?.("a");
  const href = a?.getAttribute("href");
  if (!href?.startsWith("/") || e.defaultPrevented) return;
  e.preventDefault();
  go(href);
});

// "음성 파일 올리기"가 부르는 서버 /transcribe를 Groq Whisper 직접 호출로 바꾼다 (응답 모양 { text } | { error }는 서버와 같다)
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  if (typeof input === "string" && /\/api\/visits\/[^/]+\/transcribe$/.test(input)) {
    const file = (init?.body as FormData).get("audio") as File;
    try {
      const text = await whisper(file, file.name);
      return Response.json(text ? { text } : { error: "음성에서 내용을 찾지 못했어요. 다시 녹음하거나 직접 입력해주세요." }, { status: text ? 200 : 500 });
    } catch {
      return Response.json({ error: "음성 파일을 처리하지 못했어요. 파일 형식을 확인하거나 다시 시도해주세요." }, { status: 500 });
    }
  }
  return realFetch(input, init);
};

// 파일을 눌러 열 때마다 처음 들어온 것처럼: 기록·코치마크 본 기록·보낸 시각을 지우고 녹음 화면부터 (사용자 11/17).
// 새로고침·뒤로 가기로 다시 열린 것은 그대로 둔다(시연 중 실수로 새로고침해도 이어서 하게)
const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
if (nav?.type !== "reload" && nav?.type !== "back_forward") {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  history.replaceState(null, "", location.pathname);
}

createRoot(document.getElementById("root")!).render(<App />);
