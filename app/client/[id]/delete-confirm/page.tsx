import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LinkButton, Button } from "@/app/components/ui/Button";
import { Callout } from "@/app/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function DeleteConfirmPage({
  params,
}: PageProps<"/client/[id]/delete-confirm">) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) notFound();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">정말 삭제하시겠어요?</h1>
      <Callout>
        {client.name}을(를) 목록에서 삭제합니다. 그동안의 방문 기록은 안전하게 보관되니 걱정하지
        않으셔도 돼요.
      </Callout>

      <LinkButton href={`/client/${id}/edit`} variant="primary">
        아니요, 돌아갈게요
      </LinkButton>

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted">그래도 삭제해야 한다면</p>
        <form action={`/api/clients/${id}/delete`} method="POST">
          <Button type="submit" variant="danger" className="!h-11 !w-auto px-8 !text-base">
            삭제하기
          </Button>
        </form>
      </div>
    </div>
  );
}
