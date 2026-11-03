"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireCaregiver } from "../_data";
import { SEEN_COOKIE } from "./_today";

// "모두 읽음": 누른 시각을 쿠키에 둔다 (DB는 그대로). 이보다 나중 알림만 새 알림 점·홈 종 숫자에 센다.
// 게시판 댓글의 읽음(Comment.readAt)은 건드리지 않는다 — 게시판을 열어야 읽음이 된다
export async function markAllSeen() {
  await requireCaregiver();
  (await cookies()).set(SEEN_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/v1120",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/v1120", "layout");
}
