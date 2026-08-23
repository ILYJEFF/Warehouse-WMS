"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CycleCountStatus, MoveType, Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authed() {
  const user = await requireUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function parseIntSafe(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

async function applyQtyDelta(
  tx: Prisma.TransactionClient,
  itemId: string,
  locationId: string,
  delta: number,
) {
  const existing = await tx.stockBalance.findUnique({
    where: { itemId_locationId: { itemId, locationId } },
  });
  const next = (existing?.qty ?? 0) + delta;
  if (next < 0) {
    throw new Error("Not enough stock at that location");
  }
  await tx.stockBalance.upsert({
    where: { itemId_locationId: { itemId, locationId } },
    create: { itemId, locationId, qty: next },
    update: { qty: next },
  });
}

function revalidateCyclePaths(countId?: string) {
  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/moves");
  revalidatePath("/cycle-counts");
  if (countId) revalidatePath(`/cycle-counts/${countId}`);
}

export async function startCycleCount(formData: FormData) {
  const user = await authed();
  const locationId = String(formData.get("locationId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const blind = String(formData.get("blind") ?? "") === "on";
  const seedMode = String(formData.get("seedMode") ?? "on_hand");

  if (!locationId) throw new Error("Location is required");

  const location = await prisma.location.findFirst({
    where: { id: locationId, active: true },
  });
  if (!location) throw new Error("Location not found");

  const openExisting = await prisma.cycleCount.findFirst({
    where: { locationId, status: CycleCountStatus.OPEN },
    select: { id: true },
  });
  if (openExisting) {
    redirect(`/cycle-counts/${openExisting.id}`);
  }

  const balances =
    seedMode === "on_hand"
      ? await prisma.stockBalance.findMany({
          where: { locationId, qty: { gt: 0 } },
          select: { itemId: true, qty: true },
          orderBy: { item: { sku: "asc" } },
        })
      : [];

  const count = await prisma.cycleCount.create({
    data: {
      locationId,
      blind,
      note,
      createdById: user.id,
      lines: {
        create: balances.map((row) => ({
          itemId: row.itemId,
          expectedQty: row.qty,
        })),
      },
    },
  });

  revalidateCyclePaths(count.id);
  redirect(`/cycle-counts/${count.id}`);
}

export async function addCycleCountLine(formData: FormData) {
  const user = await authed();
  void user;
  const cycleCountId = String(formData.get("cycleCountId") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const skuQuery = String(formData.get("sku") ?? "").trim();

  if (!cycleCountId) throw new Error("Count is required");

  const count = await prisma.cycleCount.findUnique({
    where: { id: cycleCountId },
  });
  if (!count || count.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  let resolvedItemId = itemId;
  if (!resolvedItemId && skuQuery) {
    const item = await prisma.item.findFirst({
      where: {
        active: true,
        OR: [
          { sku: { equals: skuQuery, mode: "insensitive" } },
          { sku: { contains: skuQuery, mode: "insensitive" } },
        ],
      },
      orderBy: { sku: "asc" },
    });
    if (!item) throw new Error("SKU not found");
    resolvedItemId = item.id;
  }
  if (!resolvedItemId) throw new Error("Item is required");

  const item = await prisma.item.findFirst({
    where: { id: resolvedItemId, active: true },
  });
  if (!item) throw new Error("Item not found");

  const existingLine = await prisma.cycleCountLine.findUnique({
    where: {
      cycleCountId_itemId: { cycleCountId, itemId: resolvedItemId },
    },
  });
  if (existingLine) {
    redirect(`/cycle-counts/${cycleCountId}?focus=${existingLine.id}`);
  }

  const balance = await prisma.stockBalance.findUnique({
    where: {
      itemId_locationId: {
        itemId: resolvedItemId,
        locationId: count.locationId,
      },
    },
  });

  const line = await prisma.cycleCountLine.create({
    data: {
      cycleCountId,
      itemId: resolvedItemId,
      expectedQty: balance?.qty ?? 0,
    },
  });

  revalidateCyclePaths(cycleCountId);
  redirect(`/cycle-counts/${cycleCountId}?focus=${line.id}`);
}

export async function saveCycleCountLine(formData: FormData) {
  await authed();
  const lineId = String(formData.get("lineId") ?? "").trim();
  const countedRaw = String(formData.get("countedQty") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!lineId) throw new Error("Line is required");

  const line = await prisma.cycleCountLine.findUnique({
    where: { id: lineId },
    include: { cycleCount: true },
  });
  if (!line || line.cycleCount.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  const countedQty =
    countedRaw === "" ? null : Math.max(0, parseIntSafe(countedRaw));

  await prisma.cycleCountLine.update({
    where: { id: lineId },
    data: { countedQty, note },
  });

  revalidateCyclePaths(line.cycleCountId);
}

export async function clearCycleCountLine(formData: FormData) {
  await authed();
  const lineId = String(formData.get("lineId") ?? "").trim();
  if (!lineId) throw new Error("Line is required");

  const line = await prisma.cycleCountLine.findUnique({
    where: { id: lineId },
    include: { cycleCount: true },
  });
  if (!line || line.cycleCount.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  await prisma.cycleCountLine.update({
    where: { id: lineId },
    data: { countedQty: null },
  });

  revalidateCyclePaths(line.cycleCountId);
}

export async function removeCycleCountLine(formData: FormData) {
  await authed();
  const lineId = String(formData.get("lineId") ?? "").trim();
  if (!lineId) throw new Error("Line is required");

  const line = await prisma.cycleCountLine.findUnique({
    where: { id: lineId },
    include: { cycleCount: true },
  });
  if (!line || line.cycleCount.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  await prisma.cycleCountLine.delete({ where: { id: lineId } });
  revalidateCyclePaths(line.cycleCountId);
}

export async function cancelCycleCount(formData: FormData) {
  await authed();
  const cycleCountId = String(formData.get("cycleCountId") ?? "").trim();
  if (!cycleCountId) throw new Error("Count is required");

  const count = await prisma.cycleCount.findUnique({
    where: { id: cycleCountId },
  });
  if (!count || count.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  await prisma.cycleCount.update({
    where: { id: cycleCountId },
    data: { status: CycleCountStatus.CANCELLED },
  });

  revalidateCyclePaths(cycleCountId);
  redirect("/cycle-counts");
}

export async function postCycleCount(formData: FormData) {
  const user = await authed();
  const cycleCountId = String(formData.get("cycleCountId") ?? "").trim();
  if (!cycleCountId) throw new Error("Count is required");

  const count = await prisma.cycleCount.findUnique({
    where: { id: cycleCountId },
    include: {
      lines: { include: { item: { select: { sku: true } } } },
      location: { select: { code: true } },
    },
  });
  if (!count || count.status !== CycleCountStatus.OPEN) {
    throw new Error("Count is not open");
  }

  const countedLines = count.lines.filter((line) => line.countedQty !== null);
  if (countedLines.length === 0) {
    throw new Error("Enter at least one counted quantity before posting");
  }

  await prisma.$transaction(async (tx) => {
    for (const line of countedLines) {
      const countedQty = line.countedQty ?? 0;
      const existing = await tx.stockBalance.findUnique({
        where: {
          itemId_locationId: {
            itemId: line.itemId,
            locationId: count.locationId,
          },
        },
      });
      const current = existing?.qty ?? 0;
      const delta = countedQty - current;
      if (delta === 0) continue;

      await applyQtyDelta(tx, line.itemId, count.locationId, delta);
      await tx.stockMove.create({
        data: {
          type: MoveType.ADJUST,
          itemId: line.itemId,
          qty: Math.abs(delta),
          fromLocationId: delta < 0 ? count.locationId : null,
          toLocationId: delta > 0 ? count.locationId : null,
          note: `Cycle count ${count.location.code}: set to ${countedQty} (was ${current}, expected ${line.expectedQty})`,
          userId: user.id,
        },
      });
    }

    await tx.cycleCount.update({
      where: { id: cycleCountId },
      data: {
        status: CycleCountStatus.POSTED,
        postedAt: new Date(),
        postedById: user.id,
      },
    });
  });

  revalidateCyclePaths(cycleCountId);
  redirect(`/cycle-counts/${cycleCountId}?posted=1`);
}
