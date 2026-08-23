import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { VendorsTable } from "@/components/vendors-table";
import { createVendor, updateVendor } from "@/lib/actions/vendors";
import { isAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    saved?: string;
    deleted?: string;
    error?: string;
    edit?: string;
  }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const params = await searchParams;
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  const editing = params.edit
    ? vendors.find((vendor) => vendor.id === params.edit) ?? null
    : null;

  const errorMessage =
    params.error === "missing"
      ? "Vendor name is required."
      : params.error === "exists"
        ? "That vendor name is already in use."
        : null;

  const successMessage = params.created
    ? "Vendor created."
    : params.saved
      ? "Vendor updated."
      : params.deleted
        ? "Vendor deleted."
        : null;

  return (
    <>
      <div className="content-header">
        <div className="content-header-row">
          <BackButton href="/settings" label="Back to settings" />
        </div>
        <h1>Vendors</h1>
      </div>
      <section className="content">
        <p className="mb-4 text-sm text-[#777]">
          <Link href="/purchasing" className="text-[#3c8dbc]">
            Open purchasing list
          </Link>
        </p>
        {successMessage ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded bg-[#f2dede] px-3 py-2 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header">
            {editing ? `Edit ${editing.name}` : "Add vendor"}
          </div>
          <div className="box-body">
            <form
              action={editing ? updateVendor : createVendor}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <label className="block">
                <span className="field-label">Name</span>
                <input
                  className="field"
                  name="name"
                  required
                  defaultValue={editing?.name ?? ""}
                  placeholder="e.g. Ferguson"
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="field-label">Account / code (optional)</span>
                <input
                  className="field"
                  name="code"
                  defaultValue={editing?.code ?? ""}
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="field-label">Phone (optional)</span>
                <input
                  className="field"
                  name="phone"
                  defaultValue={editing?.phone ?? ""}
                  autoComplete="off"
                />
              </label>
              <label className="block">
                <span className="field-label">Email (optional)</span>
                <input
                  className="field"
                  type="email"
                  name="email"
                  defaultValue={editing?.email ?? ""}
                  autoComplete="off"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="field-label">Website (optional)</span>
                <input
                  className="field"
                  name="website"
                  defaultValue={editing?.website ?? ""}
                  placeholder="https://"
                  autoComplete="off"
                />
              </label>
              <label className="block sm:col-span-2 lg:col-span-3">
                <span className="field-label">Notes (optional)</span>
                <input
                  className="field"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  autoComplete="off"
                />
              </label>
              {editing ? (
                <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    name="active"
                    value="true"
                    defaultChecked={editing.active}
                  />
                  Active (inactive vendors stay on history but are hidden from new item picks)
                </label>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn-primary">
                  {editing ? "Save vendor" : "Create vendor"}
                </button>
                {editing ? (
                  <Link href="/vendors" className="btn-ghost no-underline">
                    Cancel
                  </Link>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        <div className="box">
          <div className="box-header">All vendors</div>
          <div className="box-body p-0">
            <VendorsTable
              vendors={vendors.map((vendor) => ({
                id: vendor.id,
                name: vendor.name,
                code: vendor.code,
                phone: vendor.phone,
                email: vendor.email,
                website: vendor.website,
                active: vendor.active,
                itemCount: vendor._count.items,
              }))}
            />
          </div>
        </div>
      </section>
    </>
  );
}
