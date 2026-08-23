import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateItem } from "@/lib/actions/stock";
import { prisma } from "@/lib/prisma";
import { formatTagsInput, money, stockChip } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function ItemDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  const [item, recentMoves] = await Promise.all([
    prisma.item.findFirst({
      where: { id, active: true },
      include: {
        balances: {
          where: { qty: { gt: 0 } },
          orderBy: { location: { code: "asc" } },
          include: {
            location: { include: { assignedUser: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.stockMove.findMany({
      where: { itemId: id },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        fromLocation: true,
        toLocation: true,
      },
    }),
  ]);

  if (!item) notFound();

  const totalQty = item.balances.reduce((sum, row) => sum + row.qty, 0);
  const totalValueCents = item.balances.reduce(
    (sum, row) => sum + row.qty * item.unitCostCents,
    0,
  );
  const chip = stockChip(totalQty, item.reorderPoint);

  return (
    <>
      <div className="content-header">
        <div className="breadcrumb">
          <Link href="/items">Items</Link>
          <span>/</span>
          <span>{item.sku}</span>
        </div>
        <h1>
          {item.sku} · {item.name}
        </h1>
      </div>

      <section className="content">
        {query.saved ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            Item saved.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="box box-primary lg:col-span-2">
            <div className="box-header">Item Details</div>
            <div className="box-body">
              <dl className="detail-grid">
                <div>
                  <dt>On hand</dt>
                  <dd>{totalQty}</dd>
                </div>
                <div>
                  <dt>Reorder point</dt>
                  <dd>{item.reorderPoint}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={chip.className}>{chip.label}</span>
                  </dd>
                </div>
                <div>
                  <dt>Inventory value</dt>
                  <dd>{money(totalValueCents)}</dd>
                </div>
                <div>
                  <dt>Unit cost</dt>
                  <dd>{money(item.unitCostCents)}</dd>
                </div>
                <div>
                  <dt>Unit</dt>
                  <dd>{item.unit}</dd>
                </div>
              </dl>
              <div className="mt-4">
                <p className="field-label m-0">Tags</p>
                {item.tags.length === 0 ? (
                  <p className="m-0 mt-1 text-muted">None</p>
                ) : (
                  <div className="tag-list mt-2">
                    {item.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/items?tag=${encodeURIComponent(tag)}`}
                        className="tag-chip"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="box">
            <div className="box-header">Quick actions</div>
            <div className="box-body space-y-2">
              <Link href={`/receive?itemId=${item.id}`} className="btn-primary w-full no-underline">
                Receive stock
              </Link>
              <Link href={`/pull?itemId=${item.id}`} className="btn-ghost w-full no-underline">
                Pull to job
              </Link>
            </div>
          </div>
        </div>

        <div className="box box-primary">
          <div className="box-header">Edit Item</div>
          <div className="box-body">
            <form action={updateItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="hidden" name="id" value={item.id} />
              <label>
                <span className="field-label">SKU</span>
                <input className="field" name="sku" defaultValue={item.sku} required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">Name</span>
                <input className="field" name="name" defaultValue={item.name} required />
              </label>
              <label>
                <span className="field-label">Category</span>
                <input className="field" name="category" defaultValue={item.category} />
              </label>
              <label>
                <span className="field-label">Unit</span>
                <input className="field" name="unit" defaultValue={item.unit} />
              </label>
              <label>
                <span className="field-label">Reorder point</span>
                <input
                  className="field"
                  type="number"
                  name="reorderPoint"
                  defaultValue={item.reorderPoint}
                  min={0}
                />
              </label>
              <label>
                <span className="field-label">Unit cost ($)</span>
                <input
                  className="field"
                  type="number"
                  name="unitCost"
                  step="0.01"
                  min={0}
                  defaultValue={(item.unitCostCents / 100).toFixed(2)}
                />
              </label>
              <label className="sm:col-span-2 lg:col-span-3">
                <span className="field-label">Tags</span>
                <input
                  className="field"
                  name="tags"
                  defaultValue={formatTagsInput(item.tags)}
                  placeholder="conduit, wire, truck-stock"
                />
                <span className="field-hint">Comma-separated. Used to filter items later.</span>
              </label>
              <label className="sm:col-span-2 lg:col-span-3">
                <span className="field-label">Notes</span>
                <input className="field" name="notes" defaultValue={item.notes ?? ""} />
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn-primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="box box-primary">
          <div className="box-header">Stock by Location</div>
          <div className="box-body p-0">
            {item.balances.length === 0 ? (
              <div className="empty-state">
                <p>No stock on hand for this SKU.</p>
                <Link href={`/receive?itemId=${item.id}`} className="btn-primary mt-3 inline-flex">
                  Receive stock
                </Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Qty</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.balances.map((row) => (
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
                        <td className="font-semibold">{row.qty}</td>
                        <td>{money(row.qty * item.unitCostCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="box">
          <div className="box-header">Recent Activity</div>
          <div className="box-body p-0">
            {recentMoves.length === 0 ? (
              <div className="empty-state">
                <p>No moves recorded for this SKU yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Qty</th>
                      <th>From</th>
                      <th>To</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMoves.map((move) => (
                      <tr key={move.id}>
                        <td className="text-muted whitespace-nowrap">
                          {format(move.createdAt, "MMM d, yyyy h:mm a")}
                        </td>
                        <td>
                          <span className="chip chip-muted">{move.type}</span>
                        </td>
                        <td className="font-semibold">{move.qty}</td>
                        <td>
                          {move.fromLocation ? (
                            <Link
                              href={`/locations/${move.fromLocation.id}`}
                              className="text-link"
                            >
                              {move.fromLocation.code}
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {move.toLocation ? (
                            <Link
                              href={`/locations/${move.toLocation.id}`}
                              className="text-link"
                            >
                              {move.toLocation.code}
                            </Link>
                          ) : move.jobRef ? (
                            move.jobRef
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{move.user?.name ?? "System"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
