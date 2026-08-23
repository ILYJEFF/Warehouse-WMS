import { PullStockForm } from "@/components/pull-stock-form";
import { pullStock } from "@/lib/actions/stock";
import { listJobberJobsForPull } from "@/lib/jobber-connection";
import { formatLocationLabel } from "@/lib/locations";
import { prisma } from "@/lib/prisma";

export default async function PullPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const params = await searchParams;
  const [items, locations, jobber] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: { sku: "asc" } }),
    prisma.location.findMany({
      where: { active: true },
      orderBy: { code: "asc" },
      include: { assignedUser: { select: { name: true } } },
    }),
    listJobberJobsForPull(),
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
            <PullStockForm
              action={pullStock}
              selectedItemId={selectedItemId}
              items={items.map((item) => ({
                id: item.id,
                label: `${item.sku} · ${item.name}`,
              }))}
              locations={locations.map((loc) => ({
                id: loc.id,
                label: formatLocationLabel(loc),
              }))}
              jobber={jobber}
            />
          </div>
        </div>
      </section>
    </>
  );
}
