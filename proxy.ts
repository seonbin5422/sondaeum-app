import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPayload } from "@/lib/jwt";

// TEMP(v1120): 1120.ver 미리보기를 로그인 없이 보기 위한 예외. main에 머지하지 않는다.
const PUBLIC_PATH_PREFIXES = ["/login", "/g/", "/api/", "/v1120"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(p));

  const sessionCookie = request.cookies.get("session")?.value;
  const payload = await verifyPayload(sessionCookie);
  const isLoggedIn = typeof payload?.caregiverId === "string";

  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|pwa-icon-512|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
