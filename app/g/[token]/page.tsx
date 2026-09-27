import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { safeDecryptText } from "@/lib/crypto";
import { Card, Callout } from "@/app/components/ui/Card";
import { ReportSection } from "@/app/components/ReportSection";

export const dynamic = "force-dynamic";

export default async function GuardianPage({ params }: PageProps<"/g/[token]">) {
  const { token } = await params;

  const report = await prisma.report.findUnique({
    where: { shareToken: token },
    include: { visit: { include: { client: true } } },
  });

  if (!report || !report.sentAt) notFound();

  const isFirstView = !report.viewedAt;

  await prisma.report.update({
    where: { id: report.id },
    data: {
      viewCount: { increment: 1 },
      viewedAt: report.viewedAt ?? new Date(),
    },
  });

  const visitDate = (report.visit.endedAt ?? report.visit.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-6">
      <div>
        <p className="text-muted text-base">안녕하세요, {report.visit.client.guardianName}님</p>
        <h1 className="text-2xl font-bold">{report.visit.client.name} 방문 보고서</h1>
        <p className="text-muted mt-1 text-base">{visitDate} 방문</p>
      </div>

      {isFirstView && (
        <Callout>손다음이 방문 중 말씀을 정리해 전달해드리는 보고서입니다.</Callout>
      )}

      <ReportSection icon="🍚" label="식사" value={safeDecryptText(report.meals)} readOnly />
      <ReportSection icon="💊" label="복약" value={safeDecryptText(report.medication)} readOnly />
      <ReportSection icon="📝" label="특이사항" value={safeDecryptText(report.notes)} readOnly />

      <Card className="text-muted text-sm">
        요양보호사가 작성 및 검토한 보고서입니다. 문의사항은 담당 기관으로 연락해주세요.
      </Card>
    </div>
  );
}
