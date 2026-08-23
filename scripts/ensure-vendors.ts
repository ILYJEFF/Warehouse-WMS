/**
 * Ensures Vendor table + Item vendor columns exist.
 * Run: npx tsx scripts/ensure-vendors.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Vendor" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "code" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "website" TEXT,
      "notes" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Item"
      ADD COLUMN IF NOT EXISTS "vendorId" TEXT,
      ADD COLUMN IF NOT EXISTS "vendorSku" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Item_vendorId_idx" ON "Item"("vendorId");
  `);

  // Attach FK if missing (safe on Neon / Postgres).
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Item_vendorId_fkey'
      ) THEN
        ALTER TABLE "Item"
          ADD CONSTRAINT "Item_vendorId_fkey"
          FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  console.log("Vendors ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
