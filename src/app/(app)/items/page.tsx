import Link from "next/link";
import { AddItemPanel } from "@/components/add-item-panel";
import { prisma } from "@/lib/prisma";
import { money, stockChip } from "@/lib/utils";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const activeTag = (params.tag ?? "").trim().toLowerCase();

  const [items, tagRows] = await Promise.all([
    prisma.item.findMany({
      where: {
        active: true,
        ...(activeTag ? { tags: { has: activeTag } } : {}),
      },
      orderBy: { sku: "asc" },
      include: { balances: true },
    }),
    prisma.item.findMany({
      where: { active: true },
      select: { tags: true },
    }),
  ]);

  const allTags = Array.from(
    new Set(tagRows.flatMap((row) => row.tags)),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <>
      <div className="content-header">
        <h1>Items</h1>
      </div>
      <section className="content">
        <AddItemPanel />

        {allTags.length > 0 ? (
          <div className="box">
            <div className="box-header">Filter by tag</div>
            <div className="box-body">
              <div className="tag-filter-row">
                <Link
                  href="/items"
                  className={`tag-filter ${!activeTag ? "is-active" : ""}`}
                >
                  All
                </Link>
                {allTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/items?tag=${encodeURIComponent(tag)}`}
                    className={`tag-filter ${activeTag === tag ? "is-active" : ""}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="box">
          <div className="box-header">
            Item List
            {activeTag ? (
              <span className="ml-2 text-sm text-muted">tagged "{activeTag}"</span>
            ) : null}
          </div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Tags</th>
                    <th>Category</th>
                    <th>On hand</th>
                    <th>Reorder</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-muted">
                        {activeTag
                          ? `No items tagged "${activeTag}".`
                          : "No items yet."}
                      </td>
                    </tr>
                  ) : null}
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
                        <td>
                          {item.tags.length === 0 ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div className="tag-list">
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
