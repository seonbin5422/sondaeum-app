import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { myClient, myHistory, myUnreadByClient } from "../../_data";
import { Card, Chip, Icon, LinkButton, ListRow, Screen, TopBar } from "../../_components/ui";
import { contactTitle, NO_CONTACT } from "../../_types";

// C-05 수급자 정보 (Figma 514:520). 기존에는 홈 위 모달, 1120.ver에서는 수급자 탭의 화면
export default async function ClientPage({ params }: PageProps<"/v1120/client/[id]">) {
  const { id } = await params;
  const c = await myClient(id);
  if (!c) notFound();
  const [history, unread] = await Promise.all([myHistory(id), myUnreadByClient()]);
  const last = history.find((v) => v.status === "SENT");
  const n = unread.get(c.id) ?? 0;
  const noContact = c.guardianRelation === NO_CONTACT;
  const title = contactTitle(c.guardianRelation);

  const rows: [string, string | null][] = [
    ["알레르기", c.allergies],
    ["병력", c.medicalHistory],
    ["복용 중인 약", c.medicationNotes],
    ...(noContact
      ? []
      : ([[title, [`${c.guardianName} (${c.guardianRelation})`, c.guardianPhone].filter(Boolean).join(" · ")]] as [string, string][])),
    ["장기요양인정번호", c.careRegistrationNumber],
    ["연락처", c.phone],
  ];
  const at = (i: number) => ({ "--i": i }) as CSSProperties;

  return (
    <Screen nav white>
      <TopBar backHref="/v1120/clients" title="수급자 정보" />

      <div style={at(0)}>
        <Card className="items-center gap-3 p-6 text-center">
          <span className="flex size-[72px] items-center justify-center rounded-full bg-(--bg-secondary) text-[28px] font-bold text-muted">
            {c.name.slice(0, 1)}
          </span>
          <h1 className="text-2xl font-bold">{c.name} 수급자</h1>
          <p className="text-lg text-muted">
            {[c.age && `${c.age}세`, c.gender, <span key="g" className="whitespace-nowrap">장기요양 {c.careGrade ?? "등급 미입력"}</span>]
              .filter(Boolean)
              .flatMap((x, i) => (i ? [" · ", x] : [x]))}
          </p>
          <Chip>{c.scheduleLabel}</Chip>
        </Card>
      </div>

      {c.personalNotes && (
        <div style={at(1)}>
          <section className="enter flex flex-col gap-1 rounded-2xl bg-(--memo) p-5">
            <p className="text-base font-bold">꼭 기억할 것</p>
            <p className="text-lg font-medium">{c.personalNotes}</p>
          </section>
        </div>
      )}

      <div style={at(2)}>
        <Card>
          <dl className="flex flex-col gap-4 leading-[1.4]">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-base text-muted">{k}</dt>
                <dd className={`text-lg font-medium ${v ? "" : "text-muted"}`}>{v || "없음"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <div style={at(3)}>
        <Card className="-mx-5 gap-0 rounded-none p-1">
          <ListRow
            href={`/v1120/client/${c.id}/history`}
            icon={<Icon name="history" />}
            title="방문 기록 보기"
            desc={last ? `최근 ${Number(last.date.slice(5, 7))}월 ${Number(last.date.slice(8))}일` : "아직 보낸 기록이 없어요"}
          />
          <ListRow
            href={`/v1120/client/${c.id}/documents`}
            icon={<MaskIcon src="/v1120/client-doc.svg" />}
            title="서류 만들기"
            desc="진료 참고용 요약 · 급여제공기록지"
          />
          {!noContact && (
            <>
              <ListRow
                href={`/v1120/chats/${c.id}`}
                icon={<MaskIcon src="/v1120/client-board.svg" />}
                title={`${title} 게시판`}
                desc={n > 0 ? <span className="font-bold text-(--text-brand)">새 댓글 {n}개</span> : "새 댓글이 없어요"}
              />
              <ListRow
                href={`/v1120/client/${c.id}/invite`}
                icon={<Icon name="person_add" />}
                title={`${title} 게시판 초대`}
                desc={
                  c.guardianJoined ? (
                    "카카오톡·문자로 링크 보내기"
                  ) : (
                    <span className="font-bold text-(--text-brand)">
                      {c.guardianName} {title}님이 <span className="whitespace-nowrap">아직 안 들어왔어요</span>
                    </span>
                  )
                }
              />
            </>
          )}
        </Card>
      </div>

      <div className="enter flex gap-2" style={at(4)}>
        <LinkButton href={`/v1120/client/${c.id}/edit`} variant="secondary" className="flex-1">
          정보 수정
        </LinkButton>
        <LinkButton href={`/v1120/client/${c.id}/delete`} variant="danger" className="flex-1">
          수급자 삭제
        </LinkButton>
      </div>
    </Screen>
  );
}

// Figma 서류·게시판 아이콘은 공통 아이콘 세트에 없어 public/v1120에 받아 둔 것을 글자색으로 칠한다
function MaskIcon({ src }: { src: string }) {
  const url = `url(${src})`;
  return <span aria-hidden className="inline-block size-6 shrink-0 bg-current" style={{ maskImage: url, WebkitMaskImage: url, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />;
}
