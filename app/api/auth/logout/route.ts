import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { absoluteUrl } from "@/lib/absoluteUrl";

export async function POST(req: NextRequest) {
  await deleteSession();
  return NextResponse.redirect(absoluteUrl("/login", req), 303);
}
