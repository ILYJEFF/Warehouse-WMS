/**
 * Ensures CycleCount tables exist.
 * Run: npx tsx scripts/ensure-cycle-counts.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CycleCountStatus" AS ENUM ('OPEN', 'POSTED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CycleCount" (
      "id" TEXT PRIMARY KEY,
      "locationId" TEXT NOT NULL,
      "status" "CycleCountStatus" NOT NULL DEFAULT 'OPEN',
      "blind" BOOLEAN NOT NULL DEFAULT false,
      "note" TEXT,
      "createdById" TEXT,
      "postedById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "postedAt" TIMESTAMP(3),
      CONSTRAINT "CycleCount_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Location"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "CycleCount_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "CycleCount_postedById_fkey"
        FOREIGN KEY ("postedById") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CycleCountLine" (
      "id" TEXT PRIMARY KEY,
      "cycleCountId" TEXT NOT NULL,
      "itemId" TEXT NOT NULL,
      "expectedQty" INTEGER NOT NULL DEFAULT 0,
      "countedQty" INTEGER,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CycleCountLine_cycleCountId_fkey"
        FOREIGN KEY ("cycleCountId") REFERENCES "CycleCount"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "CycleCountLine_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CycleCountLine_cycleCountId_itemId_key"
      ON "CycleCountLine"("cycleCountId", "itemId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CycleCount_locationId_idx" ON "CycleCount"("locationId");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CycleCount_status_idx" ON "CycleCount"("status");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CycleCount_createdAt_idx" ON "CycleCount"("createdAt");
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "CycleCountLine_itemId_idx" ON "CycleCountLine"("itemId");
  `);

  console.log("Cycle count tables ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
