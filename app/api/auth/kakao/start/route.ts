import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/kakaoAuth";
import { newLoginState } from "@/lib/loginState";

export const runtime = "nodejs";

// 카카오 로그인 시작 (SEC-4). 로그인 화면의 카카오 버튼이 여기로 온다: 무작위 state를 쿠키에 두고 카카오로 보낸다.
// ?to=v1120 이면 로그인 뒤 1120 화면으로. ?switch=1 이면 남아 있는 카카오 로그인을 쓰지 않고 계정을 다시 묻는다(prompt=login)
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "v1120" ? "v1120" : "login";
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http:" : "https:";
  const redirectUri = `${protocol}//${host}/api/auth/kakao/callback`;
  const state = await newLoginState(to);
  const prompt = req.nextUrl.searchParams.get("switch") === "1" ? "login" : undefined;
  return NextResponse.redirect(buildAuthorizeUrl({ state, redirectUri, prompt }), 303);
}
