"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearPending2fa,
  clearSession,
  createPending2fa,
  createSession,
  hashPassword,
  requireUser,
  safeRedirectPath,
  toAppRole,
  validatePassword,
  verifyPassword,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(String(formData.get("next") ?? "/"));

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const passwordError = validatePassword(password);
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    if (passwordError) {
      redirect(`/login?error=password&next=${encodeURIComponent(next)}`);
    }
    const name = String(formData.get("name") ?? "Admin").trim() || "Admin";
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
      role: "ADMIN",
    });
    await clearPending2fa();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    redirect(next);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }

  if (user.twoFactorRequired) {
    await clearSession();
    await createPending2fa(user.id, next);
    if (!user.totpConfirmed || !user.totpSecret) {
      redirect(`/login/2fa/setup?next=${encodeURIComponent(next)}`);
    }
    redirect(`/login/2fa/verify?next=${encodeURIComponent(next)}`);
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: toAppRole(user.role),
  });
  await clearPending2fa();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  await clearPending2fa();
  redirect("/login");
}

export async function ensureAuthed() {
  const user = await requireUser();
  if (!user) redirect("/login");
  return user;
}
