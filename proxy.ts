import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPayload } from "@/lib/jwt";

const PUBLIC_PATH_PREFIXES = ["/login", "/g/", "/api/"];

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
