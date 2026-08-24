import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth-constants";

const PUBLIC = ["/login", "/api/health"];

function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) return null;
  return new TextEncoder().encode(value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);

  if (!token) {
    return NextResponse.redirect(login);
  }

  const secret = authSecret();
  if (!secret) {
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret);
  } catch {
    const res = NextResponse.redirect(login);
    res.cookies.delete(SESSION_COOKIE);
    res.cookies.delete(LEGACY_SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
