import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { myClient, myHistory } from "../../../_data";
import { PressLink } from "../../../_components/Pressable";
import { Card, Icon, LinkButton, Screen, StatusBadge, TopBar } from "../../../_components/ui";

// C-22 수급자 방문 기록 (DIF-9, 와이어 없음). 날짜별 방문과 보고서, 서류 만들기로 이어지는 입구.
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export default async function HistoryPage({ params }: PageProps<"/v1120/client/[id]/history">) {
  const { id } = await params;
  const c = await myClient(id);
  if (!c) notFound();
  const visits = await myHistory(id);

  const byMonth = new Map<string, typeof visits>();
  for (const v of visits) {
    const k = `${Number(v.date.slice(5, 7))}월`;
    byMonth.set(k, [...(byMonth.get(k) ?? []), v]);
  }

  return (
    <Screen nav>
      <TopBar backHref={`/v1120/client/${id}`} title={`${c.name} 수급자 방문 기록`} />

      <Card className="gap-3">
        <p className="text-lg">
          병원에 가시거나 기관에 낼 때는 <span className="whitespace-nowrap">기간을 골라</span> 서류로 만들어요.
        </p>
        <LinkButton href={`/v1120/client/${id}/documents`} variant="secondary">
          서류 만들기
        </LinkButton>
      </Card>

      {visits.length === 0 && <p className="text-lg text-muted">아직 방문 기록이 없어요.</p>}

      {[...byMonth].map(([month, list], i) => (
        <section key={month} className="enter flex flex-col gap-3" style={{ "--i": Math.min(i + 1, 6) } as CSSProperties}>
          <h2 className="text-lg font-bold text-muted">
            {month} · 방문 {list.length}번
          </h2>
          <ul className="flex flex-col rounded-2xl bg-white p-1">
            {list.map((v) => {
              const d = new Date(`${v.date}T12:00:00+09:00`);
              const worse = Object.values(v.record.change).some((x) => x === "worse");
              return (
                <li key={v.visitId}>
                  <PressLink
                    href={v.shareToken ? `/v1120/g/${v.shareToken}` : `/v1120/visit/${v.visitId}/record`}
                    pendingText={false}
                    className="flex min-h-16 items-center gap-3 rounded-xl py-3.5 pl-4 pr-3 active:bg-(--bg-secondary)"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="whitespace-nowrap text-lg font-bold">
                          {d.getMonth() + 1}월 {d.getDate()}일 ({WEEK[d.getDay()]})
                        </span>
                        <StatusBadge status={v.status} />
                      </span>
                      <span className={`text-base ${worse ? "text-(--text-danger)" : "text-muted"}`}>
                        <span className="whitespace-nowrap">
                          {v.start}–{v.end}
                        </span>
                        {worse && <span className="whitespace-nowrap"> · ▼ 나빠진 점 있음</span>}
                      </span>
                    </span>
                    <Icon name="chevron_right" size={28} />
                  </PressLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Screen>
  );
}
