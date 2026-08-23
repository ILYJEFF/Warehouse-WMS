"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchHit = {
  id: string;
  sku: string;
  name: string;
  category: string;
};

export function HeaderSkuSearch() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setOpen(false);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { items?: SearchHit[] };
        setHits(data.items ?? []);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setHits([]);
        setError("Could not search");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToItem(item: SearchHit) {
    setQuery(item.sku);
    setOpen(false);
    router.push(`/items/${item.id}`);
  }

  async function submitLookup() {
    const q = query.trim();
    if (!q) return;

    // Prefer current hits if available.
    if (hits.length > 0) {
      const exact = hits.find(
        (hit) => hit.sku.toUpperCase() === q.toUpperCase(),
      );
      goToItem(exact ?? hits[activeIndex >= 0 ? activeIndex : 0]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { items?: SearchHit[] };
      const items = data.items ?? [];
      if (items.length === 0) {
        setError("No matching SKU");
        setOpen(true);
        return;
      }
      const exact = items.find(
        (hit) => hit.sku.toUpperCase() === q.toUpperCase(),
      );
      goToItem(exact ?? items[0]);
    } catch {
      setError("Could not search");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="header-search" ref={rootRef}>
      <input
        className="header-search-input"
        placeholder="Lookup by SKU"
        aria-label="Lookup by SKU"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        role="combobox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (hits.length > 0 || error) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open && hits.length > 0) setOpen(true);
            setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            void submitLookup();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="header-search-btn"
        aria-label="Search"
        onClick={() => void submitLookup()}
      >
        <Search className="h-4 w-4" />
      </button>

      {open ? (
        <div className="header-search-menu" id={listId} role="listbox">
          {loading ? (
            <p className="header-search-empty">Searching…</p>
          ) : error ? (
            <p className="header-search-empty">{error}</p>
          ) : hits.length === 0 ? (
            <p className="header-search-empty">No matching SKU</p>
          ) : (
            hits.map((hit, index) => (
              <button
                key={hit.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`header-search-option ${
                  index === activeIndex ? "is-active" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToItem(hit)}
              >
                <span className="header-search-sku">{hit.sku}</span>
                <span className="header-search-name">{hit.name}</span>
                <span className="header-search-meta">{hit.category}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
