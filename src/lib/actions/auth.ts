"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  hashPassword,
  MIN_PASSWORD_LENGTH,
  requireUser,
  safeRedirectPath,
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
        role: "ADMIN",
        active: true,
      },
    });
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    redirect(next);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.active ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    redirect("/login?error=1");
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  redirect(next);
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

export { MIN_PASSWORD_LENGTH };
