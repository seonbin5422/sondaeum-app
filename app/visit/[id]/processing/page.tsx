import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProcessingScreen } from "./ProcessingScreen";

export const dynamic = "force-dynamic";

export default async function ProcessingPage({ params }: PageProps<"/visit/[id]/processing">) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({ where: { id } });

  if (!visit) notFound();
  if (visit.status === "DRAFT_READY" || visit.status === "SENT") {
    redirect(`/visit/${id}/review`);
  }
  if (visit.status === "NOT_STARTED" || visit.status === "RECORDING") {
    redirect(`/visit/${id}/record`);
  }

  return <ProcessingScreen visitId={id} />;
}
