"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearPending2fa,
  createSession,
  createTrusted2fa,
  readPending2fa,
  toAppRole,
} from "@/lib/auth";
import { generateTotpSecret, verifyTotpCode } from "@/lib/totp";

async function requirePendingUser() {
  const pending = await readPending2fa();
  if (!pending) {
    redirect("/login?error=1");
  }
  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user || !user.twoFactorRequired) {
    await clearPending2fa();
    redirect("/login?error=1");
  }
  return { pending, user };
}

async function finishLogin(
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  },
  next: string,
  totpSecret: string,
) {
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: toAppRole(user.role),
  });
  await createTrusted2fa(user.id, totpSecret);
  await clearPending2fa();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  redirect(next);
}

export async function confirmTotpSetupAction(formData: FormData) {
  const { pending, user } = await requirePendingUser();
  const code = String(formData.get("code") ?? "");

  if (user.totpConfirmed && user.totpSecret) {
    redirect(`/login/2fa/verify?next=${encodeURIComponent(pending.next)}`);
  }

  let secret = user.totpSecret;
  if (!secret) {
    secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpConfirmed: false },
    });
  }

  if (!verifyTotpCode(secret, code, user.email)) {
    redirect(
      `/login/2fa/setup?error=code&next=${encodeURIComponent(pending.next)}`,
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpConfirmed: true, totpSecret: secret },
  });

  await finishLogin(user, pending.next, secret);
}

export async function verifyTotpLoginAction(formData: FormData) {
  const { pending, user } = await requirePendingUser();
  const code = String(formData.get("code") ?? "");

  if (!user.totpConfirmed || !user.totpSecret) {
    redirect(`/login/2fa/setup?next=${encodeURIComponent(pending.next)}`);
  }

  if (!verifyTotpCode(user.totpSecret, code, user.email)) {
    redirect(
      `/login/2fa/verify?error=code&next=${encodeURIComponent(pending.next)}`,
    );
  }

  await finishLogin(user, pending.next, user.totpSecret);
}

export async function cancelTotpAction() {
  await clearPending2fa();
  redirect("/login");
}

export async function regenerateTotpSecretAction() {
  const { pending, user } = await requirePendingUser();
  if (user.totpConfirmed) {
    redirect(`/login/2fa/verify?next=${encodeURIComponent(pending.next)}`);
  }
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpConfirmed: false },
  });
  redirect(`/login/2fa/setup?next=${encodeURIComponent(pending.next)}`);
}
