import Link from "next/link";
import { format, formatDistanceToNowStrict, subDays } from "date-fns";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";

const RANGES = [
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "12 months", days: 365 },
  { key: "all", label: "All time", days: null },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function parseRange(raw: string | undefined): RangeKey {
  if (raw === "30" || raw === "90" || raw === "365" || raw === "all") return raw;
  return "90";
}

export default async function TopSkusPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const rangeKey = parseRange(params.range);
  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[1];
  const since = range.days ? subDays(new Date(), range.days) : null;

  const grouped = await prisma.stockMove.groupBy({
    by: ["itemId"],
    where: {
      type: "PULL",
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { qty: true },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 100,
  });

  const itemIds = grouped.map((row) => row.itemId);
  const [items, balances] = await Promise.all([
    itemIds.length
      ? prisma.item.findMany({
          where: { id: { in: itemIds } },
        })
      : Promise.resolve([]),
    itemIds.length
      ? prisma.stockBalance.findMany({
          where: { itemId: { in: itemIds } },
          select: { itemId: true, qty: true },
        })
      : Promise.resolve([]),
  ]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const onHandById = new Map<string, number>();
  for (const balance of balances) {
    onHandById.set(
      balance.itemId,
      (onHandById.get(balance.itemId) ?? 0) + balance.qty,
    );
  }

  const rows = grouped
    .map((row, index) => {
      const item = itemById.get(row.itemId);
      if (!item) return null;
      const unitsPulled = row._sum.qty ?? 0;
      return {
        rank: index + 1,
        item,
        unitsPulled,
        pullCount: row._count._all,
        lastPulledAt: row._max.createdAt,
        onHand: onHandById.get(item.id) ?? 0,
      };
    })
    .filter(Boolean) as Array<{
    rank: number;
    item: (typeof items)[number];
    unitsPulled: number;
    pullCount: number;
    lastPulledAt: Date | null;
    onHand: number;
  }>;

  const topUnits = rows[0]?.unitsPulled ?? 0;

  return (
    <>
      <div className="content-header">
        <h1>Top 100 SKUs</h1>
      </div>
      <section className="content">
        <div className="top-skus-intro">
          <div className="top-skus-intro-copy">
            <p className="m-0 flex items-center gap-2 text-base font-semibold text-[#444]">
              <Trophy className="h-5 w-5 text-[#f39c12]" />
              Most used parts
            </p>
            <p className="mt-1 mb-0 text-sm text-[#777]">
              Ranked by units pulled to jobs
              {range.days ? ` in the last ${range.label.toLowerCase()}` : " (all time)"}.
            </p>
          </div>
          <div className="top-skus-range" role="tablist" aria-label="Time range">
            {RANGES.map((option) => {
              const active = option.key === rangeKey;
              return (
                <Link
                  key={option.key}
                  href={
                    option.key === "90"
                      ? "/top-skus"
                      : `/top-skus?range=${option.key}`
                  }
                  className={`top-skus-range-btn ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="box box-primary">
          <div className="box-header flex flex-wrap items-center justify-between gap-2">
            <span>Top {rows.length || 100} by pull volume</span>
            <span className="text-xs font-normal text-[#888]">
              {rows.length === 0
                ? "No pulls in this range yet"
                : `${rows.length} SKU${rows.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="box-body p-0">
            {rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#777]">
                <p className="m-0">No pull activity found for this period.</p>
                <p className="mt-2 mb-0">
                  Pull stock from{" "}
                  <Link href="/pull" className="text-[#3c8dbc]">
                    Pull to Job
                  </Link>{" "}
                  and rankings will show up here.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data top-skus-table">
                  <thead>
                    <tr>
                      <th className="w-14">#</th>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Units pulled</th>
                      <th>Pulls</th>
                      <th>On hand</th>
                      <th>Last pull</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const share =
                        topUnits > 0
                          ? Math.max(4, Math.round((row.unitsPulled / topUnits) * 100))
                          : 0;
                      return (
                        <tr key={row.item.id}>
                          <td>
                            <span
                              className={`top-skus-rank ${
                                row.rank <= 3 ? `is-top-${row.rank}` : ""
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>
                          <td className="sku">
                            <Link
                              href={`/items/${row.item.id}`}
                              className="row-link-target"
                            >
                              {row.item.sku}
                            </Link>
                          </td>
                          <td>
                            <div className="font-medium text-[#444]">
                              {row.item.name}
                            </div>
                            <div className="text-xs text-[#999]">
                              {row.item.category}
                              {row.item.unit ? ` · ${row.item.unit}` : ""}
                            </div>
                          </td>
                          <td>
                            <div className="top-skus-meter">
                              <div className="top-skus-meter-track" aria-hidden>
                                <div
                                  className="top-skus-meter-fill"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="top-skus-meter-value">
                                {row.unitsPulled.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td>{row.pullCount.toLocaleString()}</td>
                          <td>{row.onHand.toLocaleString()}</td>
                          <td>
                            {row.lastPulledAt ? (
                              <>
                                <div>
                                  {formatDistanceToNowStrict(row.lastPulledAt, {
                                    addSuffix: true,
                                  })}
                                </div>
                                <div className="text-xs text-[#999]">
                                  {format(row.lastPulledAt, "MMM d, yyyy h:mm a")}
                                </div>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
