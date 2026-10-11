import { notFound, redirect } from "next/navigation";
import { myVisit } from "../../../_data";
import { ConfirmScreen } from "./ConfirmScreen";

// C-15 보낼 내용 보기 (와이어 263:308)
export default async function ConfirmPage({ params }: PageProps<"/v1120/visit/[id]/confirm">) {
  const { id } = await params;
  const v = await myVisit(id);
  if (!v) notFound();
  if (v.status === "SENT") redirect(`/v1120/visit/${id}/sent`);
  if (!v.record) redirect(`/v1120/visit/${id}/processing`);
  return <ConfirmScreen id={id} record={v.record} />;
}
