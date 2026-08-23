import Link from "next/link";
import { AddItemPanel } from "@/components/add-item-panel";
import { prisma } from "@/lib/prisma";
import { money, stockChip } from "@/lib/utils";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    where: { active: true },
    orderBy: { sku: "asc" },
    include: { balances: true },
  });

  return (
    <>
      <div className="content-header">
        <h1>Items</h1>
      </div>
      <section className="content">
        <AddItemPanel />

        <div className="box">
          <div className="box-header">Item List</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>On hand</th>
                    <th>Reorder</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const qty = item.balances.reduce((sum, b) => sum + b.qty, 0);
                    const chip = stockChip(qty, item.reorderPoint);
                    return (
                      <tr key={item.id} className="row-link">
                        <td className="sku">
                          <Link href={`/items/${item.id}`} className="row-link-target">
                            {item.sku}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/items/${item.id}`} className="row-link-target">
                            {item.name}
                          </Link>
                        </td>
                        <td>{item.category}</td>
                        <td>{qty}</td>
                        <td>{item.reorderPoint}</td>
                        <td>{money(item.unitCostCents)}</td>
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
