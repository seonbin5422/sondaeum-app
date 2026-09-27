import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { verifySession } from "@/lib/dal";

export async function POST(req: NextRequest) {
  const { caregiverId } = await verifySession();
  const formData = await req.formData();
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")).trim() : "";
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();

  await prisma.caregiver.update({
    where: { id: caregiverId },
    data: {
      name: name || undefined,
      licenseNumber: licenseNumber || null,
    },
  });

  return NextResponse.redirect(absoluteUrl("/", req), 303);
}
