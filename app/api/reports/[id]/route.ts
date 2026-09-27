import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptText } from "@/lib/crypto";
import { redactPii } from "@/lib/pii";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const [meals, medication, notes] = await Promise.all([
      typeof body.meals === "string" ? redactPii(body.meals) : Promise.resolve(undefined),
      typeof body.medication === "string" ? redactPii(body.medication) : Promise.resolve(undefined),
      typeof body.notes === "string" ? redactPii(body.notes) : Promise.resolve(undefined),
    ]);

    const report = await prisma.report.update({
      where: { id },
      data: {
        meals: meals !== undefined ? encryptText(meals) : undefined,
        medication: medication !== undefined ? encryptText(medication) : undefined,
        notes: notes !== undefined ? encryptText(notes) : undefined,
        medicationMorning:
          typeof body.medicationMorning === "boolean" ? body.medicationMorning : undefined,
        medicationLunch:
          typeof body.medicationLunch === "boolean" ? body.medicationLunch : undefined,
        medicationEvening:
          typeof body.medicationEvening === "boolean" ? body.medicationEvening : undefined,
        medicationBedtime:
          typeof body.medicationBedtime === "boolean" ? body.medicationBedtime : undefined,
        medicationNone:
          typeof body.medicationNone === "boolean" ? body.medicationNone : undefined,
        wasEdited: true,
      },
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "개인정보 필터링에 실패해 저장을 중단했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
