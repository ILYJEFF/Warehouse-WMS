import { pullStock } from "@/lib/actions/stock";
import { formatLocationLabel } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

export default async function PullPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const params = await searchParams;
  const [items, locations] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { sku: "asc" } }),
    prisma.location.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
      include: { assignedUser: { select: { name: true } } },
    }),
  ]);

  const selectedItemId =
    params.itemId && items.some((item) => item.id === params.itemId)
      ? params.itemId
      : "";

  return (
    <>
      <div className="content-header">
        <h1>Pull to Job</h1>
      </div>
      <section className="content">
        <div className="box box-primary max-w-xl">
          <div className="box-header">Outbound</div>
          <div className="box-body">
            <form action={pullStock} className="space-y-4">
              <label className="block">
                <span className="field-label">Item</span>
                <select className="field" name="itemId" required defaultValue={selectedItemId}>
                  <option value="" disabled>
                    Select SKU
                  </option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">From location</span>
                <select className="field" name="locationId" required defaultValue="">
                  <option value="" disabled>
                    Select location
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {formatLocationLabel(loc)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Quantity</span>
                <input className="field" type="number" name="qty" min={1} defaultValue={1} required />
              </label>
              <label className="block">
                <span className="field-label">Job number</span>
                <input className="field" name="jobRef" placeholder="TC-1042" />
              </label>
              <label className="block">
                <span className="field-label">Note</span>
                <input className="field" name="note" />
              </label>
              <button type="submit" className="btn-primary">
                Pull stock
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
