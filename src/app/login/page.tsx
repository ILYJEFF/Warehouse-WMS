import { prisma } from "@/lib/prisma";
import { loginAction } from "@/lib/actions/auth";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await readSession();
  if (session) redirect("/");

  const params = await searchParams;
  const userCount = await prisma.user.count();
  const firstRun = userCount === 0;

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
                />
              </label>
              <label className="block">
                <span className="field-label">Password</span>
                <input className="field" type="password" name="password" required />
              </label>
              <button type="submit" className="btn-primary w-full">
                {firstRun ? "Register" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
