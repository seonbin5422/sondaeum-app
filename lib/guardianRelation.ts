export const GUARDIAN_RELATION_OPTIONS = ["아들", "딸", "배우자"] as const;

export function isCustomGuardianRelation(relation: string): boolean {
  return !GUARDIAN_RELATION_OPTIONS.includes(
    relation as (typeof GUARDIAN_RELATION_OPTIONS)[number]
  );
}

export function formatGuardianName(guardianName: string, guardianRelation: string): string {
  return `${guardianName} (${guardianRelation})`;
}
