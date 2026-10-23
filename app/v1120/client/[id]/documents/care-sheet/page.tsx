import { notFound } from "next/navigation";
import { CareSheetView } from "../../../../_components/DocumentViews";
import { kstYmd, myClient, myHistory, requireCaregiver } from "../../../../_data";

// 서류 · 급여제공기록지 (날짜마다 한 장)
export default async function Page({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/care-sheet">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const c = await myClient(id);
  if (!c) notFound();
  const today = kstYmd();
  return (
    <CareSheetView
      client={c}
      history={await myHistory(id)}
      caregiverName={(await requireCaregiver()).name}
      today={today}
      from={String(from ?? today)}
      to={String(to ?? today)}
      backHref={`/v1120/client/${id}/documents`}
      role="caregiver"
    />
  );
}
