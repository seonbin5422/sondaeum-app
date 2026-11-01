import Link from "next/link";
import { myBoardSummary, myClients, myUnreadByClient } from "../_data";
import { UnreadBadge } from "../_components/Unread";
import { Avatar, Screen } from "../_components/ui";
import { contactTitle, NO_CONTACT } from "../_types";

// 게시판 탭: 수급자별 게시판 목록 (DIF-5, D-15 261101.ver). 보낸 보고서가 글로 올라오고 댓글로 이야기한다
export default async function ChatsPage() {
  const [all, latest, unread] = await Promise.all([myClients(), myBoardSummary(), myUnreadByClient()]);
  // 보호자가 없는 수급자는 게시판이 없다 (D-49)
  const rooms = all.filter((c) => c.isActive && c.guardianRelation !== NO_CONTACT);
  return (
    <Screen nav>
      <h1 className="text-2xl font-bold">게시판</h1>
      <p className="-mt-4 text-lg text-muted">보낸 방문 보고서가 수급자별로 올라와요. 보호자와 댓글로 이야기해요.</p>
      {rooms.length === 0 ? (
        <p className="py-10 text-center text-lg text-muted">수급자를 등록하면 게시판이 생겨요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
          {rooms.map((c) => {
            const post = latest.get(c.id);
            return (
              <li key={c.id}>
                <Link href={`/v1120/chats/${c.id}`} className="flex min-h-20 items-center gap-3 px-4 py-3">
                  <Avatar name={c.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-lg font-bold">{c.name}</span>
                    <span className="text-base text-muted">
                      {c.guardianName} {contactTitle(c.guardianRelation) === "보호자" ? `보호자(${c.guardianRelation})` : c.guardianRelation}
                    </span>
                    <span className={`text-base ${post ? "font-bold" : "text-muted"}`}>{post ? `${post.title} · 댓글 ${post.comments}` : "아직 보낸 보고서가 없어요"}</span>
                  </span>
                  <UnreadBadge n={unread.get(c.id) ?? 0} />
                  <span aria-hidden className="text-xl font-bold text-muted">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
