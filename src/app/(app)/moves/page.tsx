import { format } from "date-fns";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MovesPage() {
  const moves = await prisma.stockMove.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      item: true,
      fromLocation: true,
      toLocation: true,
      user: true,
    },
  });

  return (
    <>
      <div className="content-header">
        <h1>Recent Activity</h1>
      </div>
      <section className="content">
        <div className="box box-primary">
          <div className="box-header">Activity Log</div>
          <div className="box-body p-0">
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Item</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {moves.map((move) => (
                    <tr key={move.id}>
                      <td>{format(move.createdAt, "M/d/yyyy h:mm a")}</td>
                      <td>
                        <span className="text-link">{move.user?.name ?? "—"}</span>
                      </td>
                      <td>{move.type}</td>
                      <td>
                        <Link href={`/items/${move.item.id}`} className="row-link-target">
                          <span className="sku">{move.item.sku}</span> ({move.qty})
                        </Link>
                      </td>
                      <td>
                        {move.jobRef ||
                          [move.fromLocation?.code, move.toLocation?.code]
                            .filter(Boolean)
                            .join(" → ") ||
                          "—"}
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
