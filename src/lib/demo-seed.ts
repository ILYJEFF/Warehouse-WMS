import bcrypt from "bcryptjs";
import { MoveType, type PrismaClient } from "@prisma/client";
import { buildTruckCode, parseTruckNumber } from "@/lib/locations";
import { TAG_COLOR_PRESETS } from "@/lib/tags";

export const DEMO_USER_DOMAIN = "@demo.wms.local";
export const DEMO_SKU_PREFIX = "DEMO-";
export const DEMO_LOCATION_PREFIX = "DEMO-";
export const DEMO_VENDOR_PREFIX = "DEMO · ";
export const DEMO_TAG_PREFIX = "demo-";
export const DEMO_PLATE_PREFIX = "DEMO";

export type DemoStats = {
  users: number;
  vendors: number;
  tags: number;
  locations: number;
  items: number;
  moves: number;
};

function isDemoTruckCode(code: string) {
  return /^TRK-\d+-DEMO/i.test(code);
}

export async function getDemoStats(prisma: PrismaClient): Promise<DemoStats> {
  const [users, vendors, tags, locations, items, moves] = await Promise.all([
    prisma.user.count({ where: { email: { endsWith: DEMO_USER_DOMAIN } } }),
    prisma.vendor.count({ where: { name: { startsWith: DEMO_VENDOR_PREFIX } } }),
    prisma.tag.count({ where: { name: { startsWith: DEMO_TAG_PREFIX } } }),
    prisma.location.count({
      where: {
        OR: [
          { code: { startsWith: DEMO_LOCATION_PREFIX } },
          { licensePlate: { startsWith: DEMO_PLATE_PREFIX } },
        ],
      },
    }),
    prisma.item.count({ where: { sku: { startsWith: DEMO_SKU_PREFIX } } }),
    prisma.stockMove.count({
      where: {
        OR: [
          { item: { sku: { startsWith: DEMO_SKU_PREFIX } } },
          { note: { startsWith: "[DEMO]" } },
        ],
      },
    }),
  ]);

  return { users, vendors, tags, locations, items, moves };
}

export function demoStatsTotal(stats: DemoStats) {
  return (
    stats.users +
    stats.vendors +
    stats.tags +
    stats.locations +
    stats.items +
    stats.moves
  );
}

/** Wipe everything created by the demo seeder. Real data is left alone. */
export async function clearDemoData(prisma: PrismaClient) {
  const demoItems = await prisma.item.findMany({
    where: { sku: { startsWith: DEMO_SKU_PREFIX } },
    select: { id: true },
  });
  const demoItemIds = demoItems.map((row) => row.id);

  const demoLocations = await prisma.location.findMany({
    where: {
      OR: [
        { code: { startsWith: DEMO_LOCATION_PREFIX } },
        { licensePlate: { startsWith: DEMO_PLATE_PREFIX } },
      ],
    },
    select: { id: true, code: true },
  });
  const allLocations = await prisma.location.findMany({
    select: { id: true, code: true },
  });
  const demoLocationIds = new Set(demoLocations.map((row) => row.id));
  for (const loc of allLocations) {
    if (isDemoTruckCode(loc.code)) demoLocationIds.add(loc.id);
  }
  const locationIds = Array.from(demoLocationIds);

  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_USER_DOMAIN } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((row) => row.id);

  const moveOr: Array<Record<string, unknown>> = [
    { note: { startsWith: "[DEMO]" } },
  ];
  if (demoItemIds.length > 0) moveOr.push({ itemId: { in: demoItemIds } });
  if (locationIds.length > 0) {
    moveOr.push({ fromLocationId: { in: locationIds } });
    moveOr.push({ toLocationId: { in: locationIds } });
  }
  if (demoUserIds.length > 0) moveOr.push({ userId: { in: demoUserIds } });

  await prisma.stockMove.deleteMany({ where: { OR: moveOr } });

  if (demoItemIds.length > 0) {
    await prisma.stockBalance.deleteMany({ where: { itemId: { in: demoItemIds } } });
    await prisma.itemTag.deleteMany({ where: { itemId: { in: demoItemIds } } });
    await prisma.item.deleteMany({ where: { id: { in: demoItemIds } } });
  }

  if (locationIds.length > 0) {
    await prisma.stockBalance.deleteMany({
      where: { locationId: { in: locationIds } },
    });
    if (demoUserIds.length > 0) {
      await prisma.location.updateMany({
        where: { assignedUserId: { in: demoUserIds } },
        data: { assignedUserId: null },
      });
    }
    await prisma.location.deleteMany({ where: { id: { in: locationIds } } });
  }

  await prisma.vendor.deleteMany({
    where: { name: { startsWith: DEMO_VENDOR_PREFIX } },
  });
  await prisma.tag.deleteMany({
    where: { name: { startsWith: DEMO_TAG_PREFIX } },
  });
  if (demoUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
  }
}

