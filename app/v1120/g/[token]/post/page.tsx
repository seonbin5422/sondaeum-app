import { notFound } from "next/navigation";
import { guardianBoard } from "../../../_data";
import { commentAsGuardian, markReadAsGuardian } from "../../../_actions";
import { CommentThread, PostSummary } from "../../../_components/Board";
import { BackButton } from "../../../_components/BackButton";
import { contactTitle } from "../../../_types";

// G-02 게시글 상세 (보호자): C-18 게시글 상세와 같은 모양, 역할 칩만 "보호자 · 나". 로그인 없이 그 보고서 링크로
export default async function GuardianPostPage({ params }: PageProps<"/v1120/g/[token]/post">) {
  const { token } = await params;
  const b = await guardianBoard(token);
  const post = b?.posts.find((p) => p.shareToken === token);
  if (!b || !post) notFound();
  const names = { caregiver: b.caregiverName, guardian: `${b.guardianName} ${contactTitle(b.guardianRelation)}` };
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <BackButton fallback={`/v1120/g/${token}/board`} />
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <PostSummary post={post} names={names} fullHref={post.period ? `/v1120/g/${token}/document` : `/v1120/g/${token}?from=board`} />
      <CommentThread post={post} me="guardian" names={names} send={commentAsGuardian} markRead={markReadAsGuardian} />
    </main>
  );
}
