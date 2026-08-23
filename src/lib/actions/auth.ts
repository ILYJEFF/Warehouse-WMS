"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const name = String(formData.get("name") ?? "Owner").trim() || "Owner";
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
        role: "OWNER",
      },
    });
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    redirect(next || "/");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  redirect(next || "/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function ensureAuthed() {
  const user = await requireUser();
  if (!user) redirect("/login");
  return user;
}
