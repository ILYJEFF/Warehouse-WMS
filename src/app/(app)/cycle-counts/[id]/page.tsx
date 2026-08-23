import { format } from "date-fns";
import { notFound } from "next/navigation";
import {
  addCycleCountLine,
  cancelCycleCount,
  postCycleCount,
} from "@/lib/actions/cycle-counts";
import { BackButton } from "@/components/back-button";
import { CycleCountWorkspace } from "@/components/cycle-count-workspace";
import { formatLocationLabel } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

export default async function CycleCountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string; posted?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const count = await prisma.cycleCount.findUnique({
    where: { id },
    include: {
      location: {
        include: { assignedUser: { select: { name: true } } },
      },
      createdBy: { select: { name: true } },
      postedBy: { select: { name: true } },
      lines: {
        orderBy: { item: { sku: "asc" } },
        include: {
          item: {
            select: { id: true, sku: true, name: true, category: true },
          },
        },
      },
    },
  });

  if (!count) notFound();

  const open = count.status === "OPEN";
  const counted = count.lines.filter((l) => l.countedQty !== null).length;
  const varianceLines = count.lines.filter(
    (l) => l.countedQty !== null && l.countedQty !== l.expectedQty,
  );
  const items = open
    ? await prisma.item.findMany({
        where: { active: true },
        orderBy: { sku: "asc" },
        select: { id: true, sku: true, name: true },
      })
    : [];

  const existingItemIds = new Set(count.lines.map((l) => l.itemId));
  const addableItems = items.filter((item) => !existingItemIds.has(item.id));

  return (
    <>
      <div className="content-header">
        <div className="mb-2">
          <BackButton href="/cycle-counts" label="All cycle counts" />
        </div>
        <h1>
          Count · <span className="sku">{count.location.code}</span>
        </h1>
        <p className="m-0 mt-1 text-sm text-muted">
          {formatLocationLabel(count.location)}
          {count.blind ? " · Blind" : ""}
          {" · "}
          Started {format(count.createdAt, "M/d/yyyy h:mm a")}
          {count.createdBy?.name ? ` by ${count.createdBy.name}` : ""}
        </p>
      </div>

      <section className="content space-y-4">
        {query.posted === "1" ? (
          <div className="cc-banner is-success">
            Posted. On-hand quantities were adjusted to the counted values.
          </div>
        ) : null}

        {count.status === "CANCELLED" ? (
          <div className="cc-banner is-muted">This count was cancelled.</div>
        ) : null}

        {count.status === "POSTED" && count.postedAt ? (
          <div className="cc-banner is-success">
            Posted {format(count.postedAt, "M/d/yyyy h:mm a")}
            {count.postedBy?.name ? ` by ${count.postedBy.name}` : ""}.
            {varianceLines.length > 0
              ? ` ${varianceLines.length} variance line${varianceLines.length === 1 ? "" : "s"} vs expected snapshot.`
              : " No variances vs expected snapshot."}
          </div>
        ) : null}

        {open ? (
          <div className="box box-primary">
            <div className="box-header">Add SKU</div>
            <div className="box-body">
              <form
                action={addCycleCountLine}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="cycleCountId" value={count.id} />
                <label className="block min-w-0 flex-1">
                  <span className="field-label">Item</span>
                  <select name="itemId" className="field" defaultValue="">
                    <option value="">Select SKU…</option>
                    {addableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku} · {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block w-full sm:w-40">
                  <span className="field-label">Or type SKU</span>
                  <input
                    name="sku"
                    className="field"
                    placeholder="SKU"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <button type="submit" className="btn-primary shrink-0">
                  Add to count
                </button>
              </form>
            </div>
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header flex items-center justify-between gap-3">
            <span>Count lines</span>
            <span className="text-xs font-normal text-muted">
              {counted}/{count.lines.length} counted
            </span>
          </div>
          <div className="box-body p-0">
            <CycleCountWorkspace
              blind={count.blind}
              readOnly={!open}
              focusLineId={query.focus}
              lines={count.lines}
            />
          </div>
        </div>

        {!count.blind && varianceLines.length > 0 ? (
          <div className="box">
            <div className="box-header">Variance preview</div>
            <div className="box-body p-0">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Item</th>
                      <th className="text-right">Expected</th>
                      <th className="text-right">Counted</th>
                      <th className="text-right">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {varianceLines.map((line) => {
                      const delta = (line.countedQty ?? 0) - line.expectedQty;
                      return (
                        <tr key={line.id}>
                          <td className="sku">{line.item.sku}</td>
                          <td>{line.item.name}</td>
                          <td className="text-right">{line.expectedQty}</td>
                          <td className="text-right font-semibold">
                            {line.countedQty}
                          </td>
                          <td
                            className={`text-right font-semibold ${
                              delta < 0 ? "text-[#dd4b39]" : "text-[#00a65a]"
                            }`}
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {open ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form action={cancelCycleCount}>
              <input type="hidden" name="cycleCountId" value={count.id} />
              <button type="submit" className="cc-cancel-btn">
                Cancel count
              </button>
            </form>
            <form action={postCycleCount} className="text-right">
              <input type="hidden" name="cycleCountId" value={count.id} />
              <button type="submit" className="btn-primary">
                Post counted lines
              </button>
              <p className="mt-1 mb-0 text-xs text-muted">
                Uncounted lines stay unchanged. Posted qty becomes the new on-hand.
              </p>
            </form>
          </div>
        ) : null}

        {count.note ? (
          <p className="text-sm text-muted">Note: {count.note}</p>
        ) : null}
      </section>
    </>
  );
}
