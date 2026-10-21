import { notFound } from "next/navigation";
import { myClient, mySentReports } from "../../_data";
import { ChatRoom } from "../../_components/ChatRoom";
import { Screen, TopBar } from "../../_components/ui";

// C-18 수급자 대화방 (요양보호사). 대화 저장(DIF-5) 전까지는 보낸 보고서만 보이고 글은 쓰지 않는다
export default async function ChatRoomPage({ params }: PageProps<"/v1120/chats/[clientId]">) {
  const { clientId } = await params;
  const c = await myClient(clientId);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref="/v1120/chats" title={`${c.name} · ${c.guardianName} 보호자`} />
      <ChatRoom clientId={clientId} me="caregiver" initial={await mySentReports(clientId)} otherName={`${c.guardianName} 보호자`} reportsOnly />
    </Screen>
  );
}
