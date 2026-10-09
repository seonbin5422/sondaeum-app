"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { unreadByClient } from "../_mock";

// 하단 메뉴바 (1120.ver 제안안, 와이어 없음). 아이콘만 두지 않고 항상 글자를 붙인다.
const TABS = [
  { href: "/v1120", label: "홈", icon: "⌂", match: (p: string) => p === "/v1120" },
  { href: "/v1120/clients", label: "수급자", icon: "☺", match: (p: string) => p.startsWith("/v1120/client") },
  { href: "/v1120/chats", label: "대화", icon: "✉", match: (p: string) => p.startsWith("/v1120/chats") },
  { href: "/v1120/me", label: "내 정보", icon: "☰", match: (p: string) => p.startsWith("/v1120/me") },
];

export function BottomNav() {
  const pathname = usePathname();
  const unread = Object.values(unreadByClient).reduce((a, b) => a + b, 0);
  return (
    <nav aria-label="메뉴" className="border-t border-(--line) bg-white">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
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
                {t.label === "대화" && unread > 0 && (
                  <span className="absolute right-[22%] top-1.5 rounded-full bg-(--danger) px-1.5 text-sm font-bold leading-5 text-white">
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
