import Image from "next/image";
import { caregiverName, todayVisits } from "./_mock";
import { UnreadMessageLink } from "./_components/Unread";
import { ScheduleSheet } from "./_components/ScheduleSheet";
import type { TodayVisit } from "./_types";
import { Avatar, Card, Chip, LinkButton, Screen, StatusBadge } from "./_components/ui";

// C-03 홈: 오늘의 돌봄 (와이어 263:397)
export default function HomePage() {
  return (
    <Screen nav bottom={<LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>}>
      <Image src="/brand/logo-full.svg" alt="손다음" width={96} height={32} priority />

      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-lg text-muted">{caregiverName} 요양보호사님,</p>
          <h1 className="text-2xl font-bold">오늘 돌봄 {todayVisits.length}건이에요</h1>
        </div>
        <ScheduleSheet />
      </header>

      <ul className="flex flex-col gap-4">
        {todayVisits.map((visit) => (
          <li key={visit.visitId}>
            <VisitCard visit={visit} />
          </li>
        ))}
      </ul>
    </Screen>
  );
}

function VisitCard({ visit }: { visit: TodayVisit }) {
  const recordHref = `/v1120/visit/${visit.visitId}/record`;
  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar name={visit.clientName} />
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{visit.clientName} 수급자</h2>
            <StatusBadge status={visit.status} />
          </div>
          <Chip>{visit.scheduleLabel}</Chip>
        </div>
      </div>

      <UnreadMessageLink clientId={visit.clientId} />

      {visit.interrupted && (
        <>
          <p className="rounded-xl bg-accent-soft px-4 py-3 text-base text-accent-soft-foreground">
            녹음이 중간에 멈췄어요. 이어서 기록할 수 있어요.
          </p>
          <LinkButton href={recordHref}>이어서 기록하기</LinkButton>
        </>
      )}

      {visit.status === "NOT_STARTED" && (
        <div className="grid grid-cols-2 gap-2">
          <LinkButton href={`/v1120/client/${visit.clientId}/edit`} variant="secondary">
            정보 수정
          </LinkButton>
          <LinkButton href={recordHref}>기록하기</LinkButton>
        </div>
      )}
    </Card>
  );
}
