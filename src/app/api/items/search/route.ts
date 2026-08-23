import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 1) {
    return NextResponse.json({ items: [] });
  }

  const exactSku = q.toUpperCase();
  const items = await prisma.item.findMany({
    where: {
      active: true,
      OR: [
        { sku: { equals: exactSku, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ sku: "asc" }],
    take: 12,
    select: {
      id: true,
      sku: true,
      name: true,
      category: true,
    },
  });

  // Prefer exact SKU matches first.
  items.sort((a, b) => {
    const aExact = a.sku.toUpperCase() === exactSku ? 0 : 1;
    const bExact = b.sku.toUpperCase() === exactSku ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.sku.localeCompare(b.sku);
  });

  return NextResponse.json({ items });
}
