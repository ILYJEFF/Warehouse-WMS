/**
 * Ensures User lastLoginAt + 2FA columns exist.
 * Run: npx tsx scripts/ensure-user-activity.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "totpSecret" TEXT,
      ADD COLUMN IF NOT EXISTS "totpConfirmed" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
  `);
  console.log("User activity + 2FA columns ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
