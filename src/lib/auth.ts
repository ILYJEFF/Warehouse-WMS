import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { MIN_PASSWORD_LENGTH, SESSION_COOKIE } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

export { MIN_PASSWORD_LENGTH, SESSION_COOKIE };

export type AppRole = "ADMIN" | "USER";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET must be at least 16 characters");
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

/** OWNER/DISPATCH kept for older Neon rows; treat as Admin. */
export function isAdmin(role: Role | AppRole | string) {
  return role === "ADMIN" || role === "OWNER" || role === "DISPATCH";
}

export function toAppRole(role: Role | AppRole | string): AppRole {
  return isAdmin(role) ? "ADMIN" : "USER";
}

export function roleLabel(role: Role | AppRole | string) {
  return isAdmin(role) ? "Admin" : "User";
}

export function validatePassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

/** Only allow same-origin relative paths (blocks open redirects). */
export function safeRedirectPath(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: String(payload.name ?? ""),
      role: toAppRole(String(payload.role ?? "USER")),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toAppRole(user.role),
  } satisfies SessionUser;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || !isAdmin(user.role)) return null;
  return user;
}
