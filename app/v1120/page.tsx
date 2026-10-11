import Image from "next/image";
import { kstWeekday, myClients, myTodayVisits, requireCaregiver } from "./_data";
import { startVisit } from "./_actions";
import { UnreadMessageLink } from "./_components/Unread";
import { ScheduleSheet } from "./_components/ScheduleSheet";
import type { TodayVisit } from "./_types";
import { Avatar, Button, Card, Chip, LinkButton, Screen, StatusBadge } from "./_components/ui";

// C-03 홈: 오늘의 돌봄 (와이어 263:397)
export default async function HomePage() {
  const caregiver = await requireCaregiver();
  const clients = await myClients();
  const visits = await myTodayVisits();
  // 서버(Vercel)는 UTC라서 한국 시간 기준 요일로 센다. 오늘 요일이 아니어도 오늘 기록을 시작했으면 보여 준다
  const today = kstWeekday();
  const todayVisits: TodayVisit[] = clients
    .filter((c) => c.isActive && (c.scheduleDays.includes(today) || visits.has(c.id)))
    .map((c) => {
      const v = visits.get(c.id);
      return {
        visitId: v?.id ?? "",
        clientId: c.id,
        clientName: c.name,
        scheduleLabel: c.scheduleLabel,
        status: v?.status ?? "NOT_STARTED",
        interrupted: v?.status === "RECORDING" && !!v.transcript, // 녹음이 중간에 멈춤 (D-27)
      };
    });
  return (
    <Screen nav bottom={<LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>}>
      <Image src="/brand/logo-full.svg" alt="손다음" width={96} height={32} priority />

      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-lg text-muted">{caregiver.name} 요양보호사님,</p>
          <h1 className="text-2xl font-bold">오늘 돌봄 {todayVisits.length}건이에요</h1>
        </div>
        <ScheduleSheet clients={clients} />
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
  const start = startVisit.bind(null, visit.clientId);
  return (
    <Card>
      <div className="flex items-center gap-4">
        <Avatar name={visit.clientName} />
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{visit.clientName}</h2>
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
          <form action={start} className="flex">
            <Button type="submit">이어서 기록하기</Button>
          </form>
        </>
      )}

      {(visit.status === "RECORDED" || visit.status === "SUMMARIZING" || visit.status === "DRAFT_READY") && (
        <form action={start} className="flex">
          <Button type="submit">기록 확인하고 보내기</Button>
        </form>
      )}

      {visit.status === "NOT_STARTED" && (
        <div className="grid grid-cols-2 gap-2">
          <LinkButton href={`/v1120/client/${visit.clientId}/edit`} variant="secondary">
            정보 수정
          </LinkButton>
          <form action={start} className="flex">
            <Button type="submit">기록하기</Button>
          </form>
        </div>
      )}
    </Card>
  );
}
