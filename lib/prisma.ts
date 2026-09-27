import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { cleanEnv } from "@/lib/env";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaLibSql({
  url: cleanEnv(process.env.TURSO_DATABASE_URL) || cleanEnv(process.env.DATABASE_URL) || "file:./dev.db",
  authToken: cleanEnv(process.env.TURSO_AUTH_TOKEN),
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
