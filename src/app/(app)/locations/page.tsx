import { assignTruckPerson } from "@/lib/actions/stock";
import { AddLocationPanel } from "@/components/add-location-panel";
import { parseTruckNumber } from "@/lib/locations";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function LocationsPage() {
  const [locations, users] = await Promise.all([
    prisma.location.findMany({
      where: { active: true },
      orderBy: [{ kind: "asc" }, { code: "asc" }],
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        _count: { select: { balances: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  let nextTruckNumber = 1;
  for (const loc of locations) {
    if (loc.kind !== "TRUCK") continue;
    const n = parseTruckNumber(loc.code);
    if (n !== null) nextTruckNumber = Math.max(nextTruckNumber, n + 1);
  }

  return (
    <>
      <div className="content-header">
        <h1>Locations</h1>
      </div>
      <section className="content">
        <AddLocationPanel users={users} nextTruckNumber={nextTruckNumber} />

        <div className="box">
          <div className="box-header">Location List</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Kind</th>
                    <th>Plate / VIN</th>
                    <th>Assigned to</th>
                    <th>Stock rows</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id} className="row-link">
                      <td className="sku">
                        <Link href={`/locations/${loc.id}`} className="row-link-target">
                          {loc.code}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/locations/${loc.id}`} className="row-link-target">
                          {loc.name}
                        </Link>
                      </td>
                      <td>
                        <span className="chip chip-muted">{loc.kind}</span>
                      </td>
                      <td>
                        {loc.kind === "TRUCK" ? (
                          <div>
                            <div className="font-mono text-sm">
                              {loc.licensePlate || "—"}
                            </div>
                            {loc.vin ? (
                              <div className="text-xs text-[#999] font-mono">{loc.vin}</div>
                            ) : (
                              <div className="text-xs text-[#999]">No VIN</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {loc.kind === "TRUCK" ? (
                          <form
                            action={assignTruckPerson}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input type="hidden" name="locationId" value={loc.id} />
                            <select
                              className="field field-sm min-w-[10rem]"
                              name="assignedUserId"
                              defaultValue={loc.assignedUserId ?? ""}
                            >
                              <option value="">Unassigned</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="btn-default btn-sm">
                              Save
                            </button>
                          </form>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/locations/${loc.id}`} className="text-link font-semibold">
                          {loc._count.balances}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
