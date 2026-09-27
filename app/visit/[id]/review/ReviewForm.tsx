"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ReportSection } from "@/app/components/ReportSection";

function MedicationCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-base text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 accent-accent"
      />
      {label}
    </label>
  );
}

export function ReviewForm({
  visitId,
  reportId,
  transcript,
  initialMeals,
  initialMedication,
  initialNotes,
  initialMealsMissing,
  initialMedicationMissing,
  initialNotesMissing,
  initialHealthStatusMissing,
  initialBloodPressureMissing,
  initialUrinationMissing,
  initialDefecationMissing,
  initialMedicationMorning,
  initialMedicationLunch,
  initialMedicationEvening,
  initialMedicationBedtime,
  initialMedicationNone,
}: {
  visitId: string;
  reportId: string;
  transcript: string;
  initialMeals: string;
  initialMedication: string;
  initialNotes: string;
  initialMealsMissing: boolean;
  initialMedicationMissing: boolean;
  initialNotesMissing: boolean;
  initialHealthStatusMissing: boolean;
  initialBloodPressureMissing: boolean;
  initialUrinationMissing: boolean;
  initialDefecationMissing: boolean;
  initialMedicationMorning: boolean;
  initialMedicationLunch: boolean;
  initialMedicationEvening: boolean;
  initialMedicationBedtime: boolean;
  initialMedicationNone: boolean;
}) {
  const router = useRouter();
  const [meals, setMeals] = useState(initialMeals);
  const [medication, setMedication] = useState(initialMedication);
  const [notes, setNotes] = useState(initialNotes);
  const [mealsMissing, setMealsMissing] = useState(initialMealsMissing);
  const [medicationMissing, setMedicationMissing] = useState(initialMedicationMissing);
  const [notesMissing, setNotesMissing] = useState(initialNotesMissing);
  const [healthStatusMissing, setHealthStatusMissing] = useState(initialHealthStatusMissing);
  const [bloodPressureMissing, setBloodPressureMissing] = useState(initialBloodPressureMissing);
  const [urinationMissing, setUrinationMissing] = useState(initialUrinationMissing);
  const [defecationMissing, setDefecationMissing] = useState(initialDefecationMissing);
  const [medicationMorning, setMedicationMorning] = useState(initialMedicationMorning);
  const [medicationLunch, setMedicationLunch] = useState(initialMedicationLunch);
  const [medicationEvening, setMedicationEvening] = useState(initialMedicationEvening);
  const [medicationBedtime, setMedicationBedtime] = useState(initialMedicationBedtime);
  const [medicationNone, setMedicationNone] = useState(initialMedicationNone);
  const [showTranscript, setShowTranscript] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSendWarning, setShowSendWarning] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  function toggleMedicationTime(
    setter: (value: boolean) => void,
    current: boolean
  ) {
    setter(!current);
    if (!current) setMedicationNone(false);
    setMedicationMissing(false);
  }

  function toggleMedicationNone() {
    const next = !medicationNone;
    setMedicationNone(next);
    if (next) {
      setMedicationMorning(false);
      setMedicationLunch(false);
      setMedicationEvening(false);
      setMedicationBedtime(false);
    }
    setMedicationMissing(false);
  }

  function currentReportFields() {
    return {
      meals,
      medication,
      notes,
      medicationMorning,
      medicationLunch,
      medicationEvening,
      medicationBedtime,
      medicationNone,
    };
  }

  async function submitToConfirm() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentReportFields()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "저장에 실패했습니다.");
      }
      router.push(`/visit/${visitId}/confirm`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  async function saveDraft() {
    setSavingDraft(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentReportFields()),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "임시저장에 실패했습니다.");
      }
      setSavingDraft(false);
      setShowDraftSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "임시저장에 실패했습니다.");
      setSavingDraft(false);
    }
  }

  function handleSendClick() {
    if (
      mealsMissing ||
      medicationMissing ||
      notesMissing ||
      healthStatusMissing ||
      bloodPressureMissing ||
      urinationMissing ||
      defecationMissing
    ) {
      setShowSendWarning(true);
      return;
    }
    submitToConfirm();
  }

  const noteMissingLabels = [
    healthStatusMissing && "건강상태",
    bloodPressureMissing && "혈압",
    urinationMissing && "배뇨",
    defecationMissing && "배변",
    notesMissing && "특이사항",
  ].filter((v): v is string => Boolean(v));

  const notesWarning =
    noteMissingLabels.length > 0
      ? `⚠ ${noteMissingLabels.join(", ")} 정보가 확인되지 않았어요`
      : undefined;

  function clearNoteMissing() {
    setNotesMissing(false);
    setHealthStatusMissing(false);
    setBloodPressureMissing(false);
    setUrinationMissing(false);
    setDefecationMissing(false);
  }

  const missingLabels = [
    mealsMissing && "식사",
    medicationMissing && "복약",
    ...noteMissingLabels,
  ].filter((v): v is string => Boolean(v));

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-6">
      <PageHeader title="요양 노트 검토" onBack={() => router.back()} />
      <p className="text-base">
        AI가 정리한 초안입니다. 내용을 확인하고 필요한 부분을 수정해주세요.
      </p>

      <ReportSection
        icon="🍚"
        label="식사"
        value={meals}
        onChange={(v) => {
          setMeals(v);
          setMealsMissing(false);
        }}
        warning={mealsMissing ? "⚠ 식사 여부가 확인되지 않았어요" : undefined}
      />
      <ReportSection
        icon="💊"
        label="복약"
        value={medication}
        onChange={(v) => {
          setMedication(v);
          setMedicationMissing(false);
        }}
        warning={medicationMissing ? "⚠ 약물 복용 여부·횟수가 확인되지 않았어요" : undefined}
        extra={
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
            <MedicationCheckbox
              label="아침 복용"
              checked={medicationMorning}
              onChange={() => toggleMedicationTime(setMedicationMorning, medicationMorning)}
            />
            <MedicationCheckbox
              label="점심 복용"
              checked={medicationLunch}
              onChange={() => toggleMedicationTime(setMedicationLunch, medicationLunch)}
            />
            <MedicationCheckbox
              label="저녁 복용"
              checked={medicationEvening}
              onChange={() => toggleMedicationTime(setMedicationEvening, medicationEvening)}
            />
            <MedicationCheckbox
              label="취침전 복용"
              checked={medicationBedtime}
              onChange={() => toggleMedicationTime(setMedicationBedtime, medicationBedtime)}
            />
            <MedicationCheckbox
              label="복약 안함"
              checked={medicationNone}
              onChange={toggleMedicationNone}
            />
          </div>
        }
      />
      <ReportSection
        icon="📝"
        label="특이사항"
        value={notes}
        onChange={(v) => {
          setNotes(v);
          clearNoteMissing();
        }}
        placeholder="예: 혈압 128/82, 소변/대변 정상, 복약 거부·부작용 등 복약 관련 특이사항도 함께 적어주세요"
        warning={notesWarning}
      />

      <Card>
        <button
          onClick={() => setShowTranscript((v) => !v)}
          className="w-full text-left text-base font-semibold text-accent-soft-foreground"
        >
          {showTranscript ? "▲ 원본 음성 전사 숨기기" : "▼ 원본 음성 전사 보기"}
        </button>
        {showTranscript && (
          <p className="mt-3 whitespace-pre-wrap text-base text-muted">{transcript}</p>
        )}
      </Card>

      {saveError && <p className="text-record text-base font-semibold">{saveError}</p>}

      <Button variant="secondary" onClick={saveDraft} disabled={saving || savingDraft}>
        {savingDraft ? "임시저장 중..." : "임시저장"}
      </Button>

      <Button onClick={handleSendClick} disabled={saving || savingDraft}>
        {saving ? "저장 중..." : "보호자에게 전송"}
      </Button>

      {showSendWarning && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-card p-6 shadow-lg">
            <p className="text-lg font-bold text-foreground">
              {missingLabels.join(", ")} 항목을 확인하지 않았어요
            </p>
            <p className="text-base text-muted">해당 내용을 수정하지 않고 보낼까요?</p>
            <Button variant="primary" onClick={() => setShowSendWarning(false)}>
              돌아가서 확인할게요
            </Button>
            <Button
              variant="danger"
              disabled={saving}
              onClick={() => {
                setShowSendWarning(false);
                submitToConfirm();
              }}
            >
              네, 그대로 보낼게요
            </Button>
          </div>
        </div>
      )}

      {showDraftSaved && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-card p-6 shadow-lg">
            <p className="text-lg font-bold text-foreground">저장완료</p>
            <p className="text-base text-muted">홈으로 돌아가시겠습니까?</p>
            <Button variant="primary" onClick={() => router.push("/")}>
              홈으로 돌아가기
            </Button>
            <Button variant="secondary" onClick={() => setShowDraftSaved(false)}>
              계속 작성하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
