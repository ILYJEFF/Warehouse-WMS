import Link from "next/link";
import { redirect } from "next/navigation";
import {
  cancelTotpAction,
  verifyTotpLoginAction,
} from "@/lib/actions/two-factor";
import {
  clearPending2fa,
  readPending2fa,
  readSession,
  safeRedirectPath,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TwoFactorVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await readSession();
  if (session) redirect("/");

  const pending = await readPending2fa();
  if (!pending) redirect("/login?error=1");

  const params = await searchParams;
  const next = safeRedirectPath(params.next ?? pending.next);

  const user = await prisma.user.findUnique({ where: { id: pending.userId } });
  if (!user || !user.twoFactorRequired) {
    await clearPending2fa();
    redirect("/login?error=1");
  }

  if (!user.totpConfirmed || !user.totpSecret) {
    redirect(`/login/2fa/setup?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="login-shell">
      <header className="bg-[#3c8dbc] px-4 py-4 text-center text-lg font-light text-white">
        Techchefs WMS
      </header>
      <div className="flex flex-1 justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div className="w-full max-w-md self-start">
          <div className="box box-primary">
            <div className="box-body p-5 sm:p-6">
              <p className="m-0 text-center text-lg">Two-factor authentication</p>
              <p className="mt-2 mb-0 text-center text-sm text-[#777]">
                Enter the 6-digit code from your authenticator app for{" "}
                <span className="font-medium text-[#333]">{user.email}</span>.
              </p>

              {params.error === "code" ? (
                <p className="mt-4 rounded-lg bg-[#f2dede] px-3 py-3 text-center text-sm text-[#a94442]">
                  That code did not match. Try again with a fresh code.
                </p>
              ) : null}

              <form action={verifyTotpLoginAction} className="mt-6 space-y-4">
                <input type="hidden" name="next" value={next} />
                <label className="block">
                  <span className="field-label">Authentication code</span>
                  <input
                    className="field text-center font-mono text-lg tracking-[0.35em]"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9 ]{6,8}"
                    maxLength={8}
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </label>
                <button type="submit" className="btn-primary w-full">
                  Verify and sign in
                </button>
              </form>

              <div className="mt-4 text-center text-sm">
                <form action={cancelTotpAction}>
                  <button type="submit" className="text-[#777] underline">
                    Back to sign in
                  </button>
                </form>
              </div>
              <p className="mt-4 mb-0 text-center text-xs text-[#999]">
                Lost your authenticator? Ask an admin to reset 2FA on your account.{" "}
                <Link href="/login" className="text-[#3c8dbc]">
                  Different account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
