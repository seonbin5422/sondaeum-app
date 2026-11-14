import { notFound } from "next/navigation";
import { guardianBoard } from "../../../_data";
import { BoardExpired, LiveRefresh, PostList } from "../../../_components/Board";
import { EmptyState, Screen, TopBar, TOP_BACK } from "../../../_components/ui";
import { BackButton } from "../../../_components/BackButton";
import { Coach } from "../../../_components/Coach";
import { COACH } from "../../../_coachSteps";
import { caregiverTitle, contactTitle } from "../../../_types";

// G-02 보호자 게시판 (Figma "와이어 · G-02 보호자 게시판", D-15 261101.ver). 로그인 없이 받은 보고서 링크로 들어와 그 어르신의 보고서를 모두 본다
export default async function GuardianBoardPage({ params }: PageProps<"/v1120/g/[token]/board">) {
  const { token } = await params;
  const b = await guardianBoard(token);
  if (b === "expired") return <BoardExpired />;
  if (!b) notFound();
  const title = contactTitle(b.guardianRelation);
  const names = { caregiver: b.caregiverName, guardian: `${b.guardianName} ${title}` };
  // 요양보호사 게시판(C-18)과 같은 1128 모양: 회색 바탕·상단 바·흰 글 카드·정렬 (사용자 11/14 "UI가 다름")
  return (
    <Screen>
      <LiveRefresh />
      {/* 초대 링크로 들어왔으면 돌아갈 보고서 화면이 없다 */}
      <TopBar title={`${b.clientName} 어르신 게시판`} back={b.viaInvite ? <span /> : <BackButton icon className={TOP_BACK} fallback={`/v1120/g/${token}`} />} />
      <header className="enter flex flex-col gap-1 leading-[1.4]">
        <p className="text-base text-muted">
          안녕하세요, {b.guardianName} {title}님
        </p>
        <p className="text-base">{caregiverTitle(b.caregiverName)}가 보낸 방문 보고서예요. 궁금한 점은 글마다 댓글로 남겨 주세요.</p>
      </header>
      <p className="rounded-2xl bg-(--bg-brand) px-4 py-3 text-base leading-[1.4] text-(--text-brand)">
        받은 링크로 로그인 없이 들어왔어요. 어르신 기록이 담긴 링크라 다른 사람에게 보내지 말아 주세요.
      </p>
      {b.posts.length === 0 ? (
        <EmptyState>아직 보낸 보고서가 없어요. 방문 보고서를 보내면 여기에 올라와요.</EmptyState>
      ) : (
        <PostList posts={b.posts} names={names} me="guardian" hrefBase="/v1120/g" hrefSuffix="/post" />
      )}
      <Coach id="guardian-board" steps={COACH.guardianBoard} />
    </Screen>
  );
}
