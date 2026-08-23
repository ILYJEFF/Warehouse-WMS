/**
 * One-time: map OWNER/DISPATCH/TECH → ADMIN/USER and add User.active.
 * Run: npx tsx scripts/migrate-roles.ts
 * Then: npx prisma db push
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'Role' AND e.enumlabel = 'OWNER'
      ) THEN
        ALTER TYPE "Role" RENAME TO "Role_old";
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
        ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE "User"
          ALTER COLUMN role TYPE "Role"
          USING (
            CASE
              WHEN role::text IN ('OWNER', 'DISPATCH', 'ADMIN') THEN 'ADMIN'::"Role"
              ELSE 'USER'::"Role"
            END
          );
        ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'USER'::"Role";
        DROP TYPE "Role_old";
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
  `);

  console.log("Role migration complete (ADMIN/USER + active).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
