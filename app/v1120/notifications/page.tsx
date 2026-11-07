import type { CSSProperties } from "react";
import { PressLink } from "../_components/Pressable";
import { EmptyState, Icon, Screen } from "../_components/ui";
import { notifications, notiTime, todayVisitList, type Noti } from "./_today";
import { SeenButton } from "./SeenButton";

// 알림 (Figma 558:1214). 알림은 따로 저장하지 않고 최근 7일 방문·댓글에서 바로 만든다.
// 누르면: 멈춘 녹음 → 녹음(C-12), 정리 끝남·안 보낸 기록 → 그 기록, 댓글 → 게시판, 오늘 방문 → 홈
export default async function NotificationsPage() {
  const { list } = await todayVisitList();
  const { items } = await notifications(list);
  const today = items.filter((n) => n.today);
  const past = items.filter((n) => !n.today);
  const unread = items.filter((n) => n.unread).length;
  return (
    <Screen>
      {/* 머리 (Figma 558:1216): 뒤로 · 왼쪽 제목 24 · 오른쪽 "모두 읽음", 바탕은 화면과 같은 회색 */}
      <div className="sticky top-0 z-10 full-bleed -mt-5 bg-(--screen-bg)">
        <div className="mx-auto flex max-w-md items-center gap-2 py-4 pl-3 pr-5">
          <PressLink href="/v1120" pendingText={false} className="flex size-12 shrink-0 items-center justify-center rounded-full active:bg-(--line)">
            <Icon name="arrow_back" size={28} />
            <span className="sr-only">뒤로</span>
          </PressLink>
          <h1 className="flex-1 text-2xl font-bold leading-[1.4]">알림</h1>
          {unread > 0 && <SeenButton />}
        </div>
      </div>
      {items.length === 0 && <EmptyState>새 알림이 없어요.</EmptyState>}
      {/* 본문 (Figma 558:1221): 머리 아래 20, 구역 제목과 흰 카드 사이 12 */}
      <div className="mt-1 flex flex-col gap-3 pb-3">
        <Section title="오늘" items={today} i={1} />
        <Section title="지난 7일" items={past} i={2} />
      </div>
    </Screen>
  );
}

// 구역 하나 = 제목 18 + 둥근 흰 카드(16), 항목 사이 1px 선 (Figma 558:1223)
function Section({ title, items, i }: { title: string; items: Noti[]; i: number }) {
  if (items.length === 0) return null;
  return (
    <>
      <h2 className="enter text-lg font-bold leading-[1.4]" style={{ "--i": i } as CSSProperties}>{title}</h2>
      <ul className="enter flex flex-col gap-px overflow-hidden rounded-2xl bg-(--line)" style={{ "--i": i } as CSSProperties}>
        {items.map((n) => (
          <Item key={n.key} n={n} />
        ))}
      </ul>
    </>
  );
}

const look: Record<Noti["kind"], { icon: string; tone: string }> = {
  interrupted: { icon: "noti-mic", tone: "bg-(--bg-brand)" },
  ready: { icon: "noti-check", tone: "bg-(--bg-brand)" },
  unsent: { icon: "noti-check", tone: "bg-(--bg-brand)" },
  comment: { icon: "noti-comment", tone: "bg-(--success-soft)" },
  schedule: { icon: "home-calendar", tone: "bg-[#d2ede9]" }, // Figma schedule-soft
};

// 알림/항목 (Figma 484:329): 동그란 아이콘 44 · 제목 18 · 설명 16 · 시각 16 · 새 알림 점
function Item({ n }: { n: Noti }) {
  const who = n.kind === "comment" ? `${n.name} 보호자님이` : n.name ? `${n.name} 수급자` : "";
  return (
    <li className="bg-white">
      <PressLink href={n.href} pendingText={false} className="flex items-start gap-3 p-4 active:bg-(--bg-secondary)">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${look[n.kind].tone}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/v1120/home/${look[n.kind].icon}.svg`} alt="" width={24} height={24} className="size-6" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
          <span className="text-lg font-bold">
            {who && <span className="whitespace-nowrap">{who}</span>} {n.title}
          </span>
          <span className="line-clamp-2 text-base text-muted">{n.desc}</span>
          {n.at && <span className="text-base text-muted">{notiTime(n)}</span>}
        </span>
        {n.unread && (
          <span className="mt-2 size-2.5 shrink-0 rounded-full bg-accent">
            <span className="sr-only">새 알림</span>
          </span>
        )}
      </PressLink>
    </li>
  );
}
