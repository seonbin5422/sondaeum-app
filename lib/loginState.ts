import "server-only";
import { cookies } from "next/headers";
import { generateNonce } from "@/lib/pendingEdit";

// SEC-4: 카카오 로그인 state를 요청마다 무작위로. 시작할 때 쿠키에 두고, 돌아올 때 같은 값인지 본다 (로그인 위조 방지).
// 값은 "<돌아갈 화면>.<무작위>" 모양이라 콜백이 어느 화면으로 보낼지도 안다.
const COOKIE = "kakao_login_state";

export type LoginTarget = "v1120" | "login";

export async function newLoginState(to: LoginTarget) {
  const state = `${to}.${generateNonce()}`;
  (await cookies()).set(COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    sameSite: "lax",
    path: "/",
  });
  return state;
}

// 한 번만 쓴다. 맞으면 돌아갈 화면, 없거나 다르면 null
export async function takeLoginState(state: string | null): Promise<LoginTarget | null> {
  const store = await cookies();
  const saved = store.get(COOKIE)?.value;
  store.delete(COOKIE);
  if (!state || !saved || saved !== state) return null;
  return state.startsWith("v1120.") ? "v1120" : "login";
}
