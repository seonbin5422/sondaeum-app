import { notFound, redirect } from "next/navigation";
import { myClient, requireCaregiver } from "../../../_data";
import { contactTitle, NO_CONTACT } from "../../../_types";
import { InviteScreen } from "./InviteScreen";

// 보호자 대화방 초대 (와이어 없음, 제안안). 수급자를 등록하면 바로 이 화면으로 오고(?new=1),
// 아직 들어오지 않은 보호자에게는 수급자 정보·대화방에서 다시 보낼 수 있다.
export default async function InvitePage({ params, searchParams }: PageProps<"/v1120/client/[id]/invite">) {
  const { id } = await params;
  const { new: justRegistered } = await searchParams;
  const caregiver = await requireCaregiver();
  const c = await myClient(id);
  if (!c) notFound();
  if (c.guardianRelation === NO_CONTACT) redirect(`/v1120/client/${c.id}`);
  return (
    <InviteScreen
      justRegistered={justRegistered === "1"}
      clientName={c.name}
      guardianName={c.guardianName}
      guardianTitle={contactTitle(c.guardianRelation)}
      guardianPhone={c.guardianPhone}
      caregiverName={caregiver.name}
      // shortcut: 보호자 입장 토큰은 대화방(DIF-5, 개발 1)에서 만든다, 그 전까지 링크는 열리지 않는다
      chatPath={`/v1120/c/pending-${c.id}`}
      doneHref={justRegistered === "1" ? "/v1120/clients" : `/v1120/client/${c.id}`}
    />
  );
}
