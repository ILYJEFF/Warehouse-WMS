import Link from "next/link";
import { redirect } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AddUserPanel } from "@/components/add-user-panel";
import {
  isAdmin,
  MIN_PASSWORD_LENGTH,
  requireUser,
  roleLabel,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatLastLogin(value: Date | null) {
  if (!value) return { relative: "Never", absolute: "No login recorded" };
  return {
    relative: formatDistanceToNowStrict(value, { addSuffix: true }),
    absolute: format(value, "MMM d, yyyy h:mm a"),
  };
}

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
      lastLoginAt: true,
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

  const openForm = Boolean(params.error);

  return (
    <>
      <div className="content-header">
        <h1>Users</h1>
      </div>
      <section className="content">
        {params.created ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            User created.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded bg-[#f2dede] px-3 py-2 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <AddUserPanel defaultOpen={openForm} />

        <div className="box">
          <div className="box-header">All Users</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last login</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const last = formatLastLogin(user.lastLoginAt);
                    return (
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
                          <div>{last.relative}</div>
                          <div className="text-xs text-muted">{last.absolute}</div>
                        </td>
                        <td>
                          <Link href={`/users/${user.id}`} className="text-[#3c8dbc]">
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
