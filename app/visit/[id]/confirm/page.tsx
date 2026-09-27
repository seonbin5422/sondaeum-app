import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { safeDecryptText } from "@/lib/crypto";
import { Card, Callout } from "@/app/components/ui/Card";
import { Button, LinkButton } from "@/app/components/ui/Button";
import { PageHeader } from "@/app/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: PageProps<"/visit/[id]/confirm">) {
  const { id } = await params;
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { report: true, client: true },
  });

  if (!visit) notFound();
  if (visit.status === "SENT") redirect(`/visit/${id}/sent`);
  if (!visit.report) redirect(`/visit/${id}/record`);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title="전송 확인" backHref={`/visit/${id}/review`} />
      <Callout>
        {visit.client.guardianName}님께 {visit.client.name}의 방문 보고서를 전송합니다. 전송 후에는
        수정할 수 없습니다.
      </Callout>
      <Card className="flex flex-col gap-2 text-lg">
        <p>
          <span className="font-bold">🍚 식사</span> {safeDecryptText(visit.report.meals)}
        </p>
        <p>
          <span className="font-bold">💊 복약</span> {safeDecryptText(visit.report.medication)}
        </p>
        <p>
          <span className="font-bold">📝 특이사항</span> {safeDecryptText(visit.report.notes)}
        </p>
      </Card>

      <form action={`/api/reports/${visit.report.id}/send`} method="POST" className="flex flex-col gap-3">
        <Button type="submit">예, 전송합니다</Button>
      </form>
      <LinkButton href={`/visit/${id}/review`} variant="secondary">
        돌아가서 수정하기
      </LinkButton>
    </div>
  );
}
