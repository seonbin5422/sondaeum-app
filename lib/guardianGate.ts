import "server-only";
import { prisma } from "@/lib/prisma";
import { openPII } from "@/lib/crypto";
import { getSessionCaregiverId, isGuardianVerified, markGuardianVerified } from "@/lib/session";

// 보호자 링크(보고서·서류·게시판 초대)를 연 사람이 보호자 전화번호 끝 4자리를 한 번 맞혀야 건강 기록을 보여 준다.
// 링크가 다른 사람에게 넘어가도 바로 열리지 않게 하는 두 번째 확인. 5번 틀리면 30분 잠근다.
// shortcut: 전화번호를 아는 사람은 통과한다, 보호자 로그인(P1)이 생기면 그걸로 바꾼다
export const GUARDIAN_MAX_FAILS = 5;
const LOCK_MS = 30 * 60_000;

const select = { id: true, caregiverId: true, guardianPhone: true, guardianLockedUntil: true } as const;

async function clientOfToken(token: string) {
  const [r, d, c] = await Promise.all([
    prisma.report.findUnique({ where: { shareToken: token }, select: { sentAt: true, visit: { select: { client: { select } } } } }),
    prisma.sharedDocument.findUnique({ where: { shareToken: token }, select: { client: { select } } }),
    prisma.client.findUnique({ where: { boardToken: token }, select }),
  ]);
  return r?.sentAt ? r.visit.client : (d?.client ?? c);
}

const last4 = (phone: string | null) => (openPII(phone) ?? "").replace(/\D/g, "").slice(-4);

// 확인 없이 보여 줘도 되는지: 맞지 않는 링크(화면이 알아서 막음)·전화번호 없음·보낸 요양보호사 본인·이미 확인한 기기
export async function guardianPassed(token: string): Promise<boolean> {
  const c = await clientOfToken(token);
  if (!c || last4(c.guardianPhone).length < 4) return true;
  if (c.caregiverId && c.caregiverId === (await getSessionCaregiverId())) return true;
  return isGuardianVerified(c.id);
}

export async function requireGuardianPassed(token: string) {
  if (!(await guardianPassed(token))) throw new Error("보호자 확인이 필요해요.");
}

export type GuardianCheckResult = { ok: true } | { ok: false; error: string };

export async function checkGuardianDigits(token: string, digits: string): Promise<GuardianCheckResult> {
  if (!/^\d{4}$/.test(digits)) return { ok: false, error: "숫자 4자리를 넣어 주세요." };
  const c = await clientOfToken(token);
  if (!c) return { ok: false, error: "볼 수 없는 링크예요." };
  const lockedFor = c.guardianLockedUntil ? c.guardianLockedUntil.getTime() - Date.now() : 0;
  if (lockedFor > 0) return { ok: false, error: `여러 번 틀려 잠겼어요. ${Math.ceil(lockedFor / 60_000)}분 뒤에 다시 해 주세요.` };
  if (last4(c.guardianPhone) === digits) {
    await prisma.client.update({ where: { id: c.id }, data: { guardianCheckFails: 0, guardianLockedUntil: null } });
    await markGuardianVerified(c.id);
    return { ok: true };
  }
  // 동시에 여러 번 보내도 틀린 횟수가 빠지지 않게 늘린 값을 DB에서 받는다
  const { guardianCheckFails: fails } = await prisma.client.update({
    where: { id: c.id },
    data: { guardianCheckFails: { increment: 1 } },
    select: { guardianCheckFails: true },
  });
  if (fails >= GUARDIAN_MAX_FAILS) {
    await prisma.client.update({ where: { id: c.id }, data: { guardianCheckFails: 0, guardianLockedUntil: new Date(Date.now() + LOCK_MS) } });
    return { ok: false, error: "여러 번 틀려 30분 동안 잠겼어요. 요양보호사에게 문의해 주세요." };
  }
  return { ok: false, error: `번호가 맞지 않아요. (${GUARDIAN_MAX_FAILS - fails}번 남음)` };
}
