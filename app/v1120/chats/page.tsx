import Link from "next/link";
import { myClients, mySentReports } from "../_data";
import { UnreadBadge } from "../_components/Unread";
import { Avatar, Screen } from "../_components/ui";

// 대화 탭: 수급자별 대화방 목록 (DIF-5). 대화 저장 전까지는 보낸 보고서만 올라온다
export default async function ChatsPage() {
  const [all, reports] = await Promise.all([myClients(), mySentReports()]);
  const rooms = all.filter((c) => c.isActive);
  return (
    <Screen nav>
      <h1 className="text-2xl font-bold">대화</h1>
      <p className="-mt-4 text-lg text-muted">수급자마다 보호자와 대화하는 방이 하나씩 있어요.</p>
      {rooms.length === 0 ? (
        <p className="py-10 text-center text-lg text-muted">수급자를 등록하면 대화방이 생겨요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-(--line) rounded-[15px] border border-(--line)">
          {rooms.map((c) => {
            const last = reports.findLast((r) => r.clientId === c.id);
            return (
              <li key={c.id}>
                <Link href={`/v1120/chats/${c.id}`} className="flex min-h-20 items-center gap-3 px-4 py-3">
                  <Avatar name={c.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-lg font-bold">
                      {c.name} <span className="text-base font-normal text-muted">· {c.guardianName} 보호자({c.guardianRelation})</span>
                    </span>
                    <span className="truncate text-base text-muted">{last?.report ? `📄 ${last.report.title}` : "아직 보낸 보고서가 없어요"}</span>
                  </span>
                  <UnreadBadge clientId={c.id} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
