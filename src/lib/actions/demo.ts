"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  clearDemoData,
  demoStatsTotal,
  getDemoStats,
  seedDemoData,
} from "@/lib/demo-seed";
import { prisma } from "@/lib/prisma";

async function ensureAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return admin;
}

function revalidateAll() {
  for (const path of [
    "/",
    "/settings",
    "/items",
    "/locations",
    "/stock",
    "/receive",
    "/pull",
    "/purchasing",
    "/top-skus",
    "/moves",
    "/vendors",
    "/tags",
    "/users",
  ]) {
    revalidatePath(path);
  }
}

export async function loadDemoDataAction() {
  const admin = await ensureAdmin();
  const stats = await seedDemoData(prisma, admin.id);
  revalidateAll();
  redirect(`/settings?demo=loaded&items=${stats.items}&moves=${stats.moves}`);
}

export async function clearDemoDataAction() {
  await ensureAdmin();
  const before = await getDemoStats(prisma);
  if (demoStatsTotal(before) === 0) {
    redirect("/settings?demo=empty");
  }
  await clearDemoData(prisma);
  revalidateAll();
  redirect("/settings?demo=cleared");
}
