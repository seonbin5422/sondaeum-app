import { notFound } from "next/navigation";
import { caregiverName, chatByClient, chatTokenToClient, findClient } from "../../_mock";
import { ChatRoom } from "../../_components/ChatRoom";

// G-02 보호자 대화방 (로그인 없이 수급자별 전용 링크, 만료 기한 있음). 예: /v1120/c/hong-demo
export default async function GuardianChatPage({ params }: PageProps<"/v1120/c/[token]">) {
  const { token } = await params;
  if (token.startsWith("new-")) {
    // 미리보기: 방금 등록한 수급자의 빈 대화방
    const [name, guardian] = token.slice(4).split("~").map(decodeURIComponent);
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-6">
        <header>
          <p className="text-base text-muted">안녕하세요, {guardian} 보호자님</p>
          <h1 className="text-2xl font-bold">{name} 어르신 대화방</h1>
          <p className="text-base text-muted">{caregiverName} 요양보호사와 이야기해요</p>
        </header>
        <ChatRoom clientId="new" me="guardian" initial={[]} otherName={`${caregiverName} 요양보호사`} reportsHref={`/v1120/c/${token}/reports`} documentsHref={`/v1120/c/${token}/documents`} />
      </main>
    );
  }
  const c = findClient(chatTokenToClient[token] ?? "");
  if (!c) notFound();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-6">
      <header>
        <p className="text-base text-muted">안녕하세요, {c.guardianName} 보호자님</p>
        <h1 className="text-2xl font-bold">{c.name} 어르신 대화방</h1>
        <p className="text-base text-muted">{caregiverName} 요양보호사와 이야기해요</p>
      </header>
      <ChatRoom
        clientId={c.id}
        me="guardian"
        initial={chatByClient[c.id] ?? []}
        otherName={`${caregiverName} 요양보호사`}
        reportsHref={`/v1120/c/${token}/reports`}
        documentsHref={`/v1120/c/${token}/documents`}
      />
    </main>
  );
}
