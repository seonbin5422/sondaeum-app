import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/dal";
import { setPendingEditCookie, generateNonce } from "@/lib/pendingEdit";
import { buildAuthorizeUrl } from "@/lib/kakaoAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { caregiverId } = await verifySession();
  if (caregiverId !== id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const nonce = generateNonce();
  await setPendingEditCookie({ caregiverId, nonce });

  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http:" : "https:";
  const redirectUri = `${protocol}//${host}/api/auth/kakao/callback`;
  const redirectUrl = buildAuthorizeUrl({ state: nonce, prompt: "login", redirectUri });

  return NextResponse.json({ redirectUrl });
}
