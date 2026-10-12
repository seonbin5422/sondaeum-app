import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCaregiverId } from "@/lib/session";

// SEC-1: proxy.ts가 /api/를 로그인 검사에서 빼 두었으므로 API마다 여기서 로그인과 내 데이터인지를 확인한다.
// 화면 이동(redirect)이 아니라 401·404를 돌려준다 (fetch로 부르는 곳이 많아서).

export const unauthorized = () => NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "찾을 수 없어요." }, { status: 404 });

export async function apiCaregiverId() {
  return getSessionCaregiverId();
}

// shortcut: 옛 화면이 만든 수급자는 caregiverId가 비어 있어 로그인한 누구나 쓰게 둔다,
// 머지 때 기존 수급자의 담당을 채우면 caregiverId: null 조건을 뺀다 (SEC-2, D-35)
export async function ownsClient(id: string, caregiverId: string) {
  const c = await prisma.client.findFirst({ where: { id, OR: [{ caregiverId }, { caregiverId: null }] }, select: { id: true } });
  return !!c;
}

export async function ownsVisit(id: string, caregiverId: string) {
  const v = await prisma.visit.findFirst({ where: { id, caregiverId }, select: { id: true } });
  return !!v;
}

export async function ownsReport(id: string, caregiverId: string) {
  const r = await prisma.report.findFirst({ where: { id, visit: { caregiverId } }, select: { id: true } });
  return !!r;
}
