"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { CARE_GRADES, FAMILY_RELATIONS, NO_CONTACT, STAFF_RELATIONS, type ClientProfile } from "../_types";
import { saveClient } from "../_actions";
import { Button, Field, selectChipClass } from "./ui";

// C-07 등록 · C-08 수정 공용 폼 (Figma 558:1696). 저장은 서버 액션 saveClient.
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const GENDERS = ["여", "남"];
const RELATIONS = [...FAMILY_RELATIONS, ...STAFF_RELATIONS, NO_CONTACT];

function Group({ title, i, children }: { title: string; i: number; children: ReactNode }) {
  return (
    // 흰 바탕 위 묶음이라 상자 없이 위아래 여백만 둔다 (Figma 기본 정보 등: 흰 면 p-20)
    <section className="enter flex flex-col gap-5 py-5" style={{ "--i": i } as CSSProperties}>
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

// 공통/선택 칩 한 줄. 누르면 바로 모양이 바뀐다
function Chips({ legend, hint, options, isOn, onPick }: {
  legend: string;
  hint?: string;
  options: readonly string[];
  isOn: (v: string) => boolean;
  onPick: (v: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-lg font-bold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={isOn(o)} onClick={() => onPick(o)} className={`${selectChipClass(isOn(o))} whitespace-nowrap`}>
            {o}
          </button>
        ))}
      </div>
      {hint && <span className="text-base text-muted">{hint}</span>}
    </fieldset>
  );
}

export function ClientForm({ initial, submitLabel }: { initial?: ClientProfile; submitLabel: string }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [guardian, setGuardian] = useState(initial?.guardianName ?? "");
  const [relation, setRelation] = useState(initial?.guardianRelation ?? "");
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone ?? "");
  const [days, setDays] = useState<number[]>(initial?.scheduleDays ?? []);
  const [grade, setGrade] = useState<string | null>(initial?.careGrade ?? null);
  const [gender, setGender] = useState(initial?.gender ?? "");
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
    <form className="flex flex-col gap-3 pt-1" action={saveClient}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {grade && <input type="hidden" name="careGrade" value={grade} />}
      {gender && <input type="hidden" name="gender" value={gender} />}
      {relation && <input type="hidden" name="guardianRelation" value={relation} />}
      {days.map((d) => (
        <input key={d} type="hidden" name="days" value={d} />
      ))}

      <Group title="기본 정보" i={0}>
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
          {/* 다시 누르면 고른 것을 푼다 (모르면 비워 둠) */}
          <Chips legend="성별" options={GENDERS} isOn={(g) => gender === g} onPick={(g) => setGender(gender === g ? "" : g)} />
        </div>
        <Chips
          legend="장기요양등급"
          hint="장기요양인정서에 적힌 등급이에요. 모르면 비워 두세요."
          options={CARE_GRADES}
          isOn={(g) => grade === g}
          onPick={(g) => setGrade(grade === g ? null : g)}
        />
      </Group>

      <Group title="방문 일정" i={1}>
        <Chips
          legend="방문 요일 (필수)"
          options={DAYS}
          isOn={(d) => days.includes(DAYS.indexOf(d))}
          onPick={(d) => {
            const i = DAYS.indexOf(d);
            setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i]);
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작 시간" name="start" type="time" required defaultValue={initial?.scheduleLabel.match(/(\d\d:\d\d)–/)?.[1] ?? "09:00"} />
          <Field label="끝 시간" name="end" type="time" required defaultValue={initial?.scheduleLabel.match(/–(\d\d:\d\d)/)?.[1] ?? "11:00"} />
        </div>
      </Group>

      <Group title="보호자" i={2}>
        {!noContact && (
          <Field label="보호자 성함 (필수)" name="guardianName" value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="예: 김○○" />
        )}
        <Chips
          legend="수급자와의 관계"
          options={RELATIONS}
          isOn={(r) => relation === r}
          onPick={setRelation}
        />
        {noContact ? (
          <p className="rounded-xl bg-(--bg-secondary) px-4 py-3 text-base">
            보고서를 보내지 않고 방문 기록과 서류로만 남겨요. 보호자가 생기면 <span className="whitespace-nowrap">정보 수정에서</span> 바꿀 수 있어요.
          </p>
        ) : (
          <Field
            label="보호자 연락처"
            name="guardianPhone"
            inputMode="tel"
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        )}
      </Group>

      <Group title="건강 정보" i={3}>
        <Field label="꼭 기억할 것" name="personalNotes" defaultValue={initial?.personalNotes ?? ""} placeholder="예: 계단 이동 때 부축" />
        <Field label="알레르기" name="allergies" defaultValue={initial?.allergies ?? ""} placeholder="없으면 비워 두세요" />
        <Field label="병력" name="medicalHistory" defaultValue={initial?.medicalHistory ?? ""} placeholder="예: 고혈압" />
        <Field label="복용 중인 약" name="medicationNotes" defaultValue={initial?.medicationNotes ?? ""} placeholder="예: 혈압약(아침)" />
        <Field label="수급자 연락처" name="phone" inputMode="tel" defaultValue={initial?.phone ?? ""} placeholder="예: 010-0000-0000" />
      </Group>

      {/* 아래 버튼 (Figma 아래 버튼): 스크롤해도 화면 아래에 붙어 있다 */}
      <div className="sticky bottom-0 -mx-5 -mb-5 bg-white px-5 pb-6 pt-4">
        <Button type="submit" disabled={!!missing} disabledReason={missing ?? undefined}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
