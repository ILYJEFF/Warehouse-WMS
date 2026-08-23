/**
 * Optional: normalize legacy OWNER/DISPATCH/TECH to ADMIN/USER.
 * Safe to skip; the app accepts both sets of roles.
 * Run: npx tsx scripts/migrate-roles.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "User"
    SET role = CASE
      WHEN role::text IN ('OWNER', 'DISPATCH') THEN 'ADMIN'::"Role"
      WHEN role::text = 'TECH' THEN 'USER'::"Role"
      ELSE role
    END
    WHERE role::text IN ('OWNER', 'DISPATCH', 'TECH')
  `);

  console.log("Updated legacy roles:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
