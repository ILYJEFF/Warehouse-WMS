import Link from "next/link";
import { redirect } from "next/navigation";
import { TagsManager } from "@/components/tags-manager";
import { isAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const params = await searchParams;
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  const rows = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    itemCount: tag._count.items,
  }));

  const errorMessage =
    params.error === "missing"
      ? "Tag name is required."
      : params.error === "exists"
        ? "That tag name is already in use."
        : null;

  const successMessage = params.created
    ? "Tag created."
    : params.saved
      ? "Tag updated."
      : params.deleted
        ? "Tag deleted."
        : null;

  return (
    <>
      <div className="content-header">
        <h1>Tags</h1>
      </div>
      <section className="content">
        <p className="mb-4 text-sm text-[#777]">
          <Link href="/settings" className="text-[#3c8dbc]">
            Back to settings
          </Link>
        </p>

        {successMessage ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded bg-[#f2dede] px-3 py-2 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <TagsManager tags={rows} />
      </section>
    </>
  );
}
