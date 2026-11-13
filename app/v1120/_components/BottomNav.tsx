"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { myUnreadTotal } from "../_actions";
import { buzz } from "./Pressable";

// 공통/하단 메뉴 (Figma 508:245): 아이콘 36px, 선택=진한 아이콘+굵은 글자, 나머지=연한 아이콘. 아이콘만 두지 않고 항상 글자를 붙인다.
const TABS = [
  { href: "/v1120", label: "홈", icon: "home", match: (p: string) => p === "/v1120" },
  { href: "/v1120/clients", label: "수급자", icon: "clients", match: (p: string) => p.startsWith("/v1120/client") },
  { href: "/v1120/chats", label: "게시판", icon: "board", match: (p: string) => p.startsWith("/v1120/chats") },
  { href: "/v1120/me", label: "내 정보", icon: "me", match: (p: string) => p.startsWith("/v1120/me") },
];

// 보호자 메뉴바 (D-44). 보호자는 로그인 없이 수급자별 링크로 들어온다
function guardianTabs(token: string) {
  const home = `/v1120/c/${token}`;
  return [
    { href: home, label: "홈", icon: "home", match: (p: string) => p === home || p.startsWith(`${home}/documents`) || p.startsWith(`${home}/reports`) },
    { href: `${home}/chat`, label: "게시판", icon: "board", match: (p: string) => p.startsWith(`${home}/chat`) },
    { href: `${home}/me`, label: "내 정보", icon: "me", match: (p: string) => p.startsWith(`${home}/me`) },
  ];
}

export function BottomNav({ guardianToken }: { guardianToken?: string }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  // 요양보호사 메뉴만: 화면이 바뀔 때와 15초마다(같은 화면에서 새 댓글이 달려도 뱃지가 뜨게) 안 읽은 보호자 댓글 수를 묻는다
  useEffect(() => {
    if (guardianToken) return;
    const ask = () => document.visibilityState === "visible" && myUnreadTotal().then(setUnread, () => {});
    ask();
    const t = setInterval(ask, 15_000);
    return () => clearInterval(t);
  }, [pathname, guardianToken]);
  const tabs = guardianToken ? guardianTabs(guardianToken) : TABS;
  return (
    <nav data-coach="nav" aria-label="메뉴" className="bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className={`mx-auto grid h-[76px] max-w-md py-1.5 ${guardianToken ? "grid-cols-3" : "grid-cols-4"}`}>
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                onPointerDown={buzz}
                className={`press flex h-full flex-col items-center justify-center gap-0.5 rounded-xl text-base leading-[1.4] active:bg-(--bg-secondary) ${
                  active ? "font-bold text-foreground" : "text-muted"
                }`}
              >
                <span className="relative size-9">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/v1120/icons/tab-${t.icon}-${active ? "on" : "off"}.svg`} alt="" width={36} height={36} className="size-9" />
                  {!guardianToken && t.label === "게시판" && unread > 0 && (
                    <span className="pop absolute left-6 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-(--danger) px-1.5 text-[14px] font-bold leading-none text-white">
                      {unread}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
