import { assignTruckPerson, createLocation } from "@/lib/actions/stock";
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

  return (
    <>
      <div className="content-header">
        <h1>Locations</h1>
      </div>
      <section className="content">
        <div className="box box-primary">
          <div className="box-header">Add Location</div>
          <div className="box-body">
            <form action={createLocation} className="grid gap-3 sm:grid-cols-4">
              <label>
                <span className="field-label">Code</span>
                <input className="field" name="code" placeholder="TRK-03" required />
              </label>
              <label>
                <span className="field-label">Name</span>
                <input className="field" name="name" required />
              </label>
              <label>
                <span className="field-label">Kind</span>
                <select className="field" name="kind" defaultValue="SHOP">
                  <option value="SHOP">Shop</option>
                  <option value="TRUCK">Truck</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label>
                <span className="field-label">Assigned to (trucks)</span>
                <select className="field" name="assignedUserId" defaultValue="">
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-4">
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>

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
                          <span className="text-muted">—</span>
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
