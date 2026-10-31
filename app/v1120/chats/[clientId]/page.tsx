import { notFound } from "next/navigation";
import { myBoard, myClient, requireCaregiver } from "../../_data";
import { LiveRefresh, PostCard } from "../../_components/Board";
import { Screen, TopBar } from "../../_components/ui";
import { contactTitle, NO_CONTACT } from "../../_types";

// C-18 수급자 게시판 (요양보호사, Figma "와이어 · C-18 수급자 게시판"). 보낸 보고서가 글 카드로 올라오고, 글을 누르면 댓글 (D-15 261101.ver)
export default async function BoardPage({ params }: PageProps<"/v1120/chats/[clientId]">) {
  const { clientId } = await params;
  const [c, caregiver] = await Promise.all([myClient(clientId), requireCaregiver()]);
  if (!c || c.guardianRelation === NO_CONTACT) notFound();
  const posts = await myBoard(clientId);
  const names = { caregiver: caregiver.name, guardian: `${c.guardianName} ${contactTitle(c.guardianRelation)}` };
  return (
    <Screen>
      <LiveRefresh />
      <TopBar backHref="/v1120/chats" title={`${c.name} 게시판`} />
      <p className="rounded-xl bg-(--neutral-soft) px-4 py-3 text-base">
        {c.guardianName} {contactTitle(c.guardianRelation)}({c.guardianRelation})와 함께 보는 게시판이에요. 보고서를 보내면 글이 자동으로 올라와요.
      </p>
      {posts.length === 0 ? (
        <p className="py-10 text-center text-lg text-muted">방문 보고서를 보내면 여기에 올라와요.</p>
      ) : (
        <>
          <div className="-mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">보고서 {posts.length}개</h2>
            <span className="text-base text-muted">최신 글이 위</span>
          </div>
          <ol className="flex flex-col gap-4">
            {posts.map((p) => (
              <li key={p.shareToken}>
                <PostCard post={p} names={names} me="caregiver" href={`/v1120/chats/${clientId}/${p.shareToken}`} />
              </li>
            ))}
          </ol>
        </>
      )}
    </Screen>
  );
}
