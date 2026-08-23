"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  requireAdmin,
  validatePassword,
} from "@/lib/auth";

function parseRole(raw: string): Role {
  return raw === "ADMIN" ? "ADMIN" : "USER";
}

async function ensureAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error("Forbidden");
  return admin;
}

export async function createUser(formData: FormData) {
  await ensureAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(String(formData.get("role") ?? "USER"));

  if (!email || !name) {
    redirect("/users?error=missing");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    redirect("/users?error=password");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/users?error=exists");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role,
      active: true,
      passwordHash: await hashPassword(password),
    },
  });

  revalidatePath("/users");
  revalidatePath("/locations");
  redirect("/users?created=1");
}

export async function updateUser(formData: FormData) {
  const admin = await ensureAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = parseRole(String(formData.get("role") ?? "USER"));
  const active = String(formData.get("active") ?? "") === "true";
  const password = String(formData.get("password") ?? "");

  if (!id || !email || !name) {
    redirect(`/users/${id || ""}?error=missing`);
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    redirect("/users?error=missing");
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id } },
    select: { id: true },
  });
  if (emailTaken) {
    redirect(`/users/${id}?error=exists`);
  }

  if (target.role === "ADMIN" && (role !== "ADMIN" || !active)) {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", active: true },
    });
    if (adminCount <= 1) {
      redirect(`/users/${id}?error=lastadmin`);
    }
  }

  if (id === admin.id && !active) {
    redirect(`/users/${id}?error=self`);
  }

  if (password) {
    const passwordError = validatePassword(password);
    if (passwordError) {
      redirect(`/users/${id}?error=password`);
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      email,
      name,
      role,
      active,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  revalidatePath("/locations");
  redirect(`/users/${id}?saved=1`);
}
