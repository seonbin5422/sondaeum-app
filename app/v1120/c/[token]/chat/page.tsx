import { notFound } from "next/navigation";
import { boardByClient, caregiverName, chatTokenToClient, findClient } from "../../../_mock";
import { PostCard } from "../../../_components/Board";
import { Screen } from "../../../_components/ui";

// G-02 보호자 게시판 예시 (D-44 보호자 앱, P2). 실제 보호자는 보고서 링크의 게시판(/v1120/g/[token]/board)을 쓴다
export default async function GuardianBoardDemoPage({ params }: PageProps<"/v1120/c/[token]/chat">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  const names = { caregiver: caregiverName, guardian: `${c.guardianName} 보호자` };
  return (
    <Screen nav guardianToken={token}>
      <header>
        <h1 className="text-2xl font-bold">{c.name} 어르신 게시판</h1>
        <p className="text-base text-muted">{caregiverName} 요양보호사가 보낸 보고서에 댓글로 이야기해요</p>
      </header>
      <ol className="flex flex-col gap-4">
        {(boardByClient[c.id] ?? []).map((p) => (
          <li key={p.shareToken}>
            <PostCard post={p} names={names} me="guardian" href={`/v1120/g/${p.shareToken}`} />
          </li>
        ))}
      </ol>
    </Screen>
  );
}
