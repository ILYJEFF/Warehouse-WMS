/**
 * Ensures IntegrationConnection table exists.
 * Run: npx tsx scripts/ensure-integrations.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "IntegrationConnection" (
      "id" TEXT PRIMARY KEY,
      "provider" TEXT NOT NULL UNIQUE,
      "accountId" TEXT,
      "accountName" TEXT,
      "accessToken" TEXT NOT NULL,
      "refreshToken" TEXT NOT NULL,
      "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
      "expiresAt" TIMESTAMP(3),
      "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSyncAt" TIMESTAMP(3),
      "metadata" JSONB
    );
  `);

  console.log("Integrations table ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
