import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LinkButton, Button } from "@/app/components/ui/Button";
import { Callout } from "@/app/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function PermanentDeleteConfirmPage({
  params,
}: PageProps<"/client/[id]/permanent-delete-confirm">) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) notFound();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">정말 영구 삭제하시겠어요?</h1>
      <Callout>
        {client.name}과(와) 관련된 모든 방문 기록·보고서가 완전히 삭제되며, 이 작업은 되돌릴 수
        없어요.
      </Callout>

      <LinkButton href="/clients/manage" variant="primary">
        아니요, 돌아갈게요
      </LinkButton>

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted">그래도 영구 삭제해야 한다면</p>
        <form action={`/api/clients/${id}/permanent-delete`} method="POST">
          <Button type="submit" variant="danger" className="!h-11 !w-auto px-8 !text-base">
            영구삭제하기
          </Button>
        </form>
      </div>
    </div>
  );
}
