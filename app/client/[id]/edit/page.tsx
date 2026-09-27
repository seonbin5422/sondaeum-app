import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/app/components/ui/Button";
import { Field, SelectField } from "@/app/components/ui/Field";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ScheduleField } from "@/app/components/ui/ScheduleField";
import { GUARDIAN_RELATION_OPTIONS, isCustomGuardianRelation } from "@/lib/guardianRelation";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: PageProps<"/client/[id]/edit">) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) notFound();

  const isCustom = isCustomGuardianRelation(client.guardianRelation);
  const selectedRelation = isCustom ? "기타" : client.guardianRelation;
  const customPrefill = isCustom ? client.guardianRelation : "";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title="수급자 정보 수정" backHref="/" />

      <form action={`/api/clients/${id}/update`} method="POST" className="flex flex-col gap-5">
        <Field label="수급자 성함" name="name" required defaultValue={client.name} />

        <Field
          label="나이"
          name="age"
          type="number"
          min={0}
          defaultValue={client.age ?? ""}
          placeholder="예: 82"
        />

        <SelectField label="성별" name="gender" defaultValue={client.gender ?? ""}>
          <option value="" disabled>
            선택
          </option>
          <option value="여성">여성</option>
          <option value="남성">남성</option>
        </SelectField>

        <Field
          label="알레르기 여부"
          name="allergies"
          defaultValue={client.allergies ?? ""}
          placeholder="예: 페니실린, 없음"
        />

        <Field
          label="현재 병력"
          name="medicalHistory"
          defaultValue={client.medicalHistory ?? ""}
          placeholder="예: 고혈압, 당뇨"
        />

        <Field
          label="복용약명 메모"
          name="medicationNotes"
          defaultValue={client.medicationNotes ?? ""}
          placeholder="예: 혈압약, 당뇨약"
        />

        <Field
          label="요양인정번호"
          name="careRegistrationNumber"
          defaultValue={client.careRegistrationNumber ?? ""}
          placeholder="예: L1234567890"
        />

        <Field
          label="연락처"
          name="phone"
          defaultValue={client.phone ?? ""}
          placeholder="010-0000-0000"
        />

        <Field label="보호자 성함" name="guardianName" required defaultValue={client.guardianName} />

        <SelectField label="수급자와의 관계" name="guardianRelation" defaultValue={selectedRelation}>
          {GUARDIAN_RELATION_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="기타">기타</option>
        </SelectField>

        <label className="flex flex-col gap-2 text-base text-muted">
          목록에 없다면 여기에 직접 적어주세요 (선택)
          <input
            name="guardianRelationCustom"
            defaultValue={customPrefill}
            placeholder="예: 며느리, 조카"
            className="h-12 rounded-xl border border-border bg-background px-4 text-base"
          />
        </label>

        <ScheduleField defaultValue={client.scheduleLabel ?? ""} />

        <Button type="submit">저장하기</Button>
      </form>

      <div className="mt-4 border-t border-border pt-4 text-center">
        <Link href={`/client/${id}/delete-confirm`} className="text-sm text-record underline">
          정보 삭제하기
        </Link>
      </div>
    </div>
  );
}
