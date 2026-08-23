"use client";

import Link from "next/link";
import { deleteVendor } from "@/lib/actions/vendors";

type VendorRow = {
  id: string;
  name: string;
  code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  active: boolean;
  itemCount: number;
};

export function VendorsTable({ vendors }: { vendors: VendorRow[] }) {
  if (vendors.length === 0) {
    return (
      <p className="m-0 px-4 py-6 text-sm text-[#777]">
        No vendors yet. Add one above, then assign it on each SKU.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>SKUs</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td>
                <div className="font-medium text-[#444]">{vendor.name}</div>
                {vendor.code ? (
                  <div className="text-xs text-[#999]">Acct {vendor.code}</div>
                ) : null}
              </td>
              <td>
                <div className="text-sm">{vendor.phone || vendor.email || "—"}</div>
                {vendor.website ? (
                  <div className="text-xs text-[#999]">{vendor.website}</div>
                ) : null}
              </td>
              <td>{vendor.itemCount}</td>
              <td>
                <span className={vendor.active ? "chip chip-ok" : "chip chip-muted"}>
                  {vendor.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/vendors?edit=${vendor.id}`} className="text-[#3c8dbc]">
                    Edit
                  </Link>
                  <form action={deleteVendor}>
                    <input type="hidden" name="id" value={vendor.id} />
                    <button
                      type="submit"
                      className="text-[#dd4b39]"
                      onClick={(e) => {
                        if (
                          !window.confirm(
                            `Delete vendor “${vendor.name}”? SKUs keep their data but lose this vendor link.`,
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
