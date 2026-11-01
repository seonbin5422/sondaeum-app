import Link from "next/link";
import { notFound } from "next/navigation";
import { myClient, myHistory } from "../../_data";
import { Avatar, Chip, LinkButton, Screen, TopBar } from "../../_components/ui";
import { contactTitle, NO_CONTACT } from "../../_types";

// C-05 수급자 정보 (기존에는 홈 위 모달, 1120.ver에서는 수급자 탭의 화면)
export default async function ClientPage({ params }: PageProps<"/v1120/client/[id]">) {
  const { id } = await params;
  const c = await myClient(id);
  if (!c) notFound();
  const last = (await myHistory(id)).find((v) => v.status === "SENT");
  const noContact = c.guardianRelation === NO_CONTACT;
  const title = contactTitle(c.guardianRelation);

  const rows: [string, string | null][] = [
    ["알레르기", c.allergies],
    ["병력", c.medicalHistory],
    ["복용 중인 약", c.medicationNotes],
    ["장기요양인정번호", c.careRegistrationNumber],
    ["수급자 전화번호", c.phone],
    ["보호자", noContact ? null : `${c.guardianName} (${c.guardianRelation})`],
    ...(noContact ? [] : ([["보호자 전화번호", c.guardianPhone]] as [string, string | null][])),
  ];

  return (
    <Screen nav>
      <TopBar backHref="/v1120/clients" />
      <header className="flex items-center gap-4">
        <Avatar name={c.name} />
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-lg text-muted">
            {[c.age && `${c.age}세`, c.gender].filter(Boolean).join(" · ")}{(c.age || c.gender) && " · "}<span className="font-bold text-foreground">장기요양 {c.careGrade ?? "등급 미입력"}</span>
          </p>
          <Chip>{c.scheduleLabel}</Chip>
        </div>
      </header>

      {c.personalNotes && (
        <div className="flex flex-col gap-1 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
          <p className="text-base font-bold">꼭 기억할 것</p>
          <p className="text-lg">{c.personalNotes}</p>
        </div>
      )}

      {!c.guardianJoined && !noContact && (
        <div className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
          <p className="text-lg font-bold">{c.guardianName} {title}님이 아직 게시판에 들어오지 않았어요</p>
          <LinkButton href={`/v1120/client/${c.id}/invite`} className="!h-14">
            {title}님 게시판에 초대하기
          </LinkButton>
        </div>
      )}

      <dl className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line) px-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-3 text-lg">
            <dt className="shrink-0 text-muted">{k}</dt>
            <dd className={`text-right font-bold ${v ? "" : "font-normal text-muted"}`}>{v ?? "없음"}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <LinkButton href={`/v1120/client/${c.id}/history`}>
          방문 기록 보기{last ? ` (최근 ${Number(last.date.slice(5, 7))}월 ${Number(last.date.slice(8))}일)` : ""}
        </LinkButton>
        <div className="grid grid-cols-2 gap-2">
          <LinkButton href={`/v1120/client/${c.id}/documents`} variant="secondary">
            서류 만들기
          </LinkButton>
          {!noContact && (
            <LinkButton href={`/v1120/chats/${c.id}`} variant="secondary">
              게시판
            </LinkButton>
          )}
        </div>
      </div>

      <div className="flex justify-between border-t border-(--line) pt-4">
        <Link href={`/v1120/client/${c.id}/edit`} className="flex min-h-12 items-center text-lg font-bold underline underline-offset-4">
          정보 수정
        </Link>
        <Link href={`/v1120/client/${c.id}/delete`} className="flex min-h-12 items-center text-lg font-bold text-(--danger)">
          수급자 삭제
        </Link>
      </div>
    </Screen>
  );
}
