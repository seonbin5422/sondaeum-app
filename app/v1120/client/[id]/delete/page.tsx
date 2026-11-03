import { notFound } from "next/navigation";
import { myClient } from "../../../_data";
import { DeleteSteps } from "./DeleteSteps";

// C-10 삭제 확인 · C-11 완전히 지우기 (LAW-8: 지우기 전에 기관 시스템에 옮겼는지 확인)
export default async function DeleteClientPage({ params, searchParams }: PageProps<"/v1120/client/[id]/delete">) {
  const { id } = await params;
  const { step } = await searchParams;
  const c = await myClient(id);
  if (!c) notFound();
  const permanent = step === "permanent";
  return (
    <DeleteSteps id={c.id} name={c.name} permanent={permanent} backHref={permanent ? "/v1120/clients" : `/v1120/client/${id}`} />
  );
}
