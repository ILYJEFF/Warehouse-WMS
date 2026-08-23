import { loginAction } from "@/lib/actions/auth";
import { readSession } from "@/lib/auth";
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
  const dbStatus = await getDbStatus();

  let firstRun = false;
  if (dbStatus.ok) {
    try {
      firstRun = (await prisma.user.count()) === 0;
    } catch {
      // handled by dbStatus banner on next request
    }
  }

  return (
    <div className="min-h-screen bg-[#ecf0f5]">
      <header className="bg-[#3c8dbc] px-4 py-3 text-center text-lg font-light text-white">
        Techchefs WMS
      </header>
      <div className="flex justify-center px-4 py-10">
        <div className="box box-primary w-full max-w-md">
          <div className="box-body p-6">
            <p className="m-0 text-center text-lg">
              {firstRun ? "Create your account" : "Sign in to start your session"}
            </p>
            {!dbStatus.ok ? (
              <div className="mt-4 rounded bg-[#fcf8e3] px-3 py-3 text-sm text-[#8a6d3b]">
                <p className="m-0 font-semibold">Database not configured</p>
                <p className="mt-2 mb-0">{dbStatus.message}</p>
                <p className="mt-2 mb-0 text-xs">
                  On Vercel: add DATABASE_URL (cloud Postgres, not your NAS IP), AUTH_SECRET,
                  and APP_URL, then redeploy.
                </p>
              </div>
            ) : null}
            {params.error ? (
              <p className="mt-4 rounded bg-[#f2dede] px-3 py-2 text-center text-sm text-[#a94442]">
                Invalid email or password.
              </p>
            ) : null}
            <form action={loginAction} className="mt-6 space-y-4">
              <input type="hidden" name="next" value={params.next ?? "/"} />
              {firstRun ? (
                <label className="block">
                  <span className="field-label">Name</span>
                  <input className="field" name="name" defaultValue="Dispatch" required />
                </label>
              ) : null}
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  className="field"
                  type="email"
                  name="email"
                  defaultValue="dispatch@techchefstx.com"
                  required
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
                  disabled={!dbStatus.ok}
                />
              </label>
              <button type="submit" className="btn-primary w-full" disabled={!dbStatus.ok}>
                {firstRun ? "Register" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
