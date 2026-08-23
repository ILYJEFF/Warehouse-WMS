import Link from "next/link";
import { redirect } from "next/navigation";
import {
  cancelTotpAction,
  confirmTotpSetupAction,
  regenerateTotpSecretAction,
} from "@/lib/actions/two-factor";
import {
  clearPending2fa,
  readPending2fa,
  readSession,
  safeRedirectPath,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateTotpSecret,
  getTotpQrDataUrl,
  getTotpUri,
} from "@/lib/totp";

export default async function TwoFactorSetupPage({
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

  if (user.totpConfirmed && user.totpSecret) {
    redirect(`/login/2fa/verify?next=${encodeURIComponent(next)}`);
  }

  let secret = user.totpSecret;
  if (!secret) {
    secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, totpConfirmed: false },
    });
  }

  const qrDataUrl = await getTotpQrDataUrl(secret, user.email);
  const otpauthUri = getTotpUri(secret, user.email);

  return (
    <div className="login-shell">
      <header className="bg-[#3c8dbc] px-4 py-4 text-center text-lg font-light text-white">
        Techchefs WMS
      </header>
      <div className="flex flex-1 justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div className="w-full max-w-md self-start">
          <div className="box box-primary">
            <div className="box-body p-5 sm:p-6">
              <p className="m-0 text-center text-lg">Set up authenticator</p>
              <p className="mt-2 mb-0 text-center text-sm text-[#777]">
                Scan this QR code with Google Authenticator, Authy, or 1Password,
                then enter the 6-digit code. This browser will be trusted for 7 days.
              </p>

              {params.error === "code" ? (
                <p className="mt-4 rounded-lg bg-[#f2dede] px-3 py-3 text-center text-sm text-[#a94442]">
                  That code did not match. Try the newest code from your app.
                </p>
              ) : null}

              <div className="mt-5 flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="Authenticator QR code"
                  width={220}
                  height={220}
                  className="rounded border border-[#ddd] bg-white p-2"
                />
                <p className="m-0 max-w-full break-all text-center font-mono text-xs text-[#555]">
                  {secret}
                </p>
                <p className="m-0 text-center text-xs text-[#999]">
                  Can&apos;t scan? Enter the key above, or use{" "}
                  <a href={otpauthUri} className="text-[#3c8dbc] underline">
                    this link
                  </a>{" "}
                  on your phone.
                </p>
              </div>

              <form action={confirmTotpSetupAction} className="mt-6 space-y-4">
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
                  Confirm and sign in
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <form action={regenerateTotpSecretAction}>
                  <button type="submit" className="text-[#3c8dbc] underline">
                    New QR code
                  </button>
                </form>
                <form action={cancelTotpAction}>
                  <button type="submit" className="text-[#777] underline">
                    Back to sign in
                  </button>
                </form>
              </div>
              <p className="mt-4 mb-0 text-center text-xs text-[#999]">
                Continuing as {user.email}.{" "}
                <Link href="/login" className="text-[#3c8dbc]">
                  Use a different account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
