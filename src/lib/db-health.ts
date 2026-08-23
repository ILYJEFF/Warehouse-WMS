import { prisma } from "@/lib/prisma";

export type DbStatus =
  | { ok: true }
  | { ok: false; message: string };

export function missingEnvVars() {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
    missing.push("AUTH_SECRET");
  }
  return missing;
}

export async function getDbStatus(): Promise<DbStatus> {
  const missing = missingEnvVars();
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing environment variables: ${missing.join(", ")}`,
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect to the database";
    return { ok: false, message };
  }
}
