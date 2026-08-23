import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { updateUser } from "@/lib/actions/users";
import { isAdmin, MIN_PASSWORD_LENGTH, requireUser, roleLabel } from "@/lib/auth";
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

  const errorMessage =
    query.error === "password"
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : query.error === "exists"
        ? "That email is already in use."
        : query.error === "missing"
          ? "Name and email are required."
          : query.error === "lastadmin"
            ? "You cannot disable or demote the last admin."
            : query.error === "self"
              ? "You cannot disable your own account."
              : null;

  return (
    <>
      <div className="content-header">
        <h1>Edit User</h1>
      </div>
      <section className="content">
        <p className="mb-3 text-sm text-[#777]">
          <Link href="/users" className="inline-flex min-h-11 items-center text-[#3c8dbc]">
            Back to users
          </Link>
        </p>

        {query.saved ? (
          <div className="mb-3 rounded-lg bg-[#dff0d8] px-3 py-3 text-sm text-[#3c763d]">
            Changes saved.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-3 rounded-lg bg-[#f2dede] px-3 py-3 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header flex flex-wrap items-center gap-2">
            <span>{user.name}</span>
            <span className="chip chip-muted">{roleLabel(user.role)}</span>
          </div>
          <div className="box-body">
            <form action={updateUser} className="grid gap-3 sm:grid-cols-2">
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
              <label className="block">
                <span className="field-label">Role</span>
                <select className="field" name="role" defaultValue={user.role}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="block">
                <span className="field-label">Status</span>
                <select
                  className="field"
                  name="active"
                  defaultValue={user.active ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
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
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
                <button type="submit" className="btn-primary btn-block-mobile sm:w-auto">
                  Save changes
                </button>
                <Link
                  href="/users"
                  className="btn-ghost btn-block-mobile no-underline sm:w-auto"
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
