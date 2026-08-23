"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  isAdmin,
  requireAdmin,
  validatePassword,
} from "@/lib/auth";

/** Persist roles Neon already has. UI still shows Admin / User. */
function parseRole(raw: string): Role {
  return raw === "ADMIN" ? "OWNER" : "TECH";
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
  const nextIsAdmin = isAdmin(role);
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

  if (isAdmin(target.role) && !nextIsAdmin) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["OWNER", "DISPATCH"] } },
      select: { id: true },
    });
    if (admins.length <= 1 && admins[0]?.id === id) {
      redirect(`/users/${id}?error=lastadmin`);
    }
  }

  if (password) {
    const passwordError = validatePassword(password);
    if (passwordError) {
      redirect(`/users/${id}?error=password`);
    }
  }

  if (id === admin.id && !nextIsAdmin) {
    redirect(`/users/${id}?error=self`);
  }

  await prisma.user.update({
    where: { id },
    data: {
      email,
      name,
      role,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}`);
  revalidatePath("/locations");
  redirect(`/users/${id}?saved=1`);
}
