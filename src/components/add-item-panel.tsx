"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { createItem } from "@/lib/actions/stock";
import { TagPicker } from "@/components/tag-picker";
import type { TagOption } from "@/lib/tags";

export function AddItemPanel({ catalog }: { catalog: TagOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="box box-primary">
      <button
        type="button"
        className="box-header add-item-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="box-body">
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
            <div className="sm:col-span-2 lg:col-span-3">
              <TagPicker catalog={catalog} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
