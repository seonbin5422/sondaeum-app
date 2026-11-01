import { notFound } from "next/navigation";
import { caregiverName, chatTokenToClient, findClient } from "../../_mock";
import { Avatar, Chip, LinkButton, Screen } from "../../_components/ui";

// G-04 보호자 홈 (D-44). 어르신 정보는 보기만, 고칠 내용은 게시판 댓글로 요양보호사에게 말한다
export default async function GuardianHomePage({ params }: PageProps<"/v1120/c/[token]">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();

  const rows: [string, string | null][] = [
    ["장기요양등급", c.careGrade],
    ["알레르기", c.allergies],
    ["병력", c.medicalHistory],
    ["복용 중인 약", c.medicationNotes],
  ];

  return (
    <Screen nav guardianToken={token}>
      <p className="text-lg text-muted">안녕하세요, {c.guardianName} 보호자님</p>
      <header className="flex items-center gap-4">
        <Avatar name={c.name} />
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">{c.name} 어르신</h1>
          <p className="text-lg text-muted">{[c.age && `${c.age}세`, c.gender].filter(Boolean).join(" · ")}</p>
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">방문 일정</h2>
        <div className="flex flex-col items-start gap-2 rounded-[15px] border border-(--line) p-4">
          <Chip>{c.scheduleLabel}</Chip>
          <p className="text-lg">{caregiverName} 요양보호사가 방문해요</p>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <LinkButton href={`/v1120/c/${token}/reports`}>보고서 모아보기</LinkButton>
        <LinkButton href={`/v1120/c/${token}/documents`} variant="secondary">
          서류 만들기
        </LinkButton>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">어르신 정보</h2>
        <dl className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line) px-4">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-lg">
              <dt className="shrink-0 text-muted">{k}</dt>
              <dd className={`text-right font-bold ${v ? "" : "font-normal text-muted"}`}>{v ?? "없음"}</dd>
            </div>
          ))}
        </dl>
        <p className="text-base text-muted">바뀐 내용이 있으면 게시판 댓글로 요양보호사에게 알려 주세요.</p>
      </section>
    </Screen>
  );
}
