import { format } from "date-fns";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { startCycleCount } from "@/lib/actions/cycle-counts";
import { formatLocationLabel } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

function statusChip(status: string) {
  if (status === "OPEN") return "chip-warn";
  if (status === "POSTED") return "chip-ok";
  return "chip-muted";
}

export default async function CycleCountsPage() {
  const [counts, locations] = await Promise.all([
    prisma.cycleCount.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: {
        location: {
          include: { assignedUser: { select: { name: true } } },
        },
        createdBy: { select: { name: true } },
        postedBy: { select: { name: true } },
        _count: { select: { lines: true } },
        lines: {
          select: { countedQty: true, expectedQty: true },
        },
      },
    }),
    prisma.location.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
      include: { assignedUser: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <div className="content-header">
        <h1>Cycle Counts</h1>
      </div>
      <section className="content space-y-4">
        <div className="box box-primary max-w-2xl">
          <div className="box-header">Start a count</div>
          <div className="box-body">
            <form action={startCycleCount} className="space-y-4">
              <label className="block">
                <span className="field-label">Location</span>
                <select name="locationId" required className="field" defaultValue="">
                  <option value="" disabled>
                    Choose shop or truck…
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {formatLocationLabel(loc)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="field-label">Seed lines</span>
                <select name="seedMode" className="field" defaultValue="on_hand">
                  <option value="on_hand">All SKUs currently on hand</option>
                  <option value="empty">Empty list (add SKUs as you count)</option>
                </select>
              </label>

              <label className="flex items-start gap-2 text-sm text-[#555]">
                <input type="checkbox" name="blind" className="mt-0.5" />
                <span>
                  Blind count
                  <span className="mt-0.5 block text-xs text-muted">
                    Hide expected quantities while counting.
                  </span>
                </span>
              </label>

              <label className="block">
                <span className="field-label">Note</span>
                <input
                  name="note"
                  className="field"
                  placeholder="Optional (e.g. Truck 3 weekly)"
                />
              </label>

              <button type="submit" className="btn-primary inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Start cycle count
              </button>
            </form>
          </div>
        </div>

        <div className="box box-primary">
          <div className="box-header">Recent counts</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Started</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>By</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {counts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted">
                        No cycle counts yet. Start one above for a shop or truck.
                      </td>
                    </tr>
                  ) : (
                    counts.map((count) => {
                      const counted = count.lines.filter(
                        (l) => l.countedQty !== null,
                      ).length;
                      const variance = count.lines.filter(
                        (l) =>
                          l.countedQty !== null &&
                          l.countedQty !== l.expectedQty,
                      ).length;
                      return (
                        <tr key={count.id}>
                          <td>{format(count.createdAt, "M/d/yyyy h:mm a")}</td>
                          <td>
                            <span className="sku">{count.location.code}</span>
                            <div className="text-xs text-muted">
                              {count.location.name}
                              {count.blind ? " · Blind" : ""}
                            </div>
                          </td>
                          <td>
                            <span className={statusChip(count.status)}>
                              {count.status}
                            </span>
                          </td>
                          <td>
                            {counted}/{count._count.lines}
                            {variance > 0 ? (
                              <span className="ml-2 text-xs text-[#dd4b39]">
                                {variance} var
                              </span>
                            ) : null}
                          </td>
                          <td className="text-sm">
                            {count.postedBy?.name ?? count.createdBy?.name ?? "-"}
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/cycle-counts/${count.id}`}
                              className="text-[#3c8dbc] hover:underline"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
