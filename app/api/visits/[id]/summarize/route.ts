import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptText, encryptText } from "@/lib/crypto";
import { classifyCareNote } from "@/lib/careNoteAi";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const visit = await prisma.visit.update({
    where: { id },
    data: { status: "SUMMARIZING" },
  });

  if (!visit.transcript) {
    await prisma.visit.update({ where: { id }, data: { status: "RECORDED" } });
    return NextResponse.json({ error: "빈 녹음입니다." }, { status: 400 });
  }

  const transcript = decryptText(visit.transcript);
  if (transcript.trim().length === 0) {
    await prisma.visit.update({ where: { id }, data: { status: "RECORDED" } });
    return NextResponse.json({ error: "빈 녹음입니다." }, { status: 400 });
  }

  try {
    const draft = await classifyCareNote(transcript);
    // mealsMissing/medicationMissing/notesMissing은 검토 화면에서만 쓰는 내부 신호라
    // 보호자에게 보이는 필드(meals/medication/notes)에는 절대 섞지 않고 aiRawJson에만 저장한다.
    const encryptedRawJson = encryptText(JSON.stringify(draft));

    const medicationCheckboxes = {
      medicationMorning: draft.medicationMorning,
      medicationLunch: draft.medicationLunch,
      medicationEvening: draft.medicationEvening,
      medicationBedtime: draft.medicationBedtime,
      medicationNone: draft.medicationNone,
    };

    const report = await prisma.report.upsert({
      where: { visitId: id },
      create: {
        visitId: id,
        meals: encryptText(draft.meals),
        medication: encryptText(draft.medication),
        notes: encryptText(draft.notes),
        ...medicationCheckboxes,
        aiRawJson: encryptedRawJson,
      },
      update: {
        meals: encryptText(draft.meals),
        medication: encryptText(draft.medication),
        notes: encryptText(draft.notes),
        ...medicationCheckboxes,
        aiRawJson: encryptedRawJson,
        wasEdited: false,
      },
    });

    await prisma.visit.update({ where: { id }, data: { status: "DRAFT_READY" } });

    return NextResponse.json({ report });
  } catch (err) {
    await prisma.visit.update({ where: { id }, data: { status: "RECORDED" } });
    console.error(err);
    return NextResponse.json(
      { error: "AI 요약에 실패했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
