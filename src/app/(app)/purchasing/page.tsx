import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { isAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money, stockChip } from "@/lib/utils";

type BuyLine = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  vendorSku: string | null;
  onHand: number;
  reorderPoint: number;
  suggestedQty: number;
  unitCostCents: number;
  estCostCents: number;
};

export default async function PurchasingPage() {
  const me = await requireUser();
  const admin = me ? isAdmin(me.role) : false;

  const items = await prisma.item.findMany({
    where: { active: true },
    include: {
      vendor: true,
      balances: { select: { qty: true } },
    },
    orderBy: { sku: "asc" },
  });

  const lines: Array<BuyLine & { vendorKey: string; vendorName: string; vendorMeta: string | null }> =
    [];

  for (const item of items) {
    const onHand = item.balances.reduce((sum, row) => sum + row.qty, 0);
    if (onHand > item.reorderPoint) continue;

    const suggestedQty = Math.max(item.reorderPoint - onHand, 1);
    lines.push({
      id: item.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      vendorSku: item.vendorSku,
      onHand,
      reorderPoint: item.reorderPoint,
      suggestedQty,
      unitCostCents: item.unitCostCents,
      estCostCents: suggestedQty * item.unitCostCents,
      vendorKey: item.vendor?.id ?? "none",
      vendorName: item.vendor?.name ?? "No vendor assigned",
      vendorMeta: item.vendor
        ? [item.vendor.code ? `Acct ${item.vendor.code}` : null, item.vendor.phone, item.vendor.email]
            .filter(Boolean)
            .join(" · ") || null
        : "Assign a vendor on the item to group this for ordering",
    });
  }

  lines.sort((a, b) => {
    if (a.vendorName === b.vendorName) return a.sku.localeCompare(b.sku);
    if (a.vendorKey === "none") return 1;
    if (b.vendorKey === "none") return -1;
    return a.vendorName.localeCompare(b.vendorName);
  });

  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      meta: string | null;
      lines: BuyLine[];
      totalCents: number;
    }
  >();

  for (const line of lines) {
    const existing = groups.get(line.vendorKey);
    if (existing) {
      existing.lines.push(line);
      existing.totalCents += line.estCostCents;
      continue;
    }
    groups.set(line.vendorKey, {
      key: line.vendorKey,
      name: line.vendorName,
      meta: line.vendorMeta,
      lines: [line],
      totalCents: line.estCostCents,
    });
  }

  const groupList = Array.from(groups.values());
  const totalLines = lines.length;
  const totalCents = lines.reduce((sum, line) => sum + line.estCostCents, 0);

  return (
    <>
      <div className="content-header">
        <h1>Purchasing</h1>
      </div>
      <section className="content">
        <div className="purchasing-intro">
          <div>
            <p className="m-0 flex items-center gap-2 text-base font-semibold text-[#444]">
              <ShoppingCart className="h-5 w-5 text-[#3c8dbc]" />
              What to buy
            </p>
            <p className="mt-1 mb-0 max-w-2xl text-sm text-[#777]">
              SKUs at or below reorder point, grouped by the vendor you buy them from.
              Suggested qty fills back to the reorder point (at least 1).
            </p>
          </div>
          <div className="purchasing-stats">
            <div>
              <span className="purchasing-stat-value">{totalLines}</span>
              <span className="purchasing-stat-label">SKUs to order</span>
            </div>
            <div>
              <span className="purchasing-stat-value">{money(totalCents)}</span>
              <span className="purchasing-stat-label">Est. cost</span>
            </div>
            {admin ? (
              <Link href="/vendors" className="btn-ghost no-underline">
                Manage vendors
              </Link>
            ) : null}
          </div>
        </div>

        {groupList.length === 0 ? (
          <div className="box">
            <div className="box-body">
              <div className="empty-state">
                <p className="m-0">Nothing needs ordering right now.</p>
                <p className="mt-2 mb-0 text-sm text-[#777]">
                  When on-hand hits a SKU&apos;s reorder point, it shows up here under its vendor.
                </p>
              </div>
            </div>
          </div>
        ) : (
          groupList.map((group) => (
            <div key={group.key} className="box box-primary">
              <div className="box-header flex flex-wrap items-center justify-between gap-2">
                <span>{group.name}</span>
                <span className="text-xs font-normal text-[#888]">
                  {group.lines.length} SKU{group.lines.length === 1 ? "" : "s"} ·{" "}
                  {money(group.totalCents)}
                </span>
              </div>
              {group.meta ? (
                <div className="border-b border-[#f4f4f4] px-4 py-2 text-xs text-[#888]">
                  {group.meta}
                </div>
              ) : null}
              <div className="box-body p-0">
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Vendor SKU</th>
                        <th>On hand</th>
                        <th>Reorder</th>
                        <th>Suggest</th>
                        <th>Est. cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.lines.map((line) => {
                        const chip = stockChip(line.onHand, line.reorderPoint);
                        return (
                          <tr key={line.id}>
                            <td className="sku">
                              <Link
                                href={`/items/${line.id}`}
                                className="row-link-target"
                              >
                                {line.sku}
                              </Link>
                            </td>
                            <td>
                              <div>{line.name}</div>
                              <div className="text-xs text-[#999]">{line.unit}</div>
                            </td>
                            <td>{line.vendorSku || "—"}</td>
                            <td>{line.onHand}</td>
                            <td>{line.reorderPoint}</td>
                            <td className="font-semibold">{line.suggestedQty}</td>
                            <td>{money(line.estCostCents)}</td>
                            <td>
                              <span className={chip.className}>{chip.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="box-footer flex flex-wrap gap-3">
                <Link href="/receive" className="text-[#3c8dbc]">
                  Receive stock when it arrives
                </Link>
                {group.key === "none" && admin ? (
                  <Link href="/vendors" className="text-[#3c8dbc]">
                    Add vendors
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
