import type { CSSProperties } from "react";
import { myBoardSummary, myClients, myUnreadByClient } from "../_data";
import { UnreadBadge } from "../_components/Unread";
import { PressLink } from "../_components/Pressable";
import { EmptyState, Icon, Screen } from "../_components/ui";
import { contactTitle, NO_CONTACT } from "../_types";

// 게시판 탭 (Figma wireframe-1128 517:635): 흰 상단 바 "게시판" 아래 회색 바탕에 수급자별 흰 카드. 보낸 보고서가 글로 올라오고 댓글로 이야기한다 (DIF-5, D-15)
export default async function ChatsPage() {
  const [all, latest, unread] = await Promise.all([myClients(), myBoardSummary(), myUnreadByClient()]);
  // 보호자가 없는 수급자는 게시판이 없다 (D-49)
  const rooms = all.filter((c) => c.isActive && c.guardianRelation !== NO_CONTACT);
  return (
    <Screen nav>
      <div className="full-bleed -mt-5 flex h-16 items-center justify-center bg-white px-16">
        <h1 className="text-center text-[22px] font-bold leading-[1.4] tracking-[-0.02em]">게시판</h1>
      </div>
      {rooms.length === 0 ? (
        <EmptyState>수급자를 등록하면 게시판이 생겨요.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((c, i) => {
            const post = latest.get(c.id);
            return (
              <li key={c.id} className="enter" style={{ "--i": Math.min(i, 6) } as CSSProperties}>
                <PressLink
                  href={`/v1120/chats/${c.id}`}
                  pendingText={false}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-5 active:bg-(--bg-brand)"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary) text-xl font-bold">
                      {c.name.slice(0, 1)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
                      <span className="text-xl font-bold">{c.name} 수급자</span>
                      <span className="text-base text-muted">
                        {c.guardianName}{" "}
                        <span className="whitespace-nowrap">
                          {contactTitle(c.guardianRelation) === "보호자" ? `보호자(${c.guardianRelation})` : c.guardianRelation}
                        </span>
                      </span>
                    </span>
                    <UnreadBadge n={unread.get(c.id) ?? 0} />
                    <Icon name="chevron_right" size={28} className="text-muted" />
                  </span>
                  <span className={`rounded-xl bg-(--bg-secondary) px-4 py-2.5 text-base font-medium leading-[1.4] ${post ? "" : "text-muted"}`}>
                    {post ? (
                      <>
                        {post.title} · <span className="whitespace-nowrap">댓글 {post.comments}</span>
                      </>
                    ) : (
                      "아직 보낸 보고서가 없어요"
                    )}
                  </span>
                </PressLink>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