type CatalogRow = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  reorderPoint: number;
  unitCostCents: number;
  vendorIndex: number;
  tags: string[];
  shopQty: number;
  low?: boolean;
};

function buildCatalog(): CatalogRow[] {
  const categories = [
    {
      key: "Conduit",
      unit: "ea",
      parts: [
        ['3/4" EMT', 850],
        ['1" EMT', 1100],
        ['1-1/4" EMT', 1450],
        ['2" EMT', 2100],
        ['3/4" PVC Sch40', 420],
        ['1" PVC Sch40', 580],
        ['3/4" Rigid', 1850],
        ['1" Rigid', 2400],
      ],
    },
    {
      key: "Wire",
      unit: "ft",
      parts: [
        ["12 AWG THHN Black", 28],
        ["12 AWG THHN White", 28],
        ["12 AWG THHN Green", 30],
        ["10 AWG THHN Black", 42],
        ["10 AWG THHN Red", 42],
        ["8 AWG THHN Black", 78],
        ["6 AWG THHN Black", 120],
        ["14/2 NM-B", 55],
        ["12/2 NM-B", 72],
        ["10/3 NM-B", 145],
      ],
    },
    {
      key: "Breakers",
      unit: "ea",
      parts: [
        ["15A Single Pole", 980],
        ["20A Single Pole", 1250],
        ["30A Single Pole", 1680],
        ["20A Double Pole", 2450],
        ["40A Double Pole", 3200],
        ["50A Double Pole", 3850],
        ["60A Double Pole", 4500],
        ["GFCI 20A", 4200],
      ],
    },
    {
      key: "Lighting",
      unit: "ea",
      parts: [
        ["4ft LED Shop Light 40W", 4200],
        ["2ft LED Shop Light 20W", 2800],
        ["LED High Bay 150W", 12800],
        ["LED Wall Pack 40W", 6500],
        ["Emergency Exit Sign", 3100],
        ["Occupancy Sensor", 2200],
      ],
    },
    {
      key: "Fasteners",
      unit: "ea",
      parts: [
        ["1/4x20 Tapcon (box)", 1800],
        ["3/8 Wedge Anchor", 95],
        ["Beam Clamp 3/8", 185],
        ["Unistrut Clamp", 120],
        ["Zip Tie 11in (pack)", 650],
        ["Wire Nut Red (box)", 900],
        ["Wire Nut Yellow (box)", 850],
      ],
    },
    {
      key: "Tools",
      unit: "ea",
      parts: [
        ["Fish Tape 50ft", 4500],
        ["Voltage Tester", 2800],
        ["Torque Screwdriver", 6200],
        ["Hole Saw Kit", 8900],
        ["Cable Cutter", 5400],
      ],
    },
    {
      key: "HVAC Parts",
      unit: "ea",
      parts: [
        ["Filter 20x25x1 (case)", 3600],
        ["Capacitor 35/5", 1850],
        ["Contactor 40A", 4200],
        ["TXV 3-ton", 9800],
        ["Copper 3/8 Soft (50ft)", 11200],
        ["R-410A 25lb", 18500],
        ["Disconnect 60A", 5400],
        ["Thermostat WiFi", 12500],
      ],
    },
    {
      key: "Fittings",
      unit: "ea",
      parts: [
        ['3/4" EMT Connector', 65],
        ['3/4" EMT Coupling', 55],
        ['1" EMT Connector', 85],
        ['1" EMT Coupling', 75],
        ['3/4" LB Conduit Body', 420],
        ['1" LB Conduit Body', 560],
        ["Set Screw Connector", 48],
        ["Compression Connector", 72],
      ],
    },
  ] as const;

  const tagSets = [
    ["demo-electrical", "demo-stock"],
    ["demo-jobsite", "demo-fast-mover"],
    ["demo-shop", "demo-stock"],
    ["demo-hvac", "demo-jobsite"],
    ["demo-reorder"],
  ];

  const rows: CatalogRow[] = [];
  let n = 1;
  for (const cat of categories) {
    for (const [label, cost] of cat.parts) {
      const low = n % 7 === 0;
      const shopQty = low ? n % 3 : 12 + (n % 40);
      rows.push({
        sku: `${DEMO_SKU_PREFIX}${String(n).padStart(3, "0")}`,
        name: label,
        category: cat.key,
        unit: cat.unit,
        reorderPoint: cat.unit === "ft" ? 200 + (n % 5) * 100 : 4 + (n % 8),
        unitCostCents: cost,
        vendorIndex: (n - 1) % 5,
        tags: tagSets[n % tagSets.length],
        shopQty,
        low,
      });
      n += 1;
    }
  }
  return rows;
}

