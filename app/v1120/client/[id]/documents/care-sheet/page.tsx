import { CareSheetView } from "../../../../_components/DocumentViews";

// 서류 · 급여제공기록지 (날짜마다 한 장)
export default async function CareSheetPage({ params, searchParams }: PageProps<"/v1120/client/[id]/documents/care-sheet">) {
  const { id } = await params;
  const { from, to } = await searchParams;
  return <CareSheetView clientId={id} from={String(from ?? "2026-10-08")} to={String(to ?? "2026-10-08")} backHref={`/v1120/client/${id}/documents`} role="caregiver" />;
}
