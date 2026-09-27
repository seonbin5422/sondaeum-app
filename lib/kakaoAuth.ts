import "server-only";
import { cleanEnv } from "@/lib/env";

function getRestApiKey(): string {
  const key = cleanEnv(process.env.KAKAO_REST_API_KEY);
  if (!key) throw new Error("KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

function getClientSecret(): string | undefined {
  return cleanEnv(process.env.KAKAO_CLIENT_SECRET);
}

export function buildAuthorizeUrl({
  state,
  prompt,
  redirectUri,
}: {
  state: string;
  prompt?: "login";
  redirectUri: string;
}): string {
  const params = new URLSearchParams({
    client_id: getRestApiKey(),
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  if (prompt) params.set("prompt", prompt);
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: getRestApiKey(),
    redirect_uri: redirectUri,
    code,
  });
  const clientSecret = getClientSecret();
  if (clientSecret) params.set("client_secret", clientSecret);

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("카카오 토큰 교환에 실패했습니다.");
  const data = await res.json();
  return data.access_token as string;
}

export interface KakaoUser {
  id: string;
  nickname: string | null;
}

export async function fetchKakaoUser(accessToken: string): Promise<KakaoUser> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("카카오 사용자 정보를 가져오지 못했습니다.");
  const data = await res.json();
  return {
    id: String(data.id),
    nickname: data.kakao_account?.profile?.nickname ?? null,
  };
}
