/**
 * Ensures Location vin + licensePlate columns exist.
 * Run: npx tsx scripts/ensure-truck-fields.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Location"
      ADD COLUMN IF NOT EXISTS "vin" TEXT,
      ADD COLUMN IF NOT EXISTS "licensePlate" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Location_licensePlate_idx" ON "Location"("licensePlate");
  `);

  console.log("Truck VIN / license plate columns ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
