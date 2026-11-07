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

// 하단 메뉴 "게시판" 아이콘과 같은 빨간 숫자 뱃지 (사용자 11/7: 알약 말고 아이콘에 붙는 뱃지)
export function CountBadge({ n, className = "" }: { n: number; className?: string }) {
  if (n === 0) return null;
  return (
    <span className={`pop flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-(--danger) px-1.5 text-[14px] font-bold leading-none text-white ${className}`}>
      {n}
      <span className="sr-only">개 새 댓글</span>
    </span>
  );
}

// 수급자 탭 버튼 글자: "게시판" 옆에 빨간 숫자 뱃지
export function ChatLabel({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1.5">
      게시판
      <CountBadge n={n} />
    </span>
  );
}
