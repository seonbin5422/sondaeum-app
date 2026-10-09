import { notFound } from "next/navigation";
import { caregiverName, chatTokenOf, findClient } from "../../../_mock";
import { InviteScreen } from "./InviteScreen";

// 보호자 대화방 초대 (와이어 없음, 제안안). 수급자를 등록하면 바로 이 화면으로 오고,
// 아직 들어오지 않은 보호자에게는 수급자 정보·대화방에서 다시 보낼 수 있다.
export default async function InvitePage({ params, searchParams }: PageProps<"/v1120/client/[id]/invite">) {
  const { id } = await params;
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  if (id === "new") {
    const name = one(q.name) || "새 수급자";
    const guardian = one(q.guardian) || "보호자";
    return (
      <InviteScreen
        justRegistered
        clientName={name}
        guardianName={guardian}
        guardianPhone={one(q.phone) || null}
        caregiverName={caregiverName}
        chatPath={`/v1120/c/new-${encodeURIComponent(name)}~${encodeURIComponent(guardian)}`}
        doneHref="/v1120/clients"
      />
    );
  }

  const c = findClient(id);
  if (!c) notFound();
  return (
    <InviteScreen
      clientName={c.name}
      guardianName={c.guardianName}
      guardianPhone={c.guardianPhone}
      caregiverName={caregiverName}
      chatPath={`/v1120/c/${chatTokenOf(c.id) ?? "kim-demo"}`}
      doneHref={`/v1120/client/${c.id}`}
    />
  );
}
