import { notFound } from "next/navigation";
import { chatByClient, findClient } from "../../_mock";
import { ChatRoom } from "../../_components/ChatRoom";
import { LinkButton, Screen, TopBar } from "../../_components/ui";

// C-18 수급자 대화방 (요양보호사)
export default async function ChatRoomPage({ params }: PageProps<"/v1120/chats/[clientId]">) {
  const { clientId } = await params;
  const c = findClient(clientId);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref="/v1120/chats" title={`${c.name} 수급자 · ${c.guardianName} 보호자`} />
      {!c.guardianJoined && (
        <div className="flex flex-col gap-2 rounded-xl bg-accent-soft px-4 py-3 text-accent-soft-foreground">
          <p className="text-base font-bold">보호자님이 아직 대화방에 들어오지 않았어요</p>
          <LinkButton href={`/v1120/client/${c.id}/invite`} variant="secondary" className="!h-12 text-base">
            초대 다시 보내기
          </LinkButton>
        </div>
      )}
      <ChatRoom
        clientId={clientId}
        me="caregiver"
        initial={chatByClient[clientId] ?? []}
        otherName={`${c.guardianName} 보호자`}
        reportsHref={`/v1120/chats/${clientId}/reports`}
        documentsHref={`/v1120/client/${clientId}/documents`}
      />
    </Screen>
  );
}
