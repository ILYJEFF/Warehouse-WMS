import { prisma } from "@/lib/prisma";
import { normalizeTagName, parseNewTags, parseTagIds } from "@/lib/tags";

export async function syncItemTags(itemId: string, formData: FormData) {
  const tagIds = parseTagIds(formData);
  const newTags = parseNewTags(formData);
  const resolvedIds = new Set(tagIds);

  for (const draft of newTags) {
    const name = normalizeTagName(draft.name);
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      resolvedIds.add(existing.id);
      continue;
    }
    const created = await prisma.tag.create({
      data: { name, color: draft.color },
    });
    resolvedIds.add(created.id);
  }

  const finalIds = Array.from(resolvedIds);
  await prisma.itemTag.deleteMany({ where: { itemId } });
  if (finalIds.length > 0) {
    await prisma.itemTag.createMany({
      data: finalIds.map((tagId) => ({ itemId, tagId })),
      skipDuplicates: true,
    });
  }
}
