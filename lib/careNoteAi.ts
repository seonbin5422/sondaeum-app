import Groq from "groq-sdk";
import { redactPii } from "@/lib/pii";
import { cleanEnv } from "@/lib/env";

const groq = new Groq({ apiKey: cleanEnv(process.env.GROQ_API_KEY) });

const CARE_REPORT_SCHEMA = {
  type: "object",
  properties: {
    meals: {
      type: "string",
      description: "식사 관련 내용 요약. 언급이 없으면 '특이 언급 없음'",
    },
    medication: {
      type: "string",
      description: "복약 관련 내용 요약. 언급이 없으면 '특이 언급 없음'",
    },
    notes: {
      type: "string",
      description: "건강 상태, 혈압, 배뇨, 배변, 정서, 기타 특이사항 요약",
    },
    mealsMissing: {
      type: "boolean",
      description:
        "식사 여부·식사량에 대한 언급이 전혀 없거나 너무 모호해서 가족에게 그대로 전달하기 부족하면 true, 충분히 확인됐으면 false",
    },
    medicationMissing: {
      type: "boolean",
      description:
        "복약 여부나 횟수에 대한 언급이 전혀 없거나 모호하면 true, 충분히 확인됐으면 false. 요양보호사가 의도적으로 언급하지 않았을 수도 있으니 추측하지 말고 발화 내용만으로 판단",
    },
    notesMissing: {
      type: "boolean",
      description: "건강 상태·정서 등 기타 특이사항에 대한 언급이 전혀 없으면 true, 확인됐으면 false",
    },
    healthStatusMissing: {
      type: "boolean",
      description: "전반적인 건강상태·컨디션에 대한 언급이 전혀 없으면 true, 확인됐으면 false",
    },
    bloodPressureMissing: {
      type: "boolean",
      description: "혈압 수치나 혈압 관련 언급이 전혀 없으면 true, 확인됐으면 false",
    },
    urinationMissing: {
      type: "boolean",
      description: "배뇨(소변) 관련 언급이 전혀 없으면 true, 확인됐으면 false",
    },
    defecationMissing: {
      type: "boolean",
      description: "배변(대변) 관련 언급이 전혀 없으면 true, 확인됐으면 false",
    },
    medicationMorning: {
      type: "boolean",
      description: "아침 복약을 했다는 언급이 있으면 true, 아니면 false",
    },
    medicationLunch: {
      type: "boolean",
      description: "점심 복약을 했다는 언급이 있으면 true, 아니면 false",
    },
    medicationEvening: {
      type: "boolean",
      description: "저녁 복약을 했다는 언급이 있으면 true, 아니면 false",
    },
    medicationBedtime: {
      type: "boolean",
      description: "취침전 복약을 했다는 언급이 있으면 true, 아니면 false",
    },
    medicationNone: {
      type: "boolean",
      description:
        "복약을 하지 않았다는 언급이 있거나, 복약에 대한 언급이 전혀 없으면 true. 아침/점심/저녁/취침전 중 하나라도 복용했다는 언급이 있으면 반드시 false",
    },
  },
  required: [
    "meals",
    "medication",
    "notes",
    "mealsMissing",
    "medicationMissing",
    "notesMissing",
    "healthStatusMissing",
    "bloodPressureMissing",
    "urinationMissing",
    "defecationMissing",
    "medicationMorning",
    "medicationLunch",
    "medicationEvening",
    "medicationBedtime",
    "medicationNone",
  ],
  additionalProperties: false,
};

export interface CareNoteDraft {
  meals: string;
  medication: string;
  notes: string;
  mealsMissing: boolean;
  medicationMissing: boolean;
  notesMissing: boolean;
  healthStatusMissing: boolean;
  bloodPressureMissing: boolean;
  urinationMissing: boolean;
  defecationMissing: boolean;
  medicationMorning: boolean;
  medicationLunch: boolean;
  medicationEvening: boolean;
  medicationBedtime: boolean;
  medicationNone: boolean;
}

export async function classifyCareNote(transcript: string): Promise<CareNoteDraft> {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "당신은 요양보호사의 방문 기록 음성을 정리하는 도우미입니다. " +
          "주어진 발화 내용을 읽고 식사, 복약, 특이사항(건강상태·혈압·배뇨·배변 포함) 세 가지 " +
          "항목으로 간결하고 사실에 기반하여 정리하세요. 언급되지 않은 내용은 추측하지 말고 " +
          "'특이 언급 없음'이라고 표기하세요. 그리고 식사/복약/특이사항 및 그 하위 항목(건강상태, " +
          "혈압, 배뇨, 배변)이 실제로 언급됐는지 여부를 각각의 Missing 값으로 표시하세요. " +
          "복약은 아침/점심/저녁/취침전 중 실제로 복용했다고 언급된 시간대만 true로 표시하고, " +
          "복용하지 않았거나 복약 언급 자체가 없으면 medicationNone을 true로 표시하세요.",
      },
      { role: "user", content: transcript },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "care_report",
        strict: true,
        schema: CARE_REPORT_SCHEMA,
      },
    },
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error("AI 응답이 비어 있습니다.");
  }
  const rawDraft = JSON.parse(text) as CareNoteDraft;

  const [meals, medication, notes] = await Promise.all([
    redactPii(rawDraft.meals),
    redactPii(rawDraft.medication),
    redactPii(rawDraft.notes),
  ]);

  return {
    ...rawDraft,
    meals,
    medication,
    notes,
  };
}
