import Link from "next/link";
import { notFound } from "next/navigation";
import { findClient, historyOf } from "../../../_mock";
import { LinkButton, Screen, StatusBadge, TopBar } from "../../../_components/ui";

// C-22 수급자 방문 기록 (DIF-9, 와이어 없음). 날짜별 방문과 보고서, 서류 만들기로 이어지는 입구.
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export default async function HistoryPage({ params }: PageProps<"/v1120/client/[id]/history">) {
  const { id } = await params;
  const c = findClient(id);
  if (!c) notFound();
  const visits = historyOf(id);

  const byMonth = new Map<string, typeof visits>();
  for (const v of visits) {
    const k = `${Number(v.date.slice(5, 7))}월`;
    byMonth.set(k, [...(byMonth.get(k) ?? []), v]);
  }

  return (
    <Screen nav>
      <TopBar backHref={`/v1120/client/${id}`} title={`${c.name} 수급자 방문 기록`} />

      <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
        <p className="text-base">병원에 가시거나 기관에 낼 때는 기간을 골라 서류로 만들어요.</p>
        <LinkButton href={`/v1120/client/${id}/documents`} className="!h-12 !w-auto shrink-0 px-4 text-base">
          서류 만들기
        </LinkButton>
      </div>

      {visits.length === 0 && <p className="text-lg text-muted">아직 방문 기록이 없어요.</p>}

      {[...byMonth].map(([month, list]) => (
        <section key={month} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">
            {month} · 방문 {list.length}번
          </h2>
          <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
            {list.map((v) => {
              const d = new Date(`${v.date}T12:00:00+09:00`);
              const worse = Object.entries(v.record.change).filter(([, x]) => x === "worse").length > 0;
              return (
                <li key={v.visitId}>
                  <Link href={v.status === "SENT" ? `/v1120/g/${v.visitId}` : `/v1120/visit/v-hong/record`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-2">
                    <span className="flex flex-col">
                      <span className="text-lg font-bold">
                        {d.getMonth() + 1}월 {d.getDate()}일 ({WEEK[d.getDay()]})
                      </span>
                      <span className="text-base text-muted">
                        {v.start}–{v.end}
                        {worse && <span className="ml-2 font-bold text-(--danger)">▼ 나빠진 점 있음</span>}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={v.status} />
                      <span className="text-xl text-muted" aria-hidden>
                        ›
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
