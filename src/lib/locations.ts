import type { Location, User } from "@prisma/client";

type LocationWithAssignee = Pick<Location, "code" | "name" | "kind"> & {
  assignedUser?: Pick<User, "name"> | null;
};

export function formatLocationLabel(location: LocationWithAssignee) {
  const base = `${location.code} · ${location.name}`;
  if (location.kind === "TRUCK" && location.assignedUser?.name) {
    return `${base} (${location.assignedUser.name})`;
  }
  return base;
}
