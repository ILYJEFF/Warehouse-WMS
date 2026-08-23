"use client";

import { Plus } from "lucide-react";
import { createItem } from "@/lib/actions/stock";
import { CollapsibleFormBox } from "@/components/collapsible-form-box";
import { TagPicker } from "@/components/tag-picker";
import type { TagOption } from "@/lib/tags";

type VendorOption = { id: string; name: string };

export function AddItemPanel({
  catalog,
  vendors,
}: {
  catalog: TagOption[];
  vendors: VendorOption[];
}) {
  return (
    <CollapsibleFormBox title="Add Item" icon={<Plus className="h-4 w-4" />}>
      <form action={createItem} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label>
          <span className="field-label">SKU</span>
          <input className="field" name="sku" placeholder="EMT-3/4" required />
        </label>
        <label className="sm:col-span-2">
          <span className="field-label">Name</span>
          <input className="field" name="name" required />
        </label>
        <label>
          <span className="field-label">Category</span>
          <input className="field" name="category" defaultValue="General" />
        </label>
        <label>
          <span className="field-label">Unit</span>
          <input className="field" name="unit" defaultValue="ea" />
        </label>
        <label>
          <span className="field-label">Reorder point</span>
          <input
            className="field"
            type="number"
            name="reorderPoint"
            defaultValue={0}
            min={0}
          />
        </label>
        <label>
          <span className="field-label">Unit cost ($)</span>
          <input
            className="field"
            type="number"
            name="unitCost"
            step="0.01"
            defaultValue={0}
            min={0}
          />
        </label>
        <label>
          <span className="field-label">Vendor (optional)</span>
          <select className="field" name="vendorId" defaultValue="">
            <option value="">No vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Vendor SKU / part # (optional)</span>
          <input className="field" name="vendorSku" autoComplete="off" />
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <TagPicker catalog={catalog} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </CollapsibleFormBox>
  );
}
