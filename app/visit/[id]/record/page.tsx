import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecordScreen } from "./RecordScreen";

export const dynamic = "force-dynamic";

export default async function RecordPage({ params }: PageProps<"/visit/[id]/record">) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!visit) notFound();
  if (visit.status === "DRAFT_READY" || visit.status === "SENT") {
    redirect(`/visit/${id}/review`);
  }
  if (visit.status === "SUMMARIZING") {
    redirect(`/visit/${id}/processing`);
  }

  return <RecordScreen visitId={visit.id} clientName={visit.client.name} />;
}
