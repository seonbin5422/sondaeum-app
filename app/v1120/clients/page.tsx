import Link from "next/link";
import { clients } from "../_mock";
import { ChatLabel } from "../_components/Unread";
import { Avatar, Card, Chip, LinkButton, Screen } from "../_components/ui";

// 수급자 탭: 담당 수급자 목록 (기존 C-09 관리 화면을 합침). 삭제한 수급자은 아래에서 되살린다.
export default function ClientsPage() {
  const active = clients.filter((c) => c.isActive);
  const removed = clients.filter((c) => !c.isActive);
  return (
    <Screen nav bottom={<LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>}>
      <header>
        <h1 className="text-2xl font-bold">수급자</h1>
        <p className="text-lg text-muted">담당 수급자 {active.length}명</p>
      </header>

      <ul className="flex flex-col gap-4">
        {active.map((c) => (
          <li key={c.id}>
            <Card>
              <Link href={`/v1120/client/${c.id}`} className="flex items-center gap-4">
                <Avatar name={c.name} />
                <div className="flex flex-1 flex-col items-start gap-1">
                  <h2 className="text-lg font-bold">
                    {c.name} 수급자 <span className="text-base font-normal text-muted">{c.age}세 · {c.gender} · {c.careGrade ?? "등급 미입력"}</span>
                  </h2>
                  <Chip>{c.scheduleLabel}</Chip>
                </div>
                <span className="text-xl text-muted" aria-hidden>
                  ›
                </span>
              </Link>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["방문 기록", `/v1120/client/${c.id}/history`],
                    ["서류 만들기", `/v1120/client/${c.id}/documents`],
                    [<ChatLabel key="chat" clientId={c.id} />, `/v1120/chats/${c.id}`],
                  ] as const
                ).map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex min-h-12 items-center justify-center rounded-xl border border-border text-base font-bold active:bg-accent-soft"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {removed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-muted">삭제한 수급자</h2>
          <p className="-mt-2 text-base text-muted">14일이 지나면 완전히 지워져요. 그 전에는 되살릴 수 있어요.</p>
          {removed.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-[15px] border border-(--line) px-4 py-3">
              <span className="text-lg">{c.name} 수급자</span>
              <span className="flex gap-2">
                <button type="button" className="min-h-12 rounded-xl border border-border px-3 text-base font-bold">
                  되살리기
                </button>
                <Link
                  href={`/v1120/client/${c.id}/delete?step=permanent`}
                  className="flex min-h-12 items-center rounded-xl px-3 text-base font-bold text-(--danger)"
                >
                  완전히 지우기
                </Link>
              </span>
            </div>
          ))}
        </section>
      )}
    </Screen>
  );
}
