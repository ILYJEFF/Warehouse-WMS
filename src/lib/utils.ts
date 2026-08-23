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
