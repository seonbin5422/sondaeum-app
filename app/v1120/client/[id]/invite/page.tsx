import { notFound, redirect } from "next/navigation";
import { myBoardToken, myClient, requireCaregiver } from "../../../_data";
import { contactTitle, NO_CONTACT } from "../../../_types";
import { InviteScreen } from "./InviteScreen";

// C-23 보호자 게시판 초대 (Figma "카카오 공유 카드/게시판 초대"). 수급자를 등록하면 바로 이 화면으로 오고(?new=1),
// 보고서를 보내기 전에도 수급자별 게시판 링크(/v1120/g/[boardToken]/board)로 초대할 수 있다 (D-34 (b)안, 11/1).
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
      chatPath={`/v1120/g/${await myBoardToken(c.id)}/board`}
      doneHref={justRegistered === "1" ? "/v1120/clients" : `/v1120/client/${c.id}`}
    />
  );
}
