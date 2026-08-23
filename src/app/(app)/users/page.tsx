import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { createUser } from "@/lib/actions/users";
import {
  isAdmin,
  MIN_PASSWORD_LENGTH,
  requireUser,
  roleLabel,
  toAppRole,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const params = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const errorMessage =
    params.error === "password"
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : params.error === "exists"
        ? "That email is already in use."
        : params.error === "missing"
          ? "Name and email are required."
          : null;

  return (
    <>
      <div className="content-header">
        <h1>Users</h1>
      </div>
      <section className="content">
        {params.created ? (
          <div className="mb-3 rounded-lg bg-[#dff0d8] px-3 py-3 text-sm text-[#3c763d]">
            User created.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-3 rounded-lg bg-[#f2dede] px-3 py-3 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header flex items-center gap-2">
            <Users className="h-4 w-4" />
            Add User
          </div>
          <div className="box-body">
            <form action={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="field-label">Name</span>
                <input className="field" name="name" required autoComplete="off" />
              </label>
              <label className="block">
                <span className="field-label">Email</span>
                <input
                  className="field"
                  type="email"
                  name="email"
                  required
                  autoComplete="off"
                  inputMode="email"
                />
              </label>
              <label className="block">
                <span className="field-label">Role</span>
                <select className="field" name="role" defaultValue="USER">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="field-label">
                  Temporary password (min {MIN_PASSWORD_LENGTH} chars)
                </span>
                <input
                  className="field"
                  type="password"
                  name="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </label>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn-primary btn-block-mobile lg:w-auto">
                  Create user
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="box">
          <div className="box-header">All Users</div>
          <div className="box-body p-0">
            <div className="mobile-only mobile-card-list">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="mobile-user-card"
                >
                  <div className="mobile-user-card-top">
                    <div>
                      <p className="mobile-user-card-name">{user.name}</p>
                      <p className="mobile-user-card-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="mobile-user-card-meta">
                    <span
                      className={
                        isAdmin(user.role) ? "chip chip-ok" : "chip chip-muted"
                      }
                    >
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <div className="mobile-user-card-action">Edit user</div>
                </Link>
              ))}
            </div>

            <div className="table-wrap table-desktop-only">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={
                            isAdmin(user.role) ? "chip chip-ok" : "chip chip-muted"
                          }
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/users/${user.id}`} className="text-[#3c8dbc]">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
