import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.redirect(absoluteUrl("/", req), 303);
}
