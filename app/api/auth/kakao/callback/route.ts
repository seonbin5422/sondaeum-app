import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { exchangeCodeForToken, fetchKakaoUser } from "@/lib/kakaoAuth";
import { createSession } from "@/lib/session";
import { readPendingEditCookie, clearPendingEditCookie } from "@/lib/pendingEdit";
import { setEditGrantCookie } from "@/lib/editGrant";

export const runtime = "nodejs";

// 아이폰 카카오 로그인 실패 원인을 찾으려고 실패마다 이유를 남긴다 (Vercel 로그에서 "kakao-login" 검색).
// 로그인 화면 주소에도 ?kakao=<이유>를 붙여 휴대폰 화면 캡처로도 알 수 있게 한다. code·state 값은 남기지 않는다
function fail(req: NextRequest, reason: string, extra: Record<string, unknown> = {}) {
  console.warn("kakao-login", JSON.stringify({ reason, host: req.headers.get("host"), ua: req.headers.get("user-agent"), ...extra }));
  return NextResponse.redirect(absoluteUrl(`/login?kakao=${reason}`, req), 303);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return fail(req, error ? "kakao_error" : "no_code", { error, errorDescription: req.nextUrl.searchParams.get("error_description") });
  }

  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http:" : "https:";
  const redirectUri = `${protocol}//${host}/api/auth/kakao/callback`;

  let accessToken: string;
  let kakaoUser: { id: string; nickname: string | null };
  try {
    accessToken = await exchangeCodeForToken(code, redirectUri);
    kakaoUser = await fetchKakaoUser(accessToken);
  } catch (err) {
    return fail(req, "token_or_user", { message: err instanceof Error ? err.message : String(err), redirectUri });
  }

  const pendingEdit = await readPendingEditCookie();
  if (pendingEdit && pendingEdit.nonce === state) {
    // 재인증-수정 콜백: 같은 카카오 계정으로 다시 로그인했는지 확인 후에만 반영
    const caregiver = await prisma.caregiver.findUnique({
      where: { id: pendingEdit.caregiverId },
    });
    await clearPendingEditCookie();
    if (!caregiver || caregiver.kakaoId !== kakaoUser.id) {
      return NextResponse.redirect(absoluteUrl("/?edit=failed", req), 303);
    }
    await setEditGrantCookie(pendingEdit.caregiverId);
    return NextResponse.redirect(absoluteUrl("/?edit=granted", req), 303);
  }

  // 일반 로그인/가입
  const caregiver = await prisma.caregiver.upsert({
    where: { kakaoId: kakaoUser.id },
    create: { kakaoId: kakaoUser.id, name: kakaoUser.nickname ?? "요양보호사" },
    update: {},
  });
  await createSession(caregiver.id);

  const nextPath = caregiver.licenseNumber ? "/" : "/onboarding";
  return NextResponse.redirect(absoluteUrl(nextPath, req), 303);
}
