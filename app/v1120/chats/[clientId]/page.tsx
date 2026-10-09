import { notFound } from "next/navigation";
import { chatByClient, findClient } from "../../_mock";
import { ChatRoom } from "../../_components/ChatRoom";
import { Screen, TopBar } from "../../_components/ui";

// C-18 수급자 대화방 (요양보호사)
export default async function ChatRoomPage({ params }: PageProps<"/v1120/chats/[clientId]">) {
  const { clientId } = await params;
  const c = findClient(clientId);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref="/v1120/chats" title={`${c.name} 수급자 · ${c.guardianName} 보호자`} />
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
