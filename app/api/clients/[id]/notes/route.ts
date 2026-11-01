import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiCaregiverId, notFound, ownsClient, unauthorized } from "@/lib/apiAuth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await apiCaregiverId();
  if (!me) return unauthorized();
  if (!(await ownsClient(id, me))) return notFound();
  const body = await req.json();
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const client = await prisma.client.update({
    where: { id },
    data: { personalNotes: notes || null },
  });

  return NextResponse.json({ client });
}
