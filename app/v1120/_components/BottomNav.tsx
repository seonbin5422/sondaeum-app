"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTotalUnread } from "../_unread";

// 하단 메뉴바 (1120.ver 제안안, 와이어 없음). 아이콘만 두지 않고 항상 글자를 붙인다.
const TABS = [
  { href: "/v1120", label: "홈", icon: "⌂", match: (p: string) => p === "/v1120" },
  { href: "/v1120/clients", label: "수급자", icon: "☺", match: (p: string) => p.startsWith("/v1120/client") },
  { href: "/v1120/chats", label: "대화", icon: "✉", match: (p: string) => p.startsWith("/v1120/chats") },
  { href: "/v1120/me", label: "내 정보", icon: "☰", match: (p: string) => p.startsWith("/v1120/me") },
];

// 보호자 메뉴바 (D-44). 보호자는 로그인 없이 수급자별 링크로 들어온다
function guardianTabs(token: string) {
  const home = `/v1120/c/${token}`;
  return [
    { href: home, label: "홈", icon: "⌂", match: (p: string) => p === home || p.startsWith(`${home}/documents`) || p.startsWith(`${home}/reports`) },
    { href: `${home}/chat`, label: "대화", icon: "✉", match: (p: string) => p.startsWith(`${home}/chat`) },
    { href: `${home}/me`, label: "내 정보", icon: "☰", match: (p: string) => p.startsWith(`${home}/me`) },
  ];
}

export function BottomNav({ guardianToken }: { guardianToken?: string }) {
  const pathname = usePathname();
  const unread = useTotalUnread();
  const tabs = guardianToken ? guardianTabs(guardianToken) : TABS;
  return (
    <nav aria-label="메뉴" className="border-t border-(--line) bg-white">
      <ul className={`mx-auto grid max-w-md ${guardianToken ? "grid-cols-3" : "grid-cols-4"}`}>
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-base font-bold ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                <span aria-hidden className={`text-2xl leading-none ${active ? "text-accent-dark" : ""}`}>
                  {t.icon}
                </span>
                {t.label}
                {!guardianToken && t.label === "대화" && unread > 0 && (
                  <span className="absolute right-[22%] top-1.5 rounded-full bg-(--danger) px-1.5 text-base font-bold leading-6 text-white">
                    {unread}
                  </span>
                )}
                {active && <span className="absolute inset-x-6 top-0 h-1 rounded-b bg-accent" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
