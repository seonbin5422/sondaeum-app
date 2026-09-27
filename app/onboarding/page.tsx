import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { Button } from "@/app/components/ui/Button";
import { Field } from "@/app/components/ui/Field";
import { PageHeader } from "@/app/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { caregiverId } = await verifySession();
  const caregiver = await prisma.caregiver.findUnique({ where: { id: caregiverId } });

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title="요양보호사 정보 등록" />
      <p className="text-base text-muted">
        처음 로그인하셨네요. 이름과 요양사자격번호를 등록해주세요.
      </p>

      <form action="/api/caregivers/onboard" method="POST" className="flex flex-col gap-5">
        <Field label="이름" name="name" required defaultValue={caregiver?.name ?? ""} />
        <Field
          label="요양사자격번호"
          name="licenseNumber"
          placeholder="예: 12-345678"
          defaultValue={caregiver?.licenseNumber ?? ""}
        />
        <Button type="submit">등록하기</Button>
      </form>
    </div>
  );
}
