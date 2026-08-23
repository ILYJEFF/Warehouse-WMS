"use client";

import { Plus } from "lucide-react";
import { createLocation } from "@/lib/actions/stock";
import { CollapsibleFormBox } from "@/components/collapsible-form-box";

type UserOption = {
  id: string;
  name: string;
};

export function AddLocationPanel({ users }: { users: UserOption[] }) {
  return (
    <CollapsibleFormBox title="Add Location" icon={<Plus className="h-4 w-4" />}>
      <form action={createLocation} className="grid gap-3 sm:grid-cols-4">
        <label>
          <span className="field-label">Code</span>
          <input className="field" name="code" placeholder="TRK-03" required />
        </label>
        <label>
          <span className="field-label">Name</span>
          <input className="field" name="name" required />
        </label>
        <label>
          <span className="field-label">Kind</span>
          <select className="field" name="kind" defaultValue="SHOP">
            <option value="SHOP">Shop</option>
            <option value="TRUCK">Truck</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          <span className="field-label">Assigned to (trucks)</span>
          <select className="field" name="assignedUserId" defaultValue="">
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-4">
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </CollapsibleFormBox>
  );
}
