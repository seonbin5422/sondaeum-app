import "server-only";
import { cookies } from "next/headers";
import { signPayload, verifyPayload } from "@/lib/jwt";

export async function setEditGrantCookie(caregiverId: string) {
  const token = await signPayload({ caregiverId }, "5m");
  const cookieStore = await cookies();
  cookieStore.set("edit_grant", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60,
    sameSite: "lax",
    path: "/",
  });
}

export async function readEditGrantCaregiverId(): Promise<string | null> {
  const cookieStore = await cookies();
  const payload = await verifyPayload(cookieStore.get("edit_grant")?.value);
  if (!payload || typeof payload.caregiverId !== "string") return null;
  return payload.caregiverId;
}

export async function clearEditGrantCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("edit_grant");
}
