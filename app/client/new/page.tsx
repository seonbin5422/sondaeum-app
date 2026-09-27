import { Button } from "@/app/components/ui/Button";
import { Field, SelectField } from "@/app/components/ui/Field";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ScheduleField } from "@/app/components/ui/ScheduleField";
import { GUARDIAN_RELATION_OPTIONS } from "@/lib/guardianRelation";

export default function NewClientPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <PageHeader title="돌봄 추가하기" backHref="/" />

      <form action="/api/clients" method="POST" className="flex flex-col gap-5">
        <Field label="수급자 성함" name="name" required placeholder="예: 박말순" />

        <Field label="나이" name="age" type="number" min={0} placeholder="예: 82" />

        <SelectField label="성별" name="gender" defaultValue="">
          <option value="" disabled>
            선택
          </option>
          <option value="여성">여성</option>
          <option value="남성">남성</option>
        </SelectField>

        <Field label="알레르기 여부" name="allergies" placeholder="예: 페니실린, 없음" />

        <Field label="현재 병력" name="medicalHistory" placeholder="예: 고혈압, 당뇨" />

        <Field label="복용약명 메모" name="medicationNotes" placeholder="예: 혈압약, 당뇨약" />

        <Field
          label="요양인정번호"
          name="careRegistrationNumber"
          placeholder="예: L1234567890"
        />

        <Field label="연락처" name="phone" placeholder="010-0000-0000" />

        <Field label="보호자 성함" name="guardianName" required placeholder="예: 박현우" />

        <SelectField
          label="수급자와의 관계"
          name="guardianRelation"
          defaultValue={GUARDIAN_RELATION_OPTIONS[0]}
        >
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
            placeholder="예: 며느리, 조카"
            className="h-12 rounded-xl border border-border bg-background px-4 text-base"
          />
        </label>

        <ScheduleField />

        <Button type="submit">등록하기</Button>
      </form>
    </div>
  );
}
