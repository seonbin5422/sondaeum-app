import "server-only";
import { prisma } from "@/lib/prisma";

// SEC-3: AI(Groq) 호출을 요양보호사마다 센다. 한도를 넘으면 false를 돌려주고 부른 쪽이 AI 없이 처리하거나 429로 막는다.
// 체험 계정도 계정마다 따로 센다. 무료 Groq 키의 분당 한도는 따로 있어서 넘으면 Groq가 429를 준다.
export const AI_LIMIT = { perHour: 30, perDay: 100 };
export const AI_LIMIT_MESSAGE = "AI 사용 횟수를 넘었어요. 잠시 뒤에 다시 해 주세요.";

const HOUR = 60 * 60 * 1000;

// shortcut: 세기와 기록 사이가 잠금이 아니라 동시에 몰리면 한두 번 넘칠 수 있다, 남용이 보이면 트랜잭션으로 묶는다
export async function takeAiCall(caregiverId: string, kind: string) {
  const now = Date.now();
  const [hour, day] = await Promise.all([
    prisma.aiUsage.count({ where: { caregiverId, createdAt: { gte: new Date(now - HOUR) } } }),
    prisma.aiUsage.count({ where: { caregiverId, createdAt: { gte: new Date(now - 24 * HOUR) } } }),
  ]);
  if (hour >= AI_LIMIT.perHour || day >= AI_LIMIT.perDay) return false;
  await prisma.aiUsage.create({ data: { caregiverId, kind } });
  return true;
}
