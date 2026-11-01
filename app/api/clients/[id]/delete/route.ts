import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { apiCaregiverId, notFound, ownsClient, unauthorized } from "@/lib/apiAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const me = await apiCaregiverId();
  if (!me) return unauthorized();
  if (!(await ownsClient(id, me))) return notFound();

  await prisma.client.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.redirect(absoluteUrl("/", req), 303);
}
