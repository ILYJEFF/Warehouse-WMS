"use client";

import { useState } from "react";
import { TAG_COLOR_PRESETS, tagTextColor } from "@/lib/tags";
import { createTag, deleteTag, updateTag } from "@/lib/actions/tags";

type TagRow = {
  id: string;
  name: string;
  color: string;
  itemCount: number;
};

export function TagsManager({ tags }: { tags: TagRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createColor, setCreateColor] = useState<string>(TAG_COLOR_PRESETS[0]);

  return (
    <div className="space-y-4">
      <div className="box box-primary">
        <div className="box-header">Add tag</div>
        <div className="box-body">
          <form action={createTag} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="block">
              <span className="field-label">Name</span>
              <input
                className="field"
                name="name"
                required
                placeholder="e.g. refrigerant"
                autoComplete="off"
              />
            </label>
            <div>
              <span className="field-label">Color</span>
              <input type="hidden" name="color" value={createColor} />
              <div className="tag-color-row mt-1">
                {TAG_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`tag-color-swatch ${createColor === color ? "is-active" : ""}`}
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                    onClick={() => setCreateColor(color)}
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Create tag
            </button>
          </form>
        </div>
      </div>

      <div className="box">
        <div className="box-header">All tags</div>
        <div className="box-body p-0">
          {tags.length === 0 ? (
            <p className="m-0 px-4 py-6 text-sm text-[#777]">
              No tags yet. Create one above, or add tags while editing an item.
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Items</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => {
                    const editing = editingId === tag.id;
                    return (
                      <tr key={tag.id}>
                        <td colSpan={editing ? 3 : undefined}>
                          {editing ? (
                            <EditTagRow
                              tag={tag}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <span
                              className="tag-chip"
                              style={{
                                background: tag.color,
                                color: tagTextColor(tag.color),
                              }}
                            >
                              {tag.name}
                            </span>
                          )}
                        </td>
                        {!editing ? (
                          <>
                            <td>{tag.itemCount}</td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className="text-[#3c8dbc]"
                                  onClick={() => setEditingId(tag.id)}
                                >
                                  Edit
                                </button>
                                <form action={deleteTag}>
                                  <input type="hidden" name="id" value={tag.id} />
                                  <button
                                    type="submit"
                                    className="text-[#dd4b39]"
                                    onClick={(e) => {
                                      if (
                                        !window.confirm(
                                          `Delete tag “${tag.name}”? It will be removed from ${tag.itemCount} item${tag.itemCount === 1 ? "" : "s"}.`,
                                        )
                                      ) {
                                        e.preventDefault();
                                      }
                                    }}
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </td>
                          </>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditTagRow({
  tag,
  onCancel,
}: {
  tag: TagRow;
  onCancel: () => void;
}) {
  const [color, setColor] = useState(tag.color);

  return (
    <form action={updateTag} className="flex flex-col gap-3 py-1 sm:flex-row sm:items-end">
      <input type="hidden" name="id" value={tag.id} />
      <input type="hidden" name="color" value={color} />
      <label className="block min-w-0 flex-1">
        <span className="field-label">Name</span>
        <input
          className="field"
          name="name"
          defaultValue={tag.name}
          required
          autoComplete="off"
        />
      </label>
      <div>
        <span className="field-label">Color</span>
        <div className="tag-color-row mt-1">
          {TAG_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`tag-color-swatch ${color === preset ? "is-active" : ""}`}
              style={{ background: preset }}
              aria-label={`Color ${preset}`}
              onClick={() => setColor(preset)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          Save
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
