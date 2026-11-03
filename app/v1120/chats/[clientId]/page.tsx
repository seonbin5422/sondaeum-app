import { notFound } from "next/navigation";
import { myBoard, myClient, requireCaregiver } from "../../_data";
import { LiveRefresh, PostList } from "../../_components/Board";
import { EmptyState, Screen, TopBar } from "../../_components/ui";
import { contactTitle, NO_CONTACT } from "../../_types";

// C-18 수급자 게시판 (요양보호사, Figma wireframe-1128 517:702). 보낸 보고서가 글 카드로 올라오고, 글을 누르면 댓글 (D-15 261101.ver)
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
      {posts.length === 0 ? (
        <EmptyState>방문 보고서를 보내면 여기에 올라와요.</EmptyState>
      ) : (
        <PostList posts={posts} names={names} me="caregiver" hrefBase={`/v1120/chats/${clientId}`} />
      )}
    </Screen>
  );
}
