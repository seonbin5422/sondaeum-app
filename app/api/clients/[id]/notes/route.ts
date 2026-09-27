import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  const client = await prisma.client.update({
    where: { id },
    data: { personalNotes: notes || null },
  });

  return NextResponse.json({ client });
}
