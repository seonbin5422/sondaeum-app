import { Icon } from "./Icon";
import { PressLink } from "./Pressable";

// 안 읽은 보호자 댓글 수를 보여 주는 작은 조각들 (DIF-5). 수는 서버에서 센다(myUnreadByClient), 게시글을 열면 읽음이 된다.

// 홈 카드 (C-03)
export function UnreadMessageLink({ clientId, n }: { clientId: string; n: number }) {
  if (n === 0) return null;
  return (
    <PressLink
      href={`/v1120/chats/${clientId}`}
      pendingText={false}
      className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-(--danger-soft) px-4 text-base font-bold text-(--text-danger) active:bg-[#ffd4d4]"
    >
      <span className="flex items-center gap-1.5">
        <Icon name="chat_bubble" size={20} />
        <span className="whitespace-nowrap">보호자님 새 댓글 {n}개</span>
      </span>
      <span className="whitespace-nowrap">게시판 보기 ›</span>
    </PressLink>
  );
}

// 수급자 탭 버튼 글자 ("게시판 2" → "게시판")
export function ChatLabel({ n }: { n: number }) {
  return <>{n > 0 ? `게시판 ${n}` : "게시판"}</>;
}

// 게시판 탭 목록의 "새 댓글" 알약 (Figma 517:649 연한 빨강)
export function UnreadBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="pop shrink-0 whitespace-nowrap rounded-full bg-(--danger-soft) px-3 py-0.5 text-base font-bold text-(--text-danger)">새 댓글 {n}</span>;
}
