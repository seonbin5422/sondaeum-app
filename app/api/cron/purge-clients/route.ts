import { cleanEnv } from "@/lib/env";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";

// STB-6: 삭제 예약 14일이 지난 수급자를 하루 한 번 지운다 (vercel.json crons, 매일 03:00 KST).
// 화면은 purgeAt이 있는 수급자를 이미 숨기므로 지우는 시점이 하루 늦어도 보이지 않는다.
// /api/는 proxy가 로그인 검사를 하지 않아서, Vercel Cron이 붙여 보내는 CRON_SECRET으로만 연다.
export async function GET(request: Request) {
  const secret = cleanEnv(process.env.CRON_SECRET);
  if (!secret) return Response.json({ error: "CRON_SECRET이 설정되지 않았어요." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const purged = await purgeExpiredClients();
  return Response.json({ purged });
}
