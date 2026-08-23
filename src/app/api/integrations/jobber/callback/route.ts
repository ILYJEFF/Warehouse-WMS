import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  JOBBER_OAUTH_STATE_COOKIE,
  exchangeJobberCode,
} from "@/lib/jobber";
import { saveJobberTokens } from "@/lib/jobber-connection";

function appBase(request: NextRequest) {
  return process.env.APP_URL?.replace(/\/$/, "") || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const base = appBase(request);
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/settings/integrations/jobber?error=denied`, base),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/settings/integrations/jobber?error=missing`, base),
    );
  }

  const jar = await cookies();
  const raw = jar.get(JOBBER_OAUTH_STATE_COOKIE)?.value;
  jar.delete(JOBBER_OAUTH_STATE_COOKIE);

  let stored: { state?: string; verifier?: string } | null = null;
  try {
    stored = raw ? (JSON.parse(raw) as { state?: string; verifier?: string }) : null;
  } catch {
    stored = null;
  }

  if (!stored?.state || !stored.verifier || stored.state !== state) {
    return NextResponse.redirect(
      new URL(`/settings/integrations/jobber?error=state`, base),
    );
  }

  try {
    const tokens = await exchangeJobberCode(code, stored.verifier);
    await saveJobberTokens(tokens);
    return NextResponse.redirect(
      new URL(`/settings/integrations/jobber?connected=1`, base),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/settings/integrations/jobber?error=token`, base),
    );
  }
}
