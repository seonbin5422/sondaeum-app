import { notFound } from "next/navigation";
import { guardianBoard } from "../../../_data";
import { LiveRefresh, PostCard } from "../../../_components/Board";
import { BackButton } from "../../../_components/BackButton";
import { caregiverTitle, contactTitle } from "../../../_types";

// G-02 보호자 게시판 (Figma "와이어 · G-02 보호자 게시판", D-15 261101.ver). 로그인 없이 받은 보고서 링크로 들어와 그 어르신의 보고서를 모두 본다
export default async function GuardianBoardPage({ params }: PageProps<"/v1120/g/[token]/board">) {
  const { token } = await params;
  const b = await guardianBoard(token);
  if (!b) notFound();
  const title = contactTitle(b.guardianRelation);
  const names = { caregiver: b.caregiverName, guardian: `${b.guardianName} ${title}` };
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <LiveRefresh />
      {/* 초대 링크로 들어왔으면 돌아갈 보고서 화면이 없다 */}
      {!b.viaInvite && <BackButton fallback={`/v1120/g/${token}`} />}
      <header className="flex flex-col gap-1">
        <p className="text-base text-muted">
          안녕하세요, {b.guardianName} {title}님
        </p>
        <h1 className="text-2xl font-bold">{b.clientName} 어르신 게시판</h1>
        <p className="text-lg text-muted">{caregiverTitle(b.caregiverName)}가 보낸 방문 보고서예요. 궁금한 점은 글마다 댓글로 남겨 주세요.</p>
      </header>
      <p className="rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
        받은 링크로 로그인 없이 들어왔어요. 어르신 기록이 담긴 링크라 다른 사람에게 보내지 말아 주세요.
      </p>
      {b.posts.length === 0 && <p className="py-10 text-center text-lg text-muted">아직 보낸 보고서가 없어요. 방문 보고서를 보내면 여기에 올라와요.</p>}
      <ol className="flex flex-col gap-4">
        {b.posts.map((p) => (
          <li key={p.shareToken}>
            <PostCard post={p} names={names} me="guardian" href={`/v1120/g/${p.shareToken}/post`} />
          </li>
        ))}
      </ol>
    </main>
  );
}
