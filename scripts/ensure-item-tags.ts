/**
 * Creates Tag + ItemTag tables, migrates legacy Item.tags[], then drops the array column.
 * Run during Vercel build / locally: npx tsx scripts/ensure-item-tags.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_COLORS = [
  "#3c8dbc",
  "#00a65a",
  "#f39c12",
  "#dd4b39",
  "#605ca8",
  "#00c0ef",
  "#d81b60",
  "#39cccc",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i) * (i + 1)) % 997;
  return DEFAULT_COLORS[hash % DEFAULT_COLORS.length];
}

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tag" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "color" TEXT NOT NULL DEFAULT '#3c8dbc',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ItemTag" (
      "itemId" TEXT NOT NULL,
      "tagId" TEXT NOT NULL,
      PRIMARY KEY ("itemId", "tagId"),
      CONSTRAINT "ItemTag_itemId_fkey"
        FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ItemTag_tagId_fkey"
        FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ItemTag_tagId_idx" ON "ItemTag"("tagId");
  `);

  const hasLegacy = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'Item' AND column_name = 'tags'
    ) AS "exists";
  `);

  if (hasLegacy[0]?.exists) {
    const rows = await prisma.$queryRawUnsafe<{ id: string; tags: string[] }[]>(`
      SELECT "id", "tags" FROM "Item" WHERE cardinality("tags") > 0;
    `);

    for (const row of rows) {
      for (const raw of row.tags ?? []) {
        const name = String(raw).trim().toLowerCase().replace(/\s+/g, "-");
        if (!name) continue;
        const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(`
          SELECT "id" FROM "Tag" WHERE "name" = $1 LIMIT 1;
        `, name);
        let tagId = existing[0]?.id;
        if (!tagId) {
          tagId = `tag_${name}_${Math.random().toString(36).slice(2, 8)}`;
          await prisma.$executeRawUnsafe(
            `
            INSERT INTO "Tag" ("id", "name", "color", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT ("name") DO NOTHING;
          `,
            tagId,
            name,
            colorFor(name),
          );
          const again = await prisma.$queryRawUnsafe<{ id: string }[]>(`
            SELECT "id" FROM "Tag" WHERE "name" = $1 LIMIT 1;
          `, name);
          tagId = again[0]?.id ?? tagId;
        }
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO "ItemTag" ("itemId", "tagId")
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `,
          row.id,
          tagId,
        );
      }
    }

    await prisma.$executeRawUnsafe(`ALTER TABLE "Item" DROP COLUMN IF EXISTS "tags";`);
    console.log("Migrated legacy Item.tags into Tag/ItemTag.");
  }

  console.log("Tag catalog ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
