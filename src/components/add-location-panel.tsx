"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createLocation } from "@/lib/actions/stock";
import { CollapsibleFormBox } from "@/components/collapsible-form-box";
import { buildTruckCode, normalizeLicensePlate } from "@/lib/locations";

type UserOption = {
  id: string;
  name: string;
};

export function AddLocationPanel({
  users,
  nextTruckNumber = 1,
}: {
  users: UserOption[];
  nextTruckNumber?: number;
}) {
  const [kind, setKind] = useState("SHOP");
  const [plate, setPlate] = useState("");
  const isTruck = kind === "TRUCK";

  const previewCode = useMemo(() => {
    const normalized = normalizeLicensePlate(plate);
    if (!normalized) return `TRK-${String(nextTruckNumber).padStart(2, "0")}-…`;
    return buildTruckCode(nextTruckNumber, normalized);
  }, [plate, nextTruckNumber]);

  return (
    <CollapsibleFormBox title="Add Location" icon={<Plus className="h-4 w-4" />}>
      <form action={createLocation} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="field-label">Kind</span>
          <select
            className="field"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="SHOP">Shop</option>
            <option value="TRUCK">Truck</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        {isTruck ? (
          <>
            <label>
              <span className="field-label">Truck name</span>
              <input
                className="field"
                name="name"
                required
                placeholder="e.g. Service van"
                autoComplete="off"
              />
            </label>
            <label>
              <span className="field-label">License plate</span>
              <input
                className="field"
                name="licensePlate"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="ABC1234"
                autoComplete="off"
              />
            </label>
            <label>
              <span className="field-label">VIN (optional)</span>
              <input
                className="field"
                name="vin"
                placeholder="17-character VIN"
                autoComplete="off"
                maxLength={17}
              />
            </label>
            <label className="sm:col-span-2 lg:col-span-2">
              <span className="field-label">Assigned to</span>
              <select className="field" name="assignedUserId" defaultValue="">
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-2 rounded border border-[#d2d6de] bg-[#fafafa] px-3 py-2">
              <p className="m-0 text-xs uppercase tracking-wide text-[#888]">
                Location code
              </p>
              <p className="m-0 mt-1 font-mono text-sm font-semibold text-[#444]">
                {previewCode}
              </p>
              <p className="m-0 mt-1 text-xs text-[#999]">
                Auto-built as TRK-##-PLATE from the next truck number and plate.
              </p>
            </div>
          </>
        ) : (
          <>
            <label>
              <span className="field-label">Code</span>
              <input
                className="field"
                name="code"
                placeholder="SHOP-01"
                required
                autoComplete="off"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Name</span>
              <input className="field" name="name" required autoComplete="off" />
            </label>
          </>
        )}

        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </CollapsibleFormBox>
  );
}
