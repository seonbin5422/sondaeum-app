import type { CSSProperties } from "react";
import { myClients, myUnreadByClient } from "../_data";
import { restoreClient } from "../_actions";
import { ChatLabel } from "../_components/Unread";
import { PressLink } from "../_components/Pressable";
import { Avatar, Button, Card, Chip, EmptyState, Icon, LinkButton, Screen } from "../_components/ui";
import { TitleBar } from "../client/TitleBar";

// 수급자 탭 (Figma 514:422): 담당 수급자 목록 (기존 C-09 관리 화면을 합침). 삭제한 수급자는 아래에서 되살린다.
export default async function ClientsPage() {
  const [clients, unread] = await Promise.all([myClients(), myUnreadByClient()]);
  const active = clients.filter((c) => c.isActive);
  const removed = clients.filter((c) => !c.isActive);
  const shortcut = "flex h-12 flex-1 items-center justify-center gap-1 rounded-xl bg-(--bg-secondary) px-3 text-base font-bold whitespace-nowrap active:bg-(--line)";
  return (
    <Screen nav tab>
      <TitleBar title="수급자" />
      <p className="text-lg text-muted">담당 수급자 {active.length}명</p>

      {active.length === 0 && <EmptyState>수급자를 등록해 주세요.</EmptyState>}

      <ul className="flex flex-col gap-3">
        {active.map((c, i) => {
          const n = unread.get(c.id) ?? 0;
          return (
            <li key={c.id} style={{ "--i": Math.min(i, 5) } as CSSProperties}>
              <Card className="gap-3">
                <PressLink href={`/v1120/client/${c.id}`} pendingText={false} className="-m-2 flex items-center gap-3 rounded-xl p-2 active:bg-(--bg-secondary)">
                  <Avatar name={c.name} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.4]">
                    <span className="text-xl font-bold">{c.name} 수급자</span>
                    <span className="text-base text-muted">
                      {[c.age && `${c.age}세`, c.gender, c.careGrade ?? "등급 미입력"].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <Icon name="chevron_right" size={28} />
                </PressLink>
                <div>
                  <Chip>{c.scheduleLabel}</Chip>
                </div>
                <div className="flex gap-2">
                  <PressLink href={`/v1120/client/${c.id}/history`} className={shortcut}>
                    방문 기록
                  </PressLink>
                  {/* 세 버튼이 한 줄이라 "서류 만들기"는 좁은 폰에서 두 줄이 된다. 글자를 줄이지 않고 낱말을 줄인다 (들어가면 제목은 "서류 만들기") */}
                  <PressLink href={`/v1120/client/${c.id}/documents`} className={shortcut}>
                    서류
                  </PressLink>
                  <PressLink href={`/v1120/chats/${c.id}`} className={`${shortcut} ${n > 0 ? "text-(--text-brand)" : ""}`}>
                    <ChatLabel n={n} />
                  </PressLink>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>

      {removed.length > 0 && (
        <Card className="gap-2">
          <h2 className="text-lg font-bold">삭제한 수급자</h2>
          <p className="text-base text-muted">
            14일이 지나면 완전히 지워져요. <span className="whitespace-nowrap">그 전에는</span> 되살릴 수 있어요.
          </p>
          {removed.map((c) => (
            <div key={c.id} className="flex items-center gap-2 pt-2">
              <span className="min-w-0 flex-1 text-lg font-medium">{c.name} 수급자</span>
              <form action={restoreClient.bind(null, c.id)}>
                <Button type="submit" variant="secondary" className="!h-12 !w-auto rounded-xl px-3 text-base whitespace-nowrap">
                  되살리기
                </Button>
              </form>
              <LinkButton
                href={`/v1120/client/${c.id}/delete?step=permanent`}
                variant="danger"
                className="!h-12 !w-auto shrink-0 rounded-xl px-3 text-base whitespace-nowrap"
              >
                완전히 지우기
              </LinkButton>
            </div>
          ))}
        </Card>
      )}
    </Screen>
  );
}
