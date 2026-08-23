import Link from "next/link";
import { createItem } from "@/lib/actions/stock";
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
        <div className="box box-primary">
          <div className="box-header">Add Item</div>
          <div className="box-body">
            <form action={createItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className="field-label">SKU</span>
                <input className="field" name="sku" placeholder="EMT-3/4" required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">Name</span>
                <input className="field" name="name" required />
              </label>
              <label>
                <span className="field-label">Category</span>
                <input className="field" name="category" defaultValue="General" />
              </label>
              <label>
                <span className="field-label">Unit</span>
                <input className="field" name="unit" defaultValue="ea" />
              </label>
              <label>
                <span className="field-label">Reorder point</span>
                <input className="field" type="number" name="reorderPoint" defaultValue={0} min={0} />
              </label>
              <label>
                <span className="field-label">Unit cost ($)</span>
                <input
                  className="field"
                  type="number"
                  name="unitCost"
                  step="0.01"
                  defaultValue={0}
                  min={0}
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

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
