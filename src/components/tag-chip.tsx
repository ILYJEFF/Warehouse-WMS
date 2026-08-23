import Link from "next/link";
import { tagTextColor, type TagOption } from "@/lib/tags";

export function TagChip({
  tag,
  href,
}: {
  tag: Pick<TagOption, "name" | "color">;
  href?: string;
}) {
  const style = {
    background: tag.color,
    color: tagTextColor(tag.color),
  };

  if (href) {
    return (
      <Link href={href} className="tag-chip" style={style}>
        {tag.name}
      </Link>
    );
  }

  return (
    <span className="tag-chip" style={style}>
      {tag.name}
    </span>
  );
}
