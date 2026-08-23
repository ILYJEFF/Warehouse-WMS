import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function stockChip(qty: number, reorderPoint: number) {
  if (qty <= 0) return { label: "Out", className: "chip chip-danger" };
  if (qty <= reorderPoint) return { label: "Low", className: "chip chip-warn" };
  return { label: "In stock", className: "chip chip-ok" };
}

/** Normalize freeform tag input into unique lowercase tags. */
export function parseTags(raw: string | null | undefined) {
  if (!raw) return [] as string[];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const tag = part.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }
  return tags;
}

export function formatTagsInput(tags: string[]) {
  return tags.join(", ");
}
