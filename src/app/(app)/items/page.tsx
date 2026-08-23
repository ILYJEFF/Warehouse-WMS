import Link from "next/link";
import { AddItemPanel } from "@/components/add-item-panel";
import { TagChip } from "@/components/tag-chip";
import { prisma } from "@/lib/prisma";
import { tagTextColor } from "@/lib/tags";
import { money, stockChip } from "@/lib/utils";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const activeTag = (params.tag ?? "").trim().toLowerCase();

  const [items, catalog, vendors] = await Promise.all([
    prisma.item.findMany({
      where: {
        active: true,
        ...(activeTag
          ? { itemTags: { some: { tag: { name: activeTag } } } }
          : {}),
      },
      orderBy: { sku: "asc" },
      include: {
        balances: true,
        vendor: true,
        itemTags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <div className="content-header">
        <h1>Items</h1>
      </div>
      <section className="content">
        <AddItemPanel catalog={catalog} vendors={vendors} />

        {catalog.length > 0 ? (
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
                {catalog.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/items?tag=${encodeURIComponent(tag.name)}`}
                    className={`tag-filter ${activeTag === tag.name ? "is-active" : ""}`}
                    style={
                      activeTag === tag.name
                        ? {
                            background: tag.color,
                            borderColor: tag.color,
                            color: tagTextColor(tag.color),
                          }
                        : { borderColor: tag.color, color: tag.color }
                    }
                  >
                    {tag.name}
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
                    <th>Vendor</th>
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
                      <td colSpan={9} className="p-4 text-muted">
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
                          {item.vendor ? (
                            <div>
                              <div>{item.vendor.name}</div>
                              {item.vendorSku ? (
                                <div className="text-xs text-[#999]">
                                  #{item.vendorSku}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          {item.itemTags.length === 0 ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div className="tag-list">
                              {item.itemTags.map(({ tag }) => (
                                <TagChip
                                  key={tag.id}
                                  tag={tag}
                                  href={`/items?tag=${encodeURIComponent(tag.name)}`}
                                />
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
