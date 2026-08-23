import type { Location, User } from "@prisma/client";

type LocationWithAssignee = Pick<
  Location,
  "code" | "name" | "kind" | "licensePlate" | "vin"
> & {
  assignedUser?: Pick<User, "name"> | null;
};

/** Normalize plate for codes: letters/numbers only, uppercase. */
export function normalizeLicensePlate(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Normalize VIN: 17-char alphanumeric typical, keep uppercase alnum. */
export function normalizeVin(raw: string) {
  const value = raw.trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  return value || null;
}

/** Build truck location code like TRK-01-ABC1234. */
export function buildTruckCode(truckNumber: number, licensePlate: string) {
  const plate = normalizeLicensePlate(licensePlate);
  const num = String(Math.max(1, truckNumber)).padStart(2, "0");
  return `TRK-${num}-${plate}`;
}

/** Parse TRK-01-... truck sequence number from an existing code. */
export function parseTruckNumber(code: string) {
  const match = /^TRK-(\d+)/i.exec(code.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function formatLocationLabel(location: LocationWithAssignee) {
  const base = `${location.code} · ${location.name}`;
  if (location.kind === "TRUCK" && location.assignedUser?.name) {
    return `${base} (${location.assignedUser.name})`;
  }
  return base;
}
