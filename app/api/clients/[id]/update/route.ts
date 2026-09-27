import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/absoluteUrl";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await req.formData();
  const name = formData.get("name");
  const guardianName = formData.get("guardianName");
  const guardianRelation = formData.get("guardianRelation");
  const guardianRelationCustom = formData.get("guardianRelationCustom");
  const careRegistrationNumber = formData.get("careRegistrationNumber");
  const phone = formData.get("phone");
  const scheduleLabel = formData.get("scheduleLabel");
  const age = formData.get("age");
  const gender = formData.get("gender");
  const allergies = formData.get("allergies");
  const medicalHistory = formData.get("medicalHistory");
  const medicationNotes = formData.get("medicationNotes");

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof guardianName !== "string" ||
    !guardianName.trim() ||
    typeof guardianRelation !== "string" ||
    !guardianRelation.trim()
  ) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }

  const finalRelation =
    typeof guardianRelationCustom === "string" && guardianRelationCustom.trim()
      ? guardianRelationCustom.trim()
      : guardianRelation.trim();

  await prisma.client.update({
    where: { id },
    data: {
      name: name.trim(),
      guardianName: guardianName.trim(),
      guardianRelation: finalRelation,
      careRegistrationNumber:
        typeof careRegistrationNumber === "string" && careRegistrationNumber.trim()
          ? careRegistrationNumber.trim()
          : null,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      scheduleLabel:
        typeof scheduleLabel === "string" && scheduleLabel.trim() ? scheduleLabel.trim() : null,
      age: typeof age === "string" && age.trim() ? Number.parseInt(age, 10) : null,
      gender: typeof gender === "string" && gender.trim() ? gender.trim() : null,
      allergies: typeof allergies === "string" && allergies.trim() ? allergies.trim() : null,
      medicalHistory:
        typeof medicalHistory === "string" && medicalHistory.trim()
          ? medicalHistory.trim()
          : null,
      medicationNotes:
        typeof medicationNotes === "string" && medicationNotes.trim()
          ? medicationNotes.trim()
          : null,
    },
  });

  return NextResponse.redirect(absoluteUrl("/", req), 303);
}
