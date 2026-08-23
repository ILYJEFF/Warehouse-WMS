import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "dispatch@techchefstx.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Oatmilk1769!";
  const name = process.env.ADMIN_NAME ?? "Dispatch";

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      role: "ADMIN",
      active: true,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "tech@techchefstx.com" },
    update: {},
    create: {
      email: "tech@techchefstx.com",
      name: "Field Tech",
      role: "USER",
      active: true,
      passwordHash: await bcrypt.hash("Oatmilk1769!", 12),
    },
  });

  if (process.env.SEED_DEMO !== "true") return;

  const shop = await prisma.location.upsert({
    where: { code: "SHOP" },
    update: {},
    create: { code: "SHOP", name: "Duncanville Shop", kind: "SHOP" },
  });
  const truck1 = await prisma.location.upsert({
    where: { code: "TRK-01" },
    update: { assignedUserId: tech.id },
    create: {
      code: "TRK-01",
      name: "Truck 1",
      kind: "TRUCK",
      assignedUserId: tech.id,
    },
  });
  const truck2 = await prisma.location.upsert({
    where: { code: "TRK-02" },
    update: {},
    create: { code: "TRK-02", name: "Truck 2", kind: "TRUCK" },
  });

  const items = [
    {
      sku: "EMT-3/4",
      name: '3/4" EMT Conduit (10ft)',
      category: "Conduit",
      reorderPoint: 20,
      unitCostCents: 850,
      shopQty: 48,
      truckQty: 8,
    },
    {
      sku: "THHN-12-BLK",
      name: "12 AWG THHN Black (ft)",
      category: "Wire",
      unit: "ft",
      reorderPoint: 500,
      unitCostCents: 28,
      shopQty: 2400,
      truckQty: 200,
    },
    {
      sku: "BRKR-20A",
      name: "20A Single Pole Breaker",
      category: "Breakers",
      reorderPoint: 10,
      unitCostCents: 1250,
      shopQty: 24,
      truckQty: 4,
    },
    {
      sku: "LED-4FT-40W",
      name: "4ft LED Shop Light 40W",
      category: "Lighting",
      reorderPoint: 6,
      unitCostCents: 4200,
      shopQty: 12,
      truckQty: 2,
    },
  ] as const;

  for (const row of items) {
    const item = await prisma.item.upsert({
      where: { sku: row.sku },
      update: {},
      create: {
        sku: row.sku,
        name: row.name,
        category: row.category,
        unit: "unit" in row ? row.unit : "ea",
        reorderPoint: row.reorderPoint,
        unitCostCents: row.unitCostCents,
      },
    });

    await prisma.stockBalance.upsert({
      where: { itemId_locationId: { itemId: item.id, locationId: shop.id } },
      update: { qty: row.shopQty },
      create: { itemId: item.id, locationId: shop.id, qty: row.shopQty },
    });
    await prisma.stockBalance.upsert({
      where: { itemId_locationId: { itemId: item.id, locationId: truck1.id } },
      update: { qty: row.truckQty },
      create: { itemId: item.id, locationId: truck1.id, qty: row.truckQty },
    });
    await prisma.stockBalance.upsert({
      where: { itemId_locationId: { itemId: item.id, locationId: truck2.id } },
      update: { qty: 0 },
      create: { itemId: item.id, locationId: truck2.id, qty: 0 },
    });
  }

  console.log("WMS seed complete:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
