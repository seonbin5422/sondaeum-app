import { notFound, redirect } from "next/navigation";
import { myVisit } from "../../../_data";
import { SentScreen } from "./SentScreen";

// C-16 보호자에게 보내기 (와이어 263:334)
export default async function SentPage({ params }: PageProps<"/v1120/visit/[id]/sent">) {
  const { id } = await params;
  const v = await myVisit(id);
  if (!v) notFound();
  if (v.status !== "SENT" || !v.shareToken) redirect(`/v1120/visit/${id}/confirm`);
  return <SentScreen shareToken={v.shareToken} clientName={v.client.name} guardianName={v.client.guardianName} date={v.time.date} />;
}
