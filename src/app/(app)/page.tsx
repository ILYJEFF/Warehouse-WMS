import { format } from "date-fns";
import { Barcode, Boxes, MapPin, PackageMinus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const [items, balances, moves, locations] = await Promise.all([
    prisma.item.findMany({ where: { active: true } }),
    prisma.stockBalance.findMany({ include: { item: true, location: true } }),
    prisma.stockMove.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        item: true,
        fromLocation: true,
        toLocation: true,
        user: true,
      },
    }),
    prisma.location.count({ where: { active: true } }),
  ]);

  const qtyByItem = new Map<string, number>();
  for (const b of balances) {
    qtyByItem.set(b.itemId, (qtyByItem.get(b.itemId) ?? 0) + b.qty);
  }

  let onHandCents = 0;
  let lowCount = 0;
  for (const item of items) {
    const qty = qtyByItem.get(item.id) ?? 0;
    onHandCents += qty * item.unitCostCents;
    if (qty <= item.reorderPoint) lowCount += 1;
  }

  const totalUnits = balances.reduce((sum, b) => sum + b.qty, 0);

  return (
    <>
      <div className="content-header">
        <h1>Dashboard</h1>
      </div>

      <section className="content">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="small-box bg-aqua">
            <div className="inner">
              <h3>{items.length}</h3>
              <p>total items</p>
            </div>
            <div className="icon">
              <Barcode className="h-[90px] w-[90px]" strokeWidth={1} />
            </div>
            <Link href="/items" className="small-box-footer">
              More info
            </Link>
          </div>

          <div className="small-box bg-red">
            <div className="inner">
              <h3>{totalUnits}</h3>
              <p>units on hand</p>
            </div>
            <div className="icon">
              <Boxes className="h-[90px] w-[90px]" strokeWidth={1} />
            </div>
            <Link href="/stock" className="small-box-footer">
              More info
            </Link>
          </div>

          <div className="small-box bg-yellow">
            <div className="inner">
              <h3>{locations}</h3>
              <p>locations</p>
            </div>
            <div className="icon">
              <MapPin className="h-[90px] w-[90px]" strokeWidth={1} />
            </div>
            <Link href="/locations" className="small-box-footer">
              More info
            </Link>
          </div>

          <div className="small-box bg-purple">
            <div className="inner">
              <h3>{lowCount}</h3>
              <p>low stock alerts</p>
            </div>
            <div className="icon">
              <PackageMinus className="h-[90px] w-[90px]" strokeWidth={1} />
            </div>
            <Link href="/stock" className="small-box-footer">
              More info
            </Link>
          </div>
        </div>

        <div className="box box-primary">
          <div className="box-header">Recent Activity</div>
          <div className="box-body p-0">
            {moves.length === 0 ? (
              <p className="p-4 text-muted">No activity yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Item</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.map((move) => (
                      <tr key={move.id}>
                        <td className="whitespace-nowrap text-muted">
                          {format(move.createdAt, "M/d/yyyy h:mm a")}
                        </td>
                        <td>
                          <span className="text-link">{move.user?.name ?? "System"}</span>
                        </td>
                        <td>{move.type}</td>
                        <td>
                          <Link href={`/items/${move.item.id}`} className="row-link-target">
                            <span className="sku">{move.item.sku}</span> ({move.qty})
                          </Link>
                        </td>
                        <td>
                          {move.jobRef ??
                            move.toLocation?.code ??
                            move.fromLocation?.code ??
                            "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="box-footer flex flex-wrap gap-4">
            <Link href="/moves">View All Activity</Link>
            <Link href="/top-skus">Top 100 SKUs</Link>
          </div>
        </div>

        <div className="box">
          <div className="box-header">On-hand value</div>
          <div className="box-body">
            <p className="m-0 text-2xl font-semibold text-ink">{money(onHandCents)}</p>
            <p className="mt-1 text-sm text-muted">Across shop and trucks</p>
          </div>
        </div>
      </section>
    </>
  );
}
