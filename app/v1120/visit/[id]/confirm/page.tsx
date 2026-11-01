import { notFound, redirect } from "next/navigation";
import { myVisit } from "../../../_data";
import { ConfirmScreen } from "./ConfirmScreen";
import { contactTitle, NO_CONTACT } from "../../../_types";

// C-15 보낼 내용 보기 (와이어 263:308)
export default async function ConfirmPage({ params, searchParams }: PageProps<"/v1120/visit/[id]/confirm">) {
  const { id } = await params;
  const v = await myVisit(id);
  if (!v) notFound();
  if (v.status === "SENT") redirect(`/v1120/visit/${id}/sent`);
  if (!v.record) redirect(`/v1120/visit/${id}/processing`);
  // 다시 들어온 기록(resume=1)이면 기록 확인으로 돌아갈 때도 그 표시를 지킨다
  const reviewHref = `/v1120/visit/${id}/review${(await searchParams).resume === "1" ? "?resume=1" : ""}`;
  const recipient = v.client.guardianRelation === NO_CONTACT ? null : `${contactTitle(v.client.guardianRelation)}님`;
  return <ConfirmScreen id={id} record={v.record} reviewHref={reviewHref} recipient={recipient} />;
}
