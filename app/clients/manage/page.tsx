import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ClientManageRow } from "@/app/components/ClientManageRow";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";

export const dynamic = "force-dynamic";

export default async function ManageClientsPage() {
  await purgeExpiredClients();
  const clients = await prisma.client.findMany({
    where: { purgeAt: null },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title="전체수급자 관리" backHref="/" />

      <div className="flex flex-col gap-4">
        {clients.length === 0 ? (
          <p className="text-muted text-base">등록된 수급자가 없습니다.</p>
        ) : (
          clients.map((c) => (
            <ClientManageRow
              key={c.id}
              id={c.id}
              name={c.name}
              isActive={c.isActive}
              careRegistrationNumber={c.careRegistrationNumber}
            />
          ))
        )}
      </div>
    </div>
  );
}