/** Create a large, removable demo dataset. Idempotent via clear-then-seed. */
export async function seedDemoData(prisma: PrismaClient, actorUserId?: string) {
  await clearDemoData(prisma);

  const passwordHash = await bcrypt.hash("DemoPass123!", 10);

  const techs = await Promise.all(
    [
      { email: `tech1${DEMO_USER_DOMAIN}`, name: "Demo Tech One" },
      { email: `tech2${DEMO_USER_DOMAIN}`, name: "Demo Tech Two" },
      { email: `tech3${DEMO_USER_DOMAIN}`, name: "Demo Tech Three" },
      { email: `buyer${DEMO_USER_DOMAIN}`, name: "Demo Buyer" },
    ].map((row) =>
      prisma.user.create({
        data: {
          email: row.email,
          name: row.name,
          role: row.email.startsWith("buyer") ? "DISPATCH" : "TECH",
          passwordHash,
        },
      }),
    ),
  );

  const vendorDefs = [
    { name: `${DEMO_VENDOR_PREFIX}Ferguson`, code: "FERG-DEMO", phone: "214-555-0101" },
    { name: `${DEMO_VENDOR_PREFIX}Grainger`, code: "GRNG-DEMO", phone: "972-555-0144" },
    { name: `${DEMO_VENDOR_PREFIX}Johnstone Supply`, code: "JSTN-DEMO", phone: "469-555-0199" },
    { name: `${DEMO_VENDOR_PREFIX}Home Depot Pro`, code: "HD-DEMO", phone: "817-555-0112" },
    { name: `${DEMO_VENDOR_PREFIX}United Refrigeration`, code: "URI-DEMO", phone: "214-555-0177" },
  ];
  const vendors = [];
  for (const def of vendorDefs) {
    vendors.push(
      await prisma.vendor.create({
        data: {
          name: def.name,
          code: def.code,
          phone: def.phone,
          email: `orders${DEMO_USER_DOMAIN}`,
          notes: "Demo vendor for test purchasing workflows",
        },
      }),
    );
  }

  const tagNames = [
    "demo-electrical",
    "demo-hvac",
    "demo-jobsite",
    "demo-shop",
    "demo-stock",
    "demo-fast-mover",
    "demo-reorder",
    "demo-seasonal",
  ];
  const tags = [];
  for (let i = 0; i < tagNames.length; i += 1) {
    tags.push(
      await prisma.tag.create({
        data: {
          name: tagNames[i],
          color: TAG_COLOR_PRESETS[i % TAG_COLOR_PRESETS.length],
        },
      }),
    );
  }
  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  const shop = await prisma.location.create({
    data: {
      code: `${DEMO_LOCATION_PREFIX}SHOP`,
      name: "Demo Duncanville Shop",
      kind: "SHOP",
    },
  });
  const yard = await prisma.location.create({
    data: {
      code: `${DEMO_LOCATION_PREFIX}YARD`,
      name: "Demo Outside Yard",
      kind: "OTHER",
    },
  });

  const existingTrucks = await prisma.location.findMany({
    where: { kind: "TRUCK" },
    select: { code: true },
  });
  let nextTruck = 1;
  for (const truck of existingTrucks) {
    const n = parseTruckNumber(truck.code);
    if (n !== null) nextTruck = Math.max(nextTruck, n + 1);
  }

  const trucks = [];
  for (let i = 0; i < 5; i += 1) {
    const plate = `${DEMO_PLATE_PREFIX}${String(i + 1).padStart(2, "0")}`;
    const code = buildTruckCode(nextTruck + i, plate);
    trucks.push(
      await prisma.location.create({
        data: {
          code,
          name: `Demo Truck ${i + 1}`,
          kind: "TRUCK",
          licensePlate: plate,
          vin: `1FTFW1E${String(50 + i).padStart(2, "0")}DEMOVIN${i}`,
          assignedUserId: techs[i % techs.length]?.id ?? null,
        },
      }),
    );
  }

  const catalog = buildCatalog();
  const createdItems = [];

  for (const row of catalog) {
    const vendor = vendors[row.vendorIndex];
    const item = await prisma.item.create({
      data: {
        sku: row.sku,
        name: row.name,
        category: row.category,
        unit: row.unit,
        reorderPoint: row.reorderPoint,
        unitCostCents: row.unitCostCents,
        notes: "[DEMO] Seeded test item",
        vendorId: vendor.id,
        vendorSku: `V-${row.sku.replace(DEMO_SKU_PREFIX, "")}`,
      },
    });
    createdItems.push(item);

    for (const tagName of row.tags) {
      const tag = tagByName.get(tagName);
      if (!tag) continue;
      await prisma.itemTag.create({
        data: { itemId: item.id, tagId: tag.id },
      });
    }

    await prisma.stockBalance.create({
      data: { itemId: item.id, locationId: shop.id, qty: row.shopQty },
    });

    const truckQty = row.low ? 0 : 1 + (createdItems.length % 6);
    const truck = trucks[createdItems.length % trucks.length];
    await prisma.stockBalance.create({
      data: { itemId: item.id, locationId: truck.id, qty: truckQty },
    });

    if (createdItems.length % 5 === 0) {
      await prisma.stockBalance.create({
        data: {
          itemId: item.id,
          locationId: yard.id,
          qty: 2 + (createdItems.length % 10),
        },
      });
    }
  }

  const actor =
    actorUserId ??
    (
      await prisma.user.findFirst({
        where: { role: { in: ["OWNER", "DISPATCH"] } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      })
    )?.id ??
    techs[0]?.id;

  // Generate activity history
  for (let i = 0; i < createdItems.length; i += 1) {
    const item = createdItems[i];
    const truck = trucks[i % trucks.length];
    const tech = techs[i % techs.length];
    const daysAgo = (i % 45) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.stockMove.create({
      data: {
        type: MoveType.RECEIVE,
        itemId: item.id,
        qty: 5 + (i % 20),
        toLocationId: shop.id,
        note: "[DEMO] Received from vendor",
        userId: actor,
        createdAt,
      },
    });

    if (i % 2 === 0) {
      await prisma.stockMove.create({
        data: {
          type: MoveType.TRANSFER,
          itemId: item.id,
          qty: 1 + (i % 4),
          fromLocationId: shop.id,
          toLocationId: truck.id,
          note: "[DEMO] Stocked truck",
          userId: tech.id,
          createdAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        },
      });
    }

    if (i % 3 === 0) {
      await prisma.stockMove.create({
        data: {
          type: MoveType.PULL,
          itemId: item.id,
          qty: 1 + (i % 5),
          fromLocationId: truck.id,
          jobRef: `JOB-DEMO-${1000 + i}`,
          note: "[DEMO] Pulled to job",
          userId: tech.id,
          createdAt: new Date(createdAt.getTime() + 3 * 60 * 60 * 1000),
        },
      });
    }
  }

  return getDemoStats(prisma);
}
