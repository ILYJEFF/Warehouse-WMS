"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

async function ensureAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return admin;
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function createVendor(formData: FormData) {
  await ensureAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/vendors?error=missing");
  }

  const existing = await prisma.vendor.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    redirect("/vendors?error=exists");
  }

  await prisma.vendor.create({
    data: {
      name,
      code: clean(formData.get("code")),
      phone: clean(formData.get("phone")),
      email: clean(formData.get("email")),
      website: clean(formData.get("website")),
      notes: clean(formData.get("notes")),
      active: true,
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/purchasing");
  revalidatePath("/settings");
  revalidatePath("/items");
  redirect("/vendors?created=1");
}

export async function updateVendor(formData: FormData) {
  await ensureAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) {
    redirect(`/vendors?error=missing`);
  }

  const taken = await prisma.vendor.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      NOT: { id },
    },
    select: { id: true },
  });
  if (taken) {
    redirect(`/vendors?error=exists`);
  }

  const active =
    formData.get("active") === "on" || formData.get("active") === "true";

  await prisma.vendor.update({
    where: { id },
    data: {
      name,
      code: clean(formData.get("code")),
      phone: clean(formData.get("phone")),
      email: clean(formData.get("email")),
      website: clean(formData.get("website")),
      notes: clean(formData.get("notes")),
      active,
    },
  });

  revalidatePath("/vendors");
  revalidatePath("/purchasing");
  revalidatePath("/settings");
  revalidatePath("/items");
  redirect("/vendors?saved=1");
}

export async function deleteVendor(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/vendors?error=missing");

  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/vendors");
  revalidatePath("/purchasing");
  revalidatePath("/settings");
  revalidatePath("/items");
  redirect("/vendors?deleted=1");
}
