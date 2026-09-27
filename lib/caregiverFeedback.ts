import { safeDecryptText } from "@/lib/crypto";

const FLAG_LABELS = {
  mealsMissing: "식사",
  medicationMissing: "복약",
  notesMissing: "특이사항",
  healthStatusMissing: "건강상태",
  bloodPressureMissing: "혈압",
  urinationMissing: "배뇨",
  defecationMissing: "배변",
} as const;

type FlagKey = keyof typeof FLAG_LABELS;
const FLAG_KEYS = Object.keys(FLAG_LABELS) as FlagKey[];

export function buildCaregiverFeedback(rawJsons: (string | null)[]): string {
  const counts: Record<FlagKey, number> = {
    mealsMissing: 0,
    medicationMissing: 0,
    notesMissing: 0,
    healthStatusMissing: 0,
    bloodPressureMissing: 0,
    urinationMissing: 0,
    defecationMissing: 0,
  };
  let consideredCount = 0;

  for (const rawJson of rawJsons) {
    if (!rawJson) continue;
    try {
      const flags = JSON.parse(safeDecryptText(rawJson));
      consideredCount += 1;
      for (const key of FLAG_KEYS) {
        if (Boolean(flags[key])) counts[key] += 1;
      }
    } catch {
      // 이전 형식이거나 파싱 실패한 기록은 건너뜀
    }
  }

  if (consideredCount === 0) {
    return "아직 작성하신 방문 기록이 없어요. 방문 기록을 남기면 AI가 작성 패턴을 알려드릴게요.";
  }

  const topFlags = FLAG_KEYS.filter((key) => counts[key] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 2);

  if (topFlags.length === 0) {
    return "최근 방문 기록에서 빠뜨린 항목이 없었어요! 꼼꼼하게 작성하고 계시네요.";
  }

  if (topFlags.length === 1) {
    const label = FLAG_LABELS[topFlags[0]];
    return `최근 기록을 보면 ${label} 항목을 자주 빠뜨리셨어요. 다음 방문 때 조금만 더 챙겨보시면 완벽할 것 같아요!`;
  }

  const [labelA, labelB] = topFlags.map((key) => FLAG_LABELS[key]);
  return `최근 기록에서 ${labelA}와 ${labelB} 항목이 자주 빠져 있었어요. 두 가지만 더 신경 쓰시면 기록이 훨씬 알아보기 쉬워질 거예요!`;
}
