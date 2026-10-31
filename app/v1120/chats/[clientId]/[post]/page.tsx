import { notFound } from "next/navigation";
import { myBoard, myClient, requireCaregiver } from "../../../_data";
import { commentAsCaregiver } from "../../../_actions";
import { CommentThread, PostSummary } from "../../../_components/Board";
import { Screen, TopBar } from "../../../_components/ui";
import { contactTitle, NO_CONTACT } from "../../../_types";

// C-18 게시글 상세 (요양보호사, Figma "와이어 · C-18 게시글 상세"): 보고서 요약 + 댓글, 입력칸은 아래 고정
export default async function PostPage({ params }: PageProps<"/v1120/chats/[clientId]/[post]">) {
  const { clientId, post: token } = await params;
  const [c, caregiver] = await Promise.all([myClient(clientId), requireCaregiver()]);
  if (!c || c.guardianRelation === NO_CONTACT) notFound();
  const post = (await myBoard(clientId)).find((p) => p.shareToken === token);
  if (!post) notFound();
  const names = { caregiver: caregiver.name, guardian: `${c.guardianName} ${contactTitle(c.guardianRelation)}` };
  return (
    <Screen>
      <TopBar backHref={`/v1120/chats/${clientId}`} title={post.title} />
      <PostSummary
        post={post}
        names={names}
        fullHref={post.period ? `/v1120/client/${clientId}/documents/summary?from=${post.period.from}&to=${post.period.to}` : `/v1120/g/${post.shareToken}?from=board`}
      />
      <CommentThread post={post} me="caregiver" names={names} clientId={clientId} send={commentAsCaregiver} />
    </Screen>
  );
}
