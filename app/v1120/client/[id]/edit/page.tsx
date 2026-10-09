import { notFound } from "next/navigation";
import { findClient } from "../../../_mock";
import { ClientForm } from "../../../_components/ClientForm";
import { Screen, TopBar } from "../../../_components/ui";

// C-08 수급자 정보 수정
export default async function EditClientPage({ params }: PageProps<"/v1120/client/[id]/edit">) {
  const { id } = await params;
  const c = findClient(id);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref={`/v1120/client/${id}`} title={`${c.name} 수급자 정보 수정`} />
      <ClientForm initial={c} submitLabel="고친 내용 저장하기" />
    </Screen>
  );
}
