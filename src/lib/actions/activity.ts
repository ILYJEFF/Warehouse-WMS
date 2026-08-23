"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/** Bump lastLoginAt when the user signs in or returns after being inactive. */
export async function touchLastLogin() {
  const user = await requireUser();
  if (!user) return { ok: false as const };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { ok: true as const };
}
