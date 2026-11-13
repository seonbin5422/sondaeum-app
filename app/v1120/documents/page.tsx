import { redirect } from "next/navigation";
import { myClients } from "../_data";
import { Avatar, Card, EmptyState, LinkButton, ListRow, Screen, TopBar } from "../_components/ui";

// 홈 "서류 만들기": 수급자가 여럿이면 여기서 고른다 (전에는 수급자 탭으로 보내서 메뉴가 바뀐 줄 알았음, 팀 피드백 11/6)
export default async function PickClientForDocumentsPage() {
  const active = (await myClients()).filter((c) => c.isActive);
  if (active.length === 1) redirect(`/v1120/client/${active[0].id}/documents`);
  return (
    <Screen>
      <TopBar backHref="/v1120" title="서류 만들기" />
      <p className="enter py-2 text-xl font-bold leading-[1.4]">누구의 서류를 만들까요?</p>
      {active.length === 0 ? (
        <>
          <EmptyState>수급자를 등록하면 그 어르신의 서류를 만들 수 있어요.</EmptyState>
          <LinkButton href="/v1120/client/new">+ 수급자 등록하기</LinkButton>
        </>
      ) : (
        <Card className="gap-0! p-0! overflow-hidden">
          {active.map((c) => (
            <ListRow key={c.id} href={`/v1120/client/${c.id}/documents`} icon={<Avatar name={c.name} />} title={`${c.name} 수급자`} desc={c.scheduleLabel} chevron />
          ))}
        </Card>
      )}
    </Screen>
  );
}
