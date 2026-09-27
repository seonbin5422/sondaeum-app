import Link from "next/link";
import { Avatar } from "@/app/components/ui/Avatar";
import { Card } from "@/app/components/ui/Card";
import { Chip } from "@/app/components/ui/Chip";

export function ClientManageRow({
  id,
  name,
  isActive,
  careRegistrationNumber,
}: {
  id: string;
  name: string;
  isActive: boolean;
  careRegistrationNumber: string | null;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={name} className="h-[56px] w-[56px]" />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-bold">{name}</p>
              {careRegistrationNumber && <Chip variant="outline">{careRegistrationNumber}</Chip>}
              {!isActive && <Chip variant="muted">비활성</Chip>}
            </div>
          </div>
        </div>
        <Link
          href={`/client/${id}/permanent-delete-confirm`}
          className="shrink-0 text-sm text-record underline"
        >
          영구삭제
        </Link>
      </div>
      <div className="flex gap-3">
        <Link
          href={`/client/${id}/edit`}
          className="flex h-14 flex-1 items-center justify-center rounded-[15px] bg-gray-100 text-lg font-semibold text-muted active:bg-gray-200"
        >
          수정
        </Link>
        {isActive ? (
          <Link
            href={`/client/${id}/delete-confirm`}
            className="flex h-14 flex-1 items-center justify-center rounded-[15px] bg-record text-lg font-semibold text-white active:bg-red-700"
          >
            삭제
          </Link>
        ) : (
          <form action={`/api/clients/${id}/restore`} method="POST" className="flex-1">
            <button
              type="submit"
              className="h-14 w-full rounded-[15px] bg-accent text-lg font-semibold text-accent-foreground active:bg-accent-dark"
            >
              복구
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}
