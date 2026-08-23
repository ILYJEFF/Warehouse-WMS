"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LocationKind, MoveType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

async function authed() {
  const user = await requireUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function parseIntSafe(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function createItem(formData: FormData) {
  await authed();
  const sku = String(formData.get("sku") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!sku || !name) throw new Error("SKU and name are required");

  await prisma.item.create({
    data: {
      sku,
      name,
      category: String(formData.get("category") ?? "General").trim() || "General",
      unit: String(formData.get("unit") ?? "ea").trim() || "ea",
      reorderPoint: Math.max(0, parseIntSafe(formData.get("reorderPoint"))),
      unitCostCents: Math.max(0, Math.round(Number(formData.get("unitCost") ?? 0) * 100)),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  revalidatePath("/items");
  revalidatePath("/");
  revalidatePath("/stock");
}

export async function updateItem(formData: FormData) {
  await authed();
  const id = String(formData.get("id") ?? "").trim();
  const sku = String(formData.get("sku") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !sku || !name) throw new Error("SKU and name are required");

  const skuTaken = await prisma.item.findFirst({
    where: { sku, NOT: { id } },
    select: { id: true },
  });
  if (skuTaken) throw new Error("That SKU is already in use");

  await prisma.item.update({
    where: { id },
    data: {
      sku,
      name,
      category: String(formData.get("category") ?? "General").trim() || "General",
      unit: String(formData.get("unit") ?? "ea").trim() || "ea",
      reorderPoint: Math.max(0, parseIntSafe(formData.get("reorderPoint"))),
      unitCostCents: Math.max(0, Math.round(Number(formData.get("unitCost") ?? 0) * 100)),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  revalidatePath("/");
  revalidatePath("/stock");
  redirect(`/items/${id}?saved=1`);
}

export async function createLocation(formData: FormData) {
  await authed();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) throw new Error("Code and name are required");

  const kindRaw = String(formData.get("kind") ?? "SHOP");
  const kind = (["SHOP", "TRUCK", "OTHER"].includes(kindRaw)
    ? kindRaw
    : "SHOP") as LocationKind;

  const assignedUserIdRaw = String(formData.get("assignedUserId") ?? "").trim();
  const assignedUserId =
    kind === "TRUCK" && assignedUserIdRaw ? assignedUserIdRaw : null;

  if (assignedUserId) {
    const user = await prisma.user.findUnique({ where: { id: assignedUserId } });
    if (!user) throw new Error("Assigned person not found");
  }

  await prisma.location.create({
    data: { code, name, kind, assignedUserId },
  });
  revalidatePath("/locations");
  revalidatePath("/stock");
  revalidatePath("/");
}

export async function assignTruckPerson(formData: FormData) {
  await authed();
  const locationId = String(formData.get("locationId") ?? "").trim();
  const assignedUserIdRaw = String(formData.get("assignedUserId") ?? "").trim();
  const assignedUserId = assignedUserIdRaw || null;

  if (!locationId) throw new Error("Location is required");

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  if (!location) throw new Error("Location not found");
  if (location.kind !== "TRUCK") {
    throw new Error("Only trucks can be assigned to a person");
  }

  if (assignedUserId) {
    const user = await prisma.user.findUnique({ where: { id: assignedUserId } });
    if (!user) throw new Error("Assigned person not found");
  }

  await prisma.location.update({
    where: { id: locationId },
    data: { assignedUserId },
  });

  revalidatePath("/locations");
  revalidatePath(`/locations/${locationId}`);
  revalidatePath("/stock");
  revalidatePath("/");
  revalidatePath("/receive");
  revalidatePath("/pull");
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

export async function receiveStock(formData: FormData) {
  const user = await authed();
  const itemId = String(formData.get("itemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const qty = parseIntSafe(formData.get("qty"));
  const note = String(formData.get("note") ?? "").trim() || null;
  const jobRef = String(formData.get("poRef") ?? "").trim() || null;

  if (!itemId || !locationId || qty <= 0) {
    throw new Error("Item, location, and positive qty are required");
  }

  await prisma.$transaction(async (tx) => {
    await applyQtyDelta(tx, itemId, locationId, qty);
    await tx.stockMove.create({
      data: {
        type: MoveType.RECEIVE,
        itemId,
        qty,
        toLocationId: locationId,
        note,
        jobRef,
        userId: user.id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/moves");
  revalidatePath("/receive");
}

export async function pullStock(formData: FormData) {
  const user = await authed();
  const itemId = String(formData.get("itemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const qty = parseIntSafe(formData.get("qty"));
  const jobRef = String(formData.get("jobRef") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!itemId || !locationId || qty <= 0) {
    throw new Error("Item, location, and positive qty are required");
  }

  await prisma.$transaction(async (tx) => {
    await applyQtyDelta(tx, itemId, locationId, -qty);
    await tx.stockMove.create({
      data: {
        type: MoveType.PULL,
        itemId,
        qty,
        fromLocationId: locationId,
        jobRef,
        note,
        userId: user.id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/moves");
  revalidatePath("/pull");
}

export async function adjustStock(formData: FormData) {
  const user = await authed();
  const itemId = String(formData.get("itemId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const qty = parseIntSafe(formData.get("qty"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!itemId || !locationId) throw new Error("Item and location are required");

  await prisma.$transaction(async (tx) => {
    const existing = await tx.stockBalance.findUnique({
      where: { itemId_locationId: { itemId, locationId } },
    });
    const current = existing?.qty ?? 0;
    const delta = qty - current;
    await applyQtyDelta(tx, itemId, locationId, delta);
    await tx.stockMove.create({
      data: {
        type: MoveType.ADJUST,
        itemId,
        qty: Math.abs(delta),
        fromLocationId: delta < 0 ? locationId : null,
        toLocationId: delta > 0 ? locationId : null,
        note: note ?? `Set on-hand to ${qty}`,
        userId: user.id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/moves");
}

export async function transferStock(formData: FormData) {
  const user = await authed();
  const itemId = String(formData.get("itemId") ?? "");
  const fromLocationId = String(formData.get("fromLocationId") ?? "");
  const toLocationId = String(formData.get("toLocationId") ?? "");
  const qty = parseIntSafe(formData.get("qty"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!itemId || !fromLocationId || !toLocationId || qty <= 0) {
    throw new Error("Item, from, to, and positive qty are required");
  }
  if (fromLocationId === toLocationId) {
    throw new Error("From and to must differ");
  }

  await prisma.$transaction(async (tx) => {
    await applyQtyDelta(tx, itemId, fromLocationId, -qty);
    await applyQtyDelta(tx, itemId, toLocationId, qty);
    await tx.stockMove.create({
      data: {
        type: MoveType.TRANSFER,
        itemId,
        qty,
        fromLocationId,
        toLocationId,
        note,
        userId: user.id,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/stock");
  revalidatePath("/moves");
}
