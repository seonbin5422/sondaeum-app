import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { HomeSchedule } from "@/app/components/HomeSchedule";
import { CaregiverGreeting } from "@/app/components/CaregiverGreeting";
import { Logo } from "@/app/components/ui/Logo";
import { buildCaregiverFeedback } from "@/lib/caregiverFeedback";
import { purgeExpiredClients } from "@/lib/purgeExpiredClients";
import { verifySession } from "@/lib/dal";

export const dynamic = "force-dynamic";

const RECENT_REPORT_COUNT = 20;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  await purgeExpiredClients();
  const { caregiverId } = await verifySession();
  const caregiver = await prisma.caregiver.findUnique({ where: { id: caregiverId } });
  const clients = await prisma.client.findMany({
    where: { isActive: true, purgeAt: null },
    orderBy: { name: "asc" },
  });
  const draftVisits = await prisma.visit.findMany({
    where: { status: "DRAFT_READY" },
    orderBy: { createdAt: "desc" },
    select: { id: true, clientId: true },
  });
  const draftVisitIdByClient = new Map<string, string>();
  for (const v of draftVisits) {
    if (!draftVisitIdByClient.has(v.clientId)) draftVisitIdByClient.set(v.clientId, v.id);
  }
  const recentReports = caregiver
    ? await prisma.report.findMany({
        where: { visit: { caregiverId: caregiver.id } },
        orderBy: { visit: { createdAt: "desc" } },
        take: RECENT_REPORT_COUNT,
        select: { aiRawJson: true },
      })
    : [];
  const aiFeedbackMessage = buildCaregiverFeedback(recentReports.map((r) => r.aiRawJson));
  const now = new Date();

  return (
    <>
      <div
        className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 overflow-hidden bg-[length:100%_auto] bg-top bg-no-repeat p-6 pb-28"
        style={{ backgroundImage: "url('/brand/hero-background.png')" }}
      >
        <Logo />

        <CaregiverGreeting
          caregiver={
            caregiver
              ? { id: caregiver.id, name: caregiver.name, licenseNumber: caregiver.licenseNumber }
              : null
          }
          feedbackMessage={aiFeedbackMessage}
          initialEdit={edit === "granted" || edit === "failed" ? edit : null}
        />

        <HomeSchedule
          todayIso={now.toISOString()}
          clients={clients.map((c) => ({
            id: c.id,
            name: c.name,
            age: c.age,
            gender: c.gender,
            allergies: c.allergies,
            medicalHistory: c.medicalHistory,
            medicationNotes: c.medicationNotes,
            personalNotes: c.personalNotes,
            careRegistrationNumber: c.careRegistrationNumber,
            scheduleLabel: c.scheduleLabel,
            draftVisitId: draftVisitIdByClient.get(c.id) ?? null,
          }))}
        />
      </div>

      <div className="fixed bottom-0 left-0 z-10 w-full bg-background p-6 pt-3">
        <Link
          href="/client/new"
          className="mx-auto flex h-16 w-full max-w-md items-center justify-center rounded-[15px] bg-accent text-lg font-semibold text-accent-foreground shadow-[var(--shadow-card)] active:bg-accent-dark"
        >
          돌봄 추가하기
        </Link>
      </div>
    </>
  );
}
