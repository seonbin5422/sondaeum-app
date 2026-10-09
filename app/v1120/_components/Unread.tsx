"use client";

import Link from "next/link";
import { useUnread } from "../_unread";

// 안 읽은 메시지 수를 보여 주는 작은 조각들. 서버 화면 안에 넣어 쓰고, 대화방을 열면 사라진다.

// 홈 카드 (C-03)
export function UnreadMessageLink({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  if (n === 0) return null;
  return (
    <Link
      href={`/v1120/chats/${clientId}`}
      className="flex min-h-12 items-center justify-between rounded-xl border border-(--line) px-4 text-base font-bold"
    >
      <span>✉ 보호자님 새 메시지 {n}개</span>
      <span className="text-muted">대화 보기 ›</span>
    </Link>
  );
}

// 수급자 탭 버튼 글자 ("대화 2" → "대화")
export function ChatLabel({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  return <>{n > 0 ? `대화 ${n}` : "대화"}</>;
}

// 대화 탭 목록의 빨간 숫자
export function UnreadBadge({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  if (n === 0) return null;
  return <span className="rounded-full bg-(--danger) px-2 text-base font-bold text-white">{n}</span>;
}
