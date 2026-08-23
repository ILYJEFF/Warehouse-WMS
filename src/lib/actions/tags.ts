"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { TAG_COLOR_PRESETS, normalizeTagName } from "@/lib/tags";

async function ensureAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return admin;
}

function parseColor(raw: string) {
  const color = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  return TAG_COLOR_PRESETS[0];
}

export async function createTag(formData: FormData) {
  await ensureAdmin();

  const name = normalizeTagName(String(formData.get("name") ?? ""));
  const color = parseColor(String(formData.get("color") ?? ""));

  if (!name) {
    redirect("/tags?error=missing");
  }

  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) {
    redirect("/tags?error=exists");
  }

  await prisma.tag.create({ data: { name, color } });
  revalidatePath("/tags");
  revalidatePath("/items");
  revalidatePath("/settings");
  redirect("/tags?created=1");
}

export async function updateTag(formData: FormData) {
  await ensureAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = normalizeTagName(String(formData.get("name") ?? ""));
  const color = parseColor(String(formData.get("color") ?? ""));

  if (!id || !name) {
    redirect(`/tags?error=missing`);
  }

  const taken = await prisma.tag.findFirst({
    where: { name, NOT: { id } },
    select: { id: true },
  });
  if (taken) {
    redirect(`/tags?error=exists`);
  }

  await prisma.tag.update({
    where: { id },
    data: { name, color },
  });

  revalidatePath("/tags");
  revalidatePath("/items");
  revalidatePath("/settings");
  redirect("/tags?saved=1");
}

export async function deleteTag(formData: FormData) {
  await ensureAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/tags?error=missing");
  }

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/tags");
  revalidatePath("/items");
  revalidatePath("/settings");
  redirect("/tags?deleted=1");
}
