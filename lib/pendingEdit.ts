import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { signPayload, verifyPayload } from "@/lib/jwt";

export interface PendingEdit {
  caregiverId: string;
  nonce: string;
}

export async function setPendingEditCookie(edit: PendingEdit) {
  const token = await signPayload({ ...edit }, "5m");
  const cookieStore = await cookies();
  cookieStore.set("pending_edit", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60,
    sameSite: "lax",
    path: "/",
  });
}

export async function readPendingEditCookie(): Promise<PendingEdit | null> {
  const cookieStore = await cookies();
  const payload = await verifyPayload(cookieStore.get("pending_edit")?.value);
  if (!payload || typeof payload.caregiverId !== "string" || typeof payload.nonce !== "string") {
    return null;
  }
  return {
    caregiverId: payload.caregiverId,
    nonce: payload.nonce,
  };
}

export async function clearPendingEditCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("pending_edit");
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}
