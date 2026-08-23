import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assignTruckPerson } from "@/lib/actions/stock";
import { LocationStockTable } from "@/components/location-stock-table";
import { roleLabel } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LocationDetailPage({ params }: Props) {
  const { id } = await params;

  const [location, users, recentMoves] = await Promise.all([
    prisma.location.findFirst({
      where: { id, active: true },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, role: true } },
        balances: {
          where: { qty: { gt: 0 } },
          orderBy: { item: { sku: "asc" } },
          include: { item: true },
        },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.stockMove.findMany({
      where: {
        OR: [{ fromLocationId: id }, { toLocationId: id }],
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        item: true,
        user: true,
        fromLocation: true,
        toLocation: true,
      },
    }),
  ]);

  if (!location) notFound();

  const totalUnits = location.balances.reduce((sum, row) => sum + row.qty, 0);
  const totalValueCents = location.balances.reduce(
    (sum, row) => sum + row.qty * row.item.unitCostCents,
    0,
  );

  return (
    <>
      <div className="content-header">
        <div className="breadcrumb">
          <Link href="/locations">Locations</Link>
          <span>/</span>
          <span>{location.code}</span>
        </div>
        <h1>
          {location.code} · {location.name}
        </h1>
      </div>

      <section className="content">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="box box-primary lg:col-span-2">
            <div className="box-header">Location Details</div>
            <div className="box-body">
              <dl className="detail-grid">
                <div>
                  <dt>Kind</dt>
                  <dd>
                    <span className="chip chip-muted">{location.kind}</span>
                  </dd>
                </div>
                <div>
                  <dt>SKUs on hand</dt>
                  <dd>{location.balances.length}</dd>
                </div>
                <div>
                  <dt>Total units</dt>
                  <dd>{totalUnits}</dd>
                </div>
                <div>
                  <dt>Inventory value</dt>
                  <dd>{money(totalValueCents)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {location.kind === "TRUCK" ? (
            <div className="box">
              <div className="box-header">Assigned To</div>
              <div className="box-body">
                {location.assignedUser ? (
                  <div className="assignee-card">
                    <div className="assignee-name">{location.assignedUser.name}</div>
                    <div className="text-sm text-muted">{location.assignedUser.email}</div>
                    <div className="mt-2">
                      <span className="chip chip-muted">
                        {roleLabel(location.assignedUser.role)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted m-0">No one assigned to this truck yet.</p>
                )}
                <form action={assignTruckPerson} className="mt-4 space-y-2">
                  <input type="hidden" name="locationId" value={location.id} />
                  <label className="block">
                    <span className="field-label">Change assignment</span>
                    <select
                      className="field"
                      name="assignedUserId"
                      defaultValue={location.assignedUserId ?? ""}
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </div>

        <div className="box box-primary">
          <div className="box-header">Stock On Hand</div>
          <div className="box-body p-0">
            <LocationStockTable balances={location.balances} />
          </div>
        </div>

        <div className="box">
          <div className="box-header">Recent Activity</div>
          <div className="box-body p-0">
            {recentMoves.length === 0 ? (
              <div className="empty-state">
                <p>No moves recorded at this location yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Other location</th>
                      <th>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMoves.map((move) => {
                      const inbound = move.toLocationId === location.id;
                      const other = inbound ? move.fromLocation : move.toLocation;
                      return (
                        <tr key={move.id}>
                          <td className="text-muted whitespace-nowrap">
                            {format(move.createdAt, "MMM d, yyyy h:mm a")}
                          </td>
                          <td>
                            <span className="chip chip-muted">{move.type}</span>
                          </td>
                          <td>
                            <span className="sku">{move.item.sku}</span>
                            <div className="text-xs text-muted">{move.item.name}</div>
                          </td>
                          <td className="font-semibold">{move.qty}</td>
                          <td>
                            {other ? (
                              <Link href={`/locations/${other.id}`} className="text-link">
                                {other.code}
                              </Link>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{move.user?.name ?? "System"}</td>
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
