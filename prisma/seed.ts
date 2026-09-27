import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { cleanEnv } from "../lib/env";

const adapter = new PrismaLibSql({
  url: cleanEnv(process.env.TURSO_DATABASE_URL) || cleanEnv(process.env.DATABASE_URL) || "file:./dev.db",
  authToken: cleanEnv(process.env.TURSO_AUTH_TOKEN),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const caregiver = await prisma.caregiver.upsert({
    where: { id: "seed-caregiver-1" },
    update: {},
    create: { id: "seed-caregiver-1", name: "김미경" },
  });

  await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {
      careRegistrationNumber: "L1234567890",
      phone: "010-1234-5678",
      scheduleLabel: "월,화 10:00-17:00",
    },
    create: {
      id: "seed-client-1",
      name: "박말순 어르신",
      guardianName: "박현우",
      guardianRelation: "아들",
      careRegistrationNumber: "L1234567890",
      phone: "010-1234-5678",
      scheduleLabel: "월,화 10:00-17:00",
    },
  });

  await prisma.client.upsert({
    where: { id: "seed-client-2" },
    update: {
      careRegistrationNumber: "L2345678901",
      phone: "010-2345-6789",
      scheduleLabel: "수,금 10:00-17:00",
    },
    create: {
      id: "seed-client-2",
      name: "이순자 어르신",
      guardianName: "이지은",
      guardianRelation: "딸",
      careRegistrationNumber: "L2345678901",
      phone: "010-2345-6789",
      scheduleLabel: "수,금 10:00-17:00",
    },
  });

  console.log("시드 완료:", caregiver.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
