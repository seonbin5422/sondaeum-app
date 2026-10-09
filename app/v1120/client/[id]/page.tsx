import Link from "next/link";
import { notFound } from "next/navigation";
import { findClient, historyOf } from "../../_mock";
import { Avatar, Chip, LinkButton, Screen, TopBar } from "../../_components/ui";

// C-05 수급자 정보 (기존에는 홈 위 모달, 1120.ver에서는 수급자 탭의 화면)
export default async function ClientPage({ params }: PageProps<"/v1120/client/[id]">) {
  const { id } = await params;
  const c = findClient(id);
  if (!c) notFound();
  const last = historyOf(id).find((v) => v.status === "SENT");

  const rows: [string, string | null][] = [
    ["알레르기", c.allergies],
    ["병력", c.medicalHistory],
    ["복용 중인 약", c.medicationNotes],
    ["보호자", `${c.guardianName} (${c.guardianRelation})`],
    ["장기요양인정번호", c.careRegistrationNumber],
    ["연락처", c.phone],
  ];

  return (
    <Screen nav>
      <TopBar backHref="/v1120/clients" />
      <header className="flex items-center gap-4">
        <Avatar name={c.name} />
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold">{c.name} 수급자</h1>
          <p className="text-lg text-muted">
            {c.age}세 · {c.gender} · <span className="font-bold text-foreground">장기요양 {c.careGrade ?? "등급 미입력"}</span>
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
          <LinkButton href={`/v1120/chats/${c.id}`} variant="secondary">
            보호자와 대화
          </LinkButton>
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
