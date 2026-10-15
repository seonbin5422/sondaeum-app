import { notFound } from "next/navigation";
import { caregiverName, chatByClient, chatTokenToClient, findClient } from "../../../_mock";
import { ChatRoom } from "../../../_components/ChatRoom";
import { Screen } from "../../../_components/ui";

// G-02 보호자 대화방 (로그인 없이 수급자별 전용 링크, 만료 기한 있음). 예: /v1120/c/hong-demo/chat
export default async function GuardianChatPage({ params }: PageProps<"/v1120/c/[token]/chat">) {
  const { token } = await params;
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return (
    <Screen nav guardianToken={token}>
      <header>
        <h1 className="text-2xl font-bold">{c.name} 어르신 대화방</h1>
        <p className="text-base text-muted">{caregiverName} 요양보호사와 이야기해요</p>
      </header>
      <ChatRoom clientId={c.id} me="guardian" initial={chatByClient[c.id] ?? []} otherName={`${caregiverName} 요양보호사`} />
    </Screen>
  );
}
