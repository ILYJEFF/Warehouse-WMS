import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { updateUser } from "@/lib/actions/users";
import {
  isAdmin,
  MIN_PASSWORD_LENGTH,
  requireUser,
  roleLabel,
  toAppRole,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const { id } = await params;
  const query = await searchParams;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const appRole = toAppRole(user.role);

  const errorMessage =
    query.error === "password"
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : query.error === "exists"
        ? "That email is already in use."
        : query.error === "missing"
          ? "Name and email are required."
          : query.error === "lastadmin"
            ? "You cannot demote the last admin."
            : query.error === "self"
              ? "You cannot demote your own account."
              : null;

  return (
    <>
      <div className="content-header">
        <div className="content-header-row">
          <BackButton href="/users" label="Back to users" />
        </div>
        <h1>Edit User</h1>
      </div>
      <section className="content">
        {query.saved ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            Changes saved.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded bg-[#f2dede] px-3 py-2 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header flex flex-wrap items-center gap-2">
            <span>{user.name}</span>
            <span className="chip chip-muted">{roleLabel(user.role)}</span>
          </div>
          <div className="box-body">
            <form action={updateUser} className="grid max-w-2xl gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={user.id} />
              <label className="block">
                <span className="field-label">Name</span>
                <input
                  className="field"
                  name="name"
                  defaultValue={user.name}
                  required
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  className="field"
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  required
                  autoComplete="off"
                  inputMode="email"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="field-label">Role</span>
                <select className="field" name="role" defaultValue={appRole}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="field-label">
                  New password (leave blank to keep current)
                </span>
                <input
                  className="field"
                  type="password"
                  name="password"
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  placeholder={`Optional, min ${MIN_PASSWORD_LENGTH} characters`}
                />
              </label>

              <div className="sm:col-span-2 rounded border border-[#ddd] bg-[#fafafa] p-3">
                <p className="m-0 mb-2 text-sm font-semibold text-[#333]">
                  Authenticator (2FA)
                </p>
                <p className="m-0 mb-3 text-xs text-[#777]">
                  When required, this user must enter a code from an authenticator
                  app after password sign-in.
                </p>
                <label className="mb-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="twoFactorRequired"
                    value="true"
                    defaultChecked={user.twoFactorRequired}
                    className="mt-1"
                  />
                  <span>
                    Require authenticator app
                    {user.totpConfirmed ? (
                      <span className="ml-2 chip chip-ok">Enrolled</span>
                    ) : user.twoFactorRequired ? (
                      <span className="ml-2 chip chip-muted">Pending setup</span>
                    ) : null}
                  </span>
                </label>
                {user.totpConfirmed || user.totpSecret ? (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="resetTotp"
                      value="true"
                      className="mt-1"
                    />
                    <span>
                      Reset authenticator (clears current enrollment; they set up
                      again on next login)
                    </span>
                  </label>
                ) : null}
              </div>

              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="btn-primary">
                  Save changes
                </button>
                <Link
                  href="/users"
                  className="btn-ghost no-underline"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
