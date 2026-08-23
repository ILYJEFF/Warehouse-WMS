"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  TAG_COLOR_PRESETS,
  normalizeTagName,
  tagTextColor,
  type TagOption,
} from "@/lib/tags";

type Selected =
  | { kind: "existing"; tag: TagOption }
  | { kind: "new"; name: string; color: string };

type TagPickerProps = {
  catalog: TagOption[];
  initialSelected?: TagOption[];
};

export function TagPicker({ catalog, initialSelected = [] }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected[]>(
    initialSelected.map((tag) => ({ kind: "existing", tag })),
  );
  const [newColor, setNewColor] = useState<string>(TAG_COLOR_PRESETS[0]);
  const [open, setOpen] = useState(false);

  const selectedNames = useMemo(() => {
    const set = new Set<string>();
    for (const row of selected) {
      set.add(row.kind === "existing" ? row.tag.name : row.name);
    }
    return set;
  }, [selected]);

  const normalizedQuery = normalizeTagName(query);
  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return catalog.filter((tag) => !selectedNames.has(tag.name)).slice(0, 8);
    }
    return catalog
      .filter(
        (tag) =>
          !selectedNames.has(tag.name) &&
          tag.name.includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [catalog, normalizedQuery, selectedNames]);

  const exactExists =
    Boolean(normalizedQuery) &&
    (catalog.some((tag) => tag.name === normalizedQuery) ||
      selectedNames.has(normalizedQuery));

  function addExisting(tag: TagOption) {
    setSelected((prev) =>
      prev.some((row) => row.kind === "existing" && row.tag.id === tag.id)
        ? prev
        : [...prev, { kind: "existing", tag }],
    );
    setQuery("");
    setOpen(false);
  }

  function addNew() {
    if (!normalizedQuery || exactExists) return;
    setSelected((prev) => [...prev, { kind: "new", name: normalizedQuery, color: newColor }]);
    setQuery("");
    setOpen(false);
  }

  function removeAt(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="tag-picker">
      <span className="field-label">Tags</span>

      {selected.length > 0 ? (
        <div className="tag-list mb-2">
          {selected.map((row, index) => {
            const name = row.kind === "existing" ? row.tag.name : row.name;
            const color = row.kind === "existing" ? row.tag.color : row.color;
            return (
              <button
                key={`${row.kind}-${name}`}
                type="button"
                className="tag-chip tag-chip-button"
                style={{ background: color, color: tagTextColor(color) }}
                onClick={() => removeAt(index)}
                title="Remove tag"
              >
                {name}
                <X className="h-3 w-3 opacity-80" />
              </button>
            );
          })}
        </div>
      ) : null}

      {selected.map((row) =>
        row.kind === "existing" ? (
          <input key={`id-${row.tag.id}`} type="hidden" name="tagIds" value={row.tag.id} />
        ) : (
          <input
            key={`new-${row.name}`}
            type="hidden"
            name="newTags"
            value={`${row.name}|${row.color}`}
          />
        ),
      )}

      <div className="tag-picker-search">
        <Search className="tag-picker-search-icon h-4 w-4" />
        <input
          className="field tag-picker-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Search tags or create a new one"
          autoComplete="off"
        />
      </div>

      {open ? (
        <div className="tag-picker-menu">
          {matches.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="tag-picker-option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addExisting(tag)}
            >
              <span
                className="tag-chip"
                style={{ background: tag.color, color: tagTextColor(tag.color) }}
              >
                {tag.name}
              </span>
            </button>
          ))}

          {normalizedQuery && !exactExists ? (
            <div className="tag-picker-create">
              <div className="tag-picker-create-row">
                <span className="text-sm text-muted">Create</span>
                <span
                  className="tag-chip"
                  style={{ background: newColor, color: tagTextColor(newColor) }}
                >
                  {normalizedQuery}
                </span>
              </div>
              <div className="tag-color-row">
                {TAG_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`tag-color-swatch ${newColor === color ? "is-active" : ""}`}
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
              <button
                type="button"
                className="btn-primary btn-sm mt-2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addNew}
              >
                <Plus className="h-3.5 w-3.5" />
                Add tag
              </button>
            </div>
          ) : null}

          {!normalizedQuery && matches.length === 0 ? (
            <p className="tag-picker-empty">No tags yet. Type a name to create one.</p>
          ) : null}

          {normalizedQuery && matches.length === 0 && exactExists ? (
            <p className="tag-picker-empty">That tag is already selected.</p>
          ) : null}
        </div>
      ) : null}

      <span className="field-hint">
        Search existing tags to keep them consistent. New tags get a color you choose.
      </span>
    </div>
  );
}
