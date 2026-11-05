import Image from "next/image";
import type { CSSProperties } from "react";
import { requireCaregiver, serviceTimeOf } from "./_data";
import { caregiverTitle } from "./_types";
import { startVisit } from "./_actions";
import { ScheduleSheet } from "./_components/ScheduleSheet";
import { ResumeSheet } from "./_components/ResumeSheet";
import { PressLink } from "./_components/Pressable";
import { Button, Card, Chip, LinkButton, Screen } from "./_components/ui";
import { kstNowHm, notifications, todayVisitList, visitHref, type HomeVisit } from "./notifications/_today";

const order = (i: number) => ({ "--i": i }) as CSSProperties;

// C-03 홈 (Figma 511:696): 귤색 머리(로고·알림·인사·마무리 못 한 기록) · 다음 방문 · 바로가기 · 오늘 방문
export default async function HomePage() {
  const caregiver = await requireCaregiver();
  const { clients, list } = await todayVisitList();
  const active = clients.filter((c) => c.isActive);
  // 종 숫자 = "모두 읽음" 뒤에 새로 생긴 알림. 마무리 못 한 기록 = 최근 7일 동안 시작했지만 안 보낸 방문 (최근 것부터)
  const { items, unsent: left } = await notifications(list);
  const alerts = items.filter((n) => n.unread).length;
  // 다음 방문: 아직 시작 안 한 방문 중 지금 이후 첫 번째, 없으면 안 보낸 방문 중 첫 번째
  const now = kstNowHm();
  const todo = list.filter((v) => v.status !== "SENT");
  const next = todo.find((v) => v.status === "NOT_STARTED" && v.start >= now) ?? todo[0];
  const today = serviceTimeOf(null, new Date()).date;

  return (
    <Screen nav tab>
      <header className="enter-down relative -mx-5 -mt-5 flex flex-col gap-4 overflow-hidden rounded-b-3xl bg-accent px-6 pb-7 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/v1120/home/home-deco.svg" alt="" aria-hidden width={267} height={297} className="pointer-events-none absolute -top-2 left-1/2 mix-blend-soft-light" />
        <div className="relative flex h-12 items-center justify-between">
          <Image src="/brand/logo-full.svg" alt="손다음" width={118} height={42} priority className="brightness-0 invert" />
          <PressLink href="/v1120/notifications" pendingText={false} className="relative flex size-12 items-center justify-center rounded-full active:bg-white/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/v1120/home/bell.svg" alt="" width={36} height={36} />
            {alerts > 0 && (
              <span className="pop absolute left-7 top-0 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-(--danger) px-1.5 text-[14px] font-bold leading-none text-white">
                {alerts}
              </span>
            )}
            <span className="sr-only">알림{alerts > 0 ? ` ${alerts}개` : ""}</span>
          </PressLink>
        </div>
        <div className="relative flex flex-col gap-0.5 leading-[1.4] text-black">
          <p className="text-lg">{caregiverTitle(caregiver.name)}님,</p>
          <h1 className="text-2xl font-bold">
            <span className="whitespace-nowrap">{today}</span> 돌봄 {list.length}건이에요
          </h1>
        </div>
        {left.length > 0 && (
          <div className="enter relative flex flex-col gap-3 rounded-2xl bg-white px-4 py-4" style={order(1)}>
            {/* 가장 최근 기록이 누구의 언제 것인지 보여 준다. 2건 이상이면 "이어서 하기"가 시트를 열어 고르게 한다.
                글과 버튼을 옆으로 두면 좁은 폰에서 글이 여러 줄로 눌려서 위아래로 쌓는다 (11/6 팀 피드백) */}
            <span className="flex flex-col gap-0.5 leading-[1.4]">
              <span className="text-lg font-bold text-muted">
                마무리 못 한 기록 <span className="whitespace-nowrap">{left.length}건이</span> 있어요.
              </span>
              <span className="text-lg font-bold">
                <span className="whitespace-nowrap">{left[0].clientName} 수급자</span> ·{" "}
                <span className="whitespace-nowrap">{serviceTimeOf(null, left[0].day).date}</span>
                {left.length > 1 && <span className="whitespace-nowrap"> 외 {left.length - 1}건</span>}
              </span>
            </span>
            <ResumeSheet
              className={`${pillBase} ${pillTones.soft} w-full text-lg`}
              items={left.map((v) => ({
                href: visitHref(v.visitId, v.status),
                name: v.clientName,
                date: serviceTimeOf(null, v.day).date,
                step: v.status === "RECORDING" ? "녹음하다 멈춤" : v.status === "DRAFT_READY" ? "확인하고 보내기 전" : "기록 정리 중",
              }))}
            />
          </div>
        )}
      </header>

      {next && <NextVisit visit={next} />}

      {list.length === 0 && (
        <Card className="items-start">
          <p className="text-lg font-bold">오늘은 예정된 방문이 없어요.</p>
          {active.length === 0 && <LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>}
        </Card>
      )}

      <div className="enter grid grid-cols-2 gap-3" style={order(3)}>
        <ScheduleSheet clients={clients} />
        <PressLink
          // 서류는 수급자마다 만든다: 한 명이면 바로 그 수급자 서류로, 여럿이면 서류 만들기 안에서 고른다
          href={active.length === 1 ? `/v1120/client/${active[0].id}/documents` : "/v1120/documents"}
          pendingText={false}
          className="flex h-[150px] flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left active:bg-(--line)"
        >
          <span className="flex size-12 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/v1120/home/home-doc.svg" alt="" width={28} height={28} />
          </span>
          <span className="flex-1" />
          <span className="text-lg font-bold leading-[1.4]">서류 만들기</span>
          <span className="text-base leading-[1.4] text-muted">기간 골라 PDF</span>
        </PressLink>
      </div>

      {list.length > 0 && (
        <>
          <div className="enter flex items-start justify-between pt-2 leading-[1.4]" style={order(4)}>
            <h2 className="text-xl font-bold">오늘 방문</h2>
            <p className="text-lg font-medium text-muted">{list.length}건</p>
          </div>
          <ul className="enter flex flex-col gap-px overflow-hidden rounded-2xl bg-(--bg-secondary)" style={order(5)}>
            {list.map((v) => (
              <li key={v.clientId} className="bg-white">
                <VisitRow visit={v} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}

function NextVisit({ visit }: { visit: HomeVisit }) {
  return (
    <section className="enter flex flex-col items-start gap-4 rounded-2xl bg-white p-5" style={order(2)}>
      <span className="rounded-full bg-accent px-3 py-1 text-base font-bold leading-[1.4]">
        다음 방문{visit.time ? ` · ${visit.start}` : ""}
      </span>
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary) text-2xl font-bold text-muted">
          {visit.clientName.slice(0, 1)}
        </span>
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-xl font-bold leading-[1.4]">{visit.clientName}</p>
          <Chip>
            <span className="whitespace-nowrap">{visit.scheduleLabel.replace("일·월·화·수·목·금·토", "매일")}</span>
          </Chip>
        </div>
      </div>
      <div className="flex w-full gap-2">
        <LinkButton href={`/v1120/client/${visit.clientId}`} variant="secondary" className="flex-1">
          정보 보기
        </LinkButton>
        <form action={startVisit.bind(null, visit.clientId)} className="flex flex-[2]">
          <Button type="submit">{actionOf(visit).label}</Button>
        </form>
      </div>
    </section>
  );
}

// 홈/할 일 버튼: 방문 상태를 버튼 하나로 (기록 전=귤색, 기록 중=연한 귤색, 확인 필요=파랑, 보냄=연한 파랑)
function actionOf(v: HomeVisit) {
  if (v.status === "NOT_STARTED") return { label: "기록하기", tone: "accent" as const };
  if (v.status === "RECORDING") return { label: "이어서 기록하기", tone: "soft" as const };
  if (v.status === "SENT") return { label: "보냄 완료", tone: "sent" as const };
  return { label: "확인하고 보내기", tone: "check" as const };
}

const pillTones = {
  accent: "bg-accent text-foreground active:bg-accent-dark",
  soft: "bg-(--bg-brand) text-(--text-brand) active:bg-accent/40",
  check: "bg-(--success) text-white active:bg-(--text-success)",
  sent: "bg-(--success-soft) text-(--text-success) active:bg-(--line)",
};
const pillBase = "press inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-base font-bold";

function PillSubmit({ tone, children }: { tone: keyof typeof pillTones; children: string }) {
  // 공통 Button(대기 표시 포함)을 쓰되 폭·높이·모서리만 알약으로 덮는다
  return (
    <Button type="submit" className={`${pillBase} h-12! w-auto! rounded-full! text-base! ${pillTones[tone]}`}>
      {children}
    </Button>
  );
}

function VisitRow({ visit }: { visit: HomeVisit }) {
  const a = actionOf(visit);
  return (
    <div className="flex min-h-20 items-center gap-3 p-4">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-(--bg-secondary) text-xl font-bold text-muted">
        {visit.clientName.slice(0, 1)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
        <p className="text-lg font-bold">{visit.clientName}</p>
        <p className="text-base font-medium text-muted">{visit.time || visit.scheduleLabel}</p>
      </div>
      {visit.status === "SENT" ? (
        <PressLink href={`/v1120/visit/${visit.visitId}/sent`} className={`${pillBase} ${pillTones.sent}`}>
          {a.label}
        </PressLink>
      ) : (
        <form action={startVisit.bind(null, visit.clientId)} className="shrink-0">
          <PillSubmit tone={a.tone}>{a.label}</PillSubmit>
        </form>
      )}
    </div>
  );
}
