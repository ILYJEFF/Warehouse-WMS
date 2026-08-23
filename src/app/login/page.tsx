import { loginAction } from "@/lib/actions/auth";
import { MIN_PASSWORD_LENGTH, readSession, safeRedirectPath } from "@/lib/auth";
import { getDbStatus } from "@/lib/db-health";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await readSession();
  if (session) redirect("/");

  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const dbStatus = await getDbStatus();

  let firstRun = false;
  if (dbStatus.ok) {
    try {
      firstRun = (await prisma.user.count()) === 0;
    } catch {
      // handled by dbStatus banner on next request
    }
  }

  const errorMessage =
    params.error === "password"
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : params.error
        ? "Invalid email or password."
        : null;

  return (
    <div className="login-shell">
      <header className="bg-[#3c8dbc] px-4 py-4 text-center text-lg font-light text-white">
        Techchefs WMS
      </header>
      <div className="flex flex-1 justify-center px-3 py-6 sm:px-4 sm:py-10">
        <div className="box box-primary w-full max-w-md self-start">
          <div className="box-body p-5 sm:p-6">
            <p className="m-0 text-center text-lg">
              {firstRun ? "Create the first admin account" : "Sign in to start your session"}
            </p>
            {!dbStatus.ok ? (
              <div className="mt-4 rounded-lg bg-[#fcf8e3] px-3 py-3 text-sm text-[#8a6d3b]">
                <p className="m-0 font-semibold">Database not configured</p>
                <p className="mt-2 mb-0">{dbStatus.message}</p>
                <p className="mt-2 mb-0 text-xs">
                  On Vercel: add DATABASE_URL (cloud Postgres, not your NAS IP), AUTH_SECRET,
                  and APP_URL, then redeploy.
                </p>
              </div>
            ) : null}
            {errorMessage ? (
              <p className="mt-4 rounded-lg bg-[#f2dede] px-3 py-3 text-center text-sm text-[#a94442]">
                {errorMessage}
              </p>
            ) : null}
            <form action={loginAction} className="mt-6 space-y-4">
              <input type="hidden" name="next" value={next} />
              {firstRun ? (
                <label className="block">
                  <span className="field-label">Name</span>
                  <input className="field" name="name" defaultValue="Admin" required />
                </label>
              ) : null}
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  className="field"
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  inputMode="email"
                  disabled={!dbStatus.ok}
                />
              </label>
              <label className="block">
                <span className="field-label">Password</span>
                <input
                  className="field"
                  type="password"
                  name="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete={firstRun ? "new-password" : "current-password"}
                  disabled={!dbStatus.ok}
                />
              </label>
              {firstRun ? (
                <p className="m-0 text-xs text-[#777]">
                  First account is always an Admin. Minimum {MIN_PASSWORD_LENGTH} character
                  password.
                </p>
              ) : null}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!dbStatus.ok}
              >
                {firstRun ? "Create admin" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
