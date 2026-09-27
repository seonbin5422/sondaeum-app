import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Callout } from "@/app/components/ui/Card";
import { SentActions } from "@/app/components/SentActions";

export const dynamic = "force-dynamic";

export default async function SentPage({ params }: PageProps<"/visit/[id]/sent">) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { report: true, client: true },
  });

  if (!visit) notFound();
  if (!visit.report || visit.status !== "SENT") redirect(`/visit/${id}/review`);

  const guardianPath = `/g/${visit.report.shareToken}`;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http:" : "https:";
  const guardianUrl = host ? `${protocol}//${host}${guardianPath}` : guardianPath;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="text-6xl">✅</div>
      <h1 className="text-2xl font-bold">공유하기</h1>
      <Callout>보호자님께 방문 보고서를 전달해주세요.</Callout>

      <SentActions
        url={guardianUrl}
        guardianPath={guardianPath}
        title="손다음 방문 보고서"
        text={`${visit.client.name} 방문 보고서를 확인해주세요.`}
      />
    </div>
  );
}
