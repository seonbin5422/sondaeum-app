"use client";

import Link from "next/link";
import { useUnread } from "../_unread";

// 안 읽은 댓글 수를 보여 주는 작은 조각들. 서버 화면 안에 넣어 쓰고, 게시판을 열면 사라진다.

// 홈 카드 (C-03)
export function UnreadMessageLink({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  if (n === 0) return null;
  return (
    <Link
      href={`/v1120/chats/${clientId}`}
      className="flex min-h-12 items-center justify-between rounded-xl border border-(--line) px-4 text-base font-bold"
    >
      <span>✉ 보호자님 새 댓글 {n}개</span>
      <span className="text-muted">게시판 보기 ›</span>
    </Link>
  );
}

// 수급자 탭 버튼 글자 ("게시판 2" → "게시판")
export function ChatLabel({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  return <>{n > 0 ? `게시판 ${n}` : "게시판"}</>;
}

// 게시판 탭 목록의 빨간 숫자
export function UnreadBadge({ clientId }: { clientId: string }) {
  const n = useUnread(clientId);
  if (n === 0) return null;
  return <span className="shrink-0 rounded-full bg-accent px-2.5 text-base font-bold">새 댓글 {n}</span>;
}
