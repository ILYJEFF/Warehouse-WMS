import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  JOBBER_OAUTH_STATE_COOKIE,
  buildJobberAuthorizeUrl,
  createOAuthState,
  createPkcePair,
  jobberConfigured,
} from "@/lib/jobber";

function appBase(request: NextRequest) {
  return process.env.APP_URL?.replace(/\/$/, "") || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const base = appBase(request);
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/login", base));
  }

  if (!jobberConfigured()) {
    return NextResponse.redirect(
      new URL("/settings/integrations/jobber?error=config", base),
    );
  }

  const state = createOAuthState();
  const pkce = createPkcePair();
  const jar = await cookies();
  jar.set(
    JOBBER_OAUTH_STATE_COOKIE,
    JSON.stringify({ state, verifier: pkce.verifier }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_URL?.startsWith("https://") ?? false,
      path: "/",
      maxAge: 60 * 10,
    },
  );

  const url = buildJobberAuthorizeUrl({
    state,
    codeChallenge: pkce.challenge,
  });

  return NextResponse.redirect(url);
}
