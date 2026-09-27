import "server-only";
import { cookies } from "next/headers";
import { signPayload, verifyPayload } from "@/lib/jwt";

export async function createSession(caregiverId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await signPayload({ caregiverId }, "7d");
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSessionCaregiverId(): Promise<string | null> {
  const cookieStore = await cookies();
  const payload = await verifyPayload(cookieStore.get("session")?.value);
  const caregiverId = payload?.caregiverId;
  return typeof caregiverId === "string" ? caregiverId : null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
