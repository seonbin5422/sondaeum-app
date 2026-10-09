import { notFound } from "next/navigation";
import { findClient } from "../../../_mock";
import { Screen, TopBar } from "../../../_components/ui";
import { DeleteSteps } from "./DeleteSteps";

// C-10 삭제 확인 · C-11 완전히 지우기 (LAW-8: 지우기 전에 기관 시스템에 옮겼는지 확인)
export default async function DeleteClientPage({ params, searchParams }: PageProps<"/v1120/client/[id]/delete">) {
  const { id } = await params;
  const { step } = await searchParams;
  const c = findClient(id);
  if (!c) notFound();
  return (
    <Screen>
      <TopBar backHref={step === "permanent" ? "/v1120/clients" : `/v1120/client/${id}`} />
      <DeleteSteps name={c.name} permanent={step === "permanent"} />
    </Screen>
  );
}
