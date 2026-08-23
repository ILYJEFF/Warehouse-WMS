import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { stockChip } from "@/lib/utils";

export default async function StockPage() {
  const balances = await prisma.stockBalance.findMany({
    where: { qty: { gt: 0 } },
    orderBy: [{ location: { code: "asc" } }, { item: { sku: "asc" } }],
    include: {
      item: true,
      location: { include: { assignedUser: { select: { name: true } } } },
    },
  });

  return (
    <>
      <div className="content-header">
        <h1>Stock</h1>
      </div>
      <section className="content">
        <div className="box box-primary">
          <div className="box-header">On Hand by Location</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>SKU</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((row) => {
                    const total = balances
                      .filter((b) => b.itemId === row.itemId)
                      .reduce((s, b) => s + b.qty, 0);
                    const chip = stockChip(total, row.item.reorderPoint);
                    return (
                      <tr key={row.id}>
                        <td>
                          <Link href={`/locations/${row.location.id}`} className="row-link-target">
                            <span className="sku">{row.location.code}</span>
                            <div className="text-xs text-muted">
                              {row.location.name}
                              {row.location.kind === "TRUCK" && row.location.assignedUser?.name
                                ? ` · ${row.location.assignedUser.name}`
                                : ""}
                            </div>
                          </Link>
                        </td>
                        <td className="sku">
                          <Link href={`/items/${row.item.id}`} className="row-link-target">
                            {row.item.sku}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/items/${row.item.id}`} className="row-link-target">
                            {row.item.name}
                          </Link>
                        </td>
                        <td className="font-semibold">{row.qty}</td>
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
        </div>
      </section>
    </>
  );
}
