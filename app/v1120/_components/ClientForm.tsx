"use client";

import { useState } from "react";
import { CARE_GRADES, FAMILY_RELATIONS, NO_CONTACT, STAFF_RELATIONS, type ClientProfile } from "../_types";
import { saveClient } from "../_actions";
import { Button, Field } from "./ui";

// C-07 등록 · C-08 수정 공용 폼. 저장은 서버 액션 saveClient.
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function ClientForm({ initial, submitLabel }: { initial?: ClientProfile; submitLabel: string }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [guardian, setGuardian] = useState(initial?.guardianName ?? "");
  const [relation, setRelation] = useState(initial?.guardianRelation ?? "");
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone ?? "");
  const [days, setDays] = useState<number[]>(initial?.scheduleDays ?? []);
  const [grade, setGrade] = useState<string | null>(initial?.careGrade ?? null);
  const [careNo, setCareNo] = useState(initial?.careRegistrationNumber ?? "");
  const noContact = relation === NO_CONTACT;

  const missing = !name
    ? "수급자 이름을 적어 주세요"
    : !careNo.trim()
      ? "장기요양인정번호를 적어 주세요"
      : !guardian && !noContact
        ? "보호자 성함을 적어 주세요"
        : days.length === 0
          ? "방문 요일을 골라 주세요"
          : null;

  return (
    <form className="flex flex-col gap-5" action={saveClient}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {grade && <input type="hidden" name="careGrade" value={grade} />}
      {relation && <input type="hidden" name="guardianRelation" value={relation} />}
      {days.map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}
      <Field label="수급자 이름 (필수)" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길순" />
      <Field
        label="장기요양인정번호 (필수)"
        name="careRegistrationNumber"
        value={careNo}
        onChange={(e) => setCareNo(e.target.value)}
        placeholder="예: L1234567890"
        hint="장기요양인정서에 적힌 번호예요."
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="나이" name="age" inputMode="numeric" defaultValue={initial?.age ?? ""} placeholder="예: 82" />
        <Field label="성별" name="gender" defaultValue={initial?.gender ?? ""} placeholder="여 / 남" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">장기요양등급</legend>
        <div className="grid grid-cols-3 gap-2">
          {CARE_GRADES.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={grade === g}
              onClick={() => setGrade(g)}
              className={`min-h-12 rounded-xl text-base font-bold ${grade === g ? "bg-accent" : "border border-border"}`}
            >
              {g}
            </button>
          ))}
        </div>
        <span className="text-base text-muted">장기요양인정서에 적힌 등급이에요. 모르면 비워 두세요.</span>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">방문 요일 (필수)</legend>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(i)}
              onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}
              className={`h-12 w-12 rounded-full text-lg font-bold ${days.includes(i) ? "bg-accent" : "border border-border"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="시작 시간" name="start" type="time" required defaultValue={initial?.scheduleLabel.match(/(\d\d:\d\d)–/)?.[1] ?? "09:00"} />
        <Field label="끝 시간" name="end" type="time" required defaultValue={initial?.scheduleLabel.match(/–(\d\d:\d\d)/)?.[1] ?? "11:00"} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-bold">보호자</legend>
        <p className="mb-2 text-base text-muted">가족이 없으시면 기관 사회복지사나 주민센터 담당자를 골라 주세요.</p>
        {[FAMILY_RELATIONS, [...STAFF_RELATIONS, NO_CONTACT]].map((group, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            {group.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={relation === r}
                onClick={() => setRelation(r)}
                className={`min-h-12 rounded-xl px-4 text-base font-bold ${relation === r ? "bg-accent" : "border border-border"}`}
              >
                {r}
              </button>
            ))}
          </div>
        ))}
      </fieldset>

      {noContact ? (
        <p className="rounded-xl bg-(--neutral-soft) px-4 py-3 text-base">보고서를 보내지 않고 방문 기록과 서류로만 남겨요. 보호자가 생기면 정보 수정에서 바꿀 수 있어요.</p>
      ) : (
        <>
          <Field label="보호자 성함 (필수)" name="guardianName" value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="예: 김○○" />
          <Field
            label="보호자 전화번호"
            name="guardianPhone"
            inputMode="tel"
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            placeholder="예: 010-0000-0000"
            hint="등록하면 이 번호로 대화방에 초대할 수 있어요."
          />
        </>
      )}

      <Field label="알레르기" name="allergies" defaultValue={initial?.allergies ?? ""} placeholder="없으면 비워 두세요" />
      <Field label="병력" name="medicalHistory" defaultValue={initial?.medicalHistory ?? ""} placeholder="예: 고혈압" />
      <Field label="복용 중인 약" name="medicationNotes" defaultValue={initial?.medicationNotes ?? ""} placeholder="예: 혈압약(아침)" />
      <Field label="수급자 전화번호" name="phone" inputMode="tel" defaultValue={initial?.phone ?? ""} placeholder="예: 010-0000-0000" />

      <Button type="submit" disabled={!!missing} disabledReason={missing ?? undefined}>
        {submitLabel}
      </Button>
    </form>
  );
}
