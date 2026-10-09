"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARE_GRADES, type ClientProfile } from "../_types";
import { Button, Field } from "./ui";

// C-07 등록 · C-08 수정 공용 폼. 1120.ver 미리보기에서는 저장하지 않고 목록으로 돌아간다.
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const RELATIONS = ["딸", "아들", "배우자", "직접 입력"];

export function ClientForm({ initial, submitLabel }: { initial?: ClientProfile; submitLabel: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [guardian, setGuardian] = useState(initial?.guardianName ?? "");
  const [relation, setRelation] = useState(initial?.guardianRelation ?? "");
  const [days, setDays] = useState<number[]>(initial?.scheduleDays ?? []);
  const [grade, setGrade] = useState<string | null>(initial?.careGrade ?? null);
  const [careNo, setCareNo] = useState(initial?.careRegistrationNumber ?? "");

  const missing = !name
    ? "수급자 이름을 적어 주세요"
    : !careNo.trim()
      ? "장기요양인정번호를 적어 주세요"
      : !guardian
        ? "보호자 성함을 적어 주세요"
        : days.length === 0
          ? "방문 요일을 골라 주세요"
          : null;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(initial ? `/v1120/client/${initial.id}` : "/v1120/clients");
      }}
    >
      <Field label="수급자 이름 (필수)" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길순" />
      <Field
        label="장기요양인정번호 (필수)"
        value={careNo}
        onChange={(e) => setCareNo(e.target.value)}
        placeholder="예: L1234567890"
        hint="장기요양인정서에 적힌 번호예요."
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="나이" inputMode="numeric" defaultValue={initial?.age ?? ""} placeholder="예: 82" />
        <Field label="성별" defaultValue={initial?.gender ?? ""} placeholder="여 / 남" />
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
        <Field label="시작 시간" type="time" defaultValue={initial?.scheduleLabel.match(/(\d\d:\d\d)–/)?.[1] ?? "09:00"} />
        <Field label="끝 시간" type="time" defaultValue={initial?.scheduleLabel.match(/–(\d\d:\d\d)/)?.[1] ?? "11:00"} />
      </div>

      <Field label="보호자 성함 (필수)" value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="예: 김○○" />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-bold">보호자와 수급자의 관계</legend>
        <div className="flex flex-wrap gap-2">
          {RELATIONS.map((r) => (
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
      </fieldset>

      <Field label="알레르기" defaultValue={initial?.allergies ?? ""} placeholder="없으면 비워 두세요" />
      <Field label="병력" defaultValue={initial?.medicalHistory ?? ""} placeholder="예: 고혈압" />
      <Field label="복용 중인 약" defaultValue={initial?.medicationNotes ?? ""} placeholder="예: 혈압약(아침)" />
      <Field label="연락처" inputMode="tel" defaultValue={initial?.phone ?? ""} />

      <p className="text-base text-muted">1120.ver 미리보기에서는 저장되지 않아요.</p>
      <Button type="submit" disabled={!!missing} disabledReason={missing ?? undefined}>
        {submitLabel}
      </Button>
    </form>
  );
}
