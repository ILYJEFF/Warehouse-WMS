"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  clearCycleCountLine,
  removeCycleCountLine,
  saveCycleCountLine,
} from "@/lib/actions/cycle-counts";

export type CycleCountLineView = {
  id: string;
  expectedQty: number;
  countedQty: number | null;
  note: string | null;
  item: {
    id: string;
    sku: string;
    name: string;
    category: string;
  };
};

function varianceClass(expected: number, counted: number | null) {
  if (counted === null) return "cc-var is-pending";
  if (counted === expected) return "cc-var is-match";
  if (counted < expected) return "cc-var is-short";
  return "cc-var is-over";
}

function varianceLabel(expected: number, counted: number | null) {
  if (counted === null) return "Not counted";
  const delta = counted - expected;
  if (delta === 0) return "Match";
  if (delta < 0) return `${delta}`;
  return `+${delta}`;
}

export function CycleCountWorkspace({
  blind,
  readOnly,
  focusLineId,
  lines,
}: {
  blind: boolean;
  readOnly: boolean;
  focusLineId?: string;
  lines: CycleCountLineView[];
}) {
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  const focusRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (line) =>
        line.item.sku.toLowerCase().includes(q) ||
        line.item.name.toLowerCase().includes(q) ||
        line.item.category.toLowerCase().includes(q),
    );
  }, [filter, lines]);

  const counted = lines.filter((l) => l.countedQty !== null).length;
  const matches = lines.filter(
    (l) => l.countedQty !== null && l.countedQty === l.expectedQty,
  ).length;
  const variances = lines.filter(
    (l) => l.countedQty !== null && l.countedQty !== l.expectedQty,
  ).length;
  const progress = lines.length === 0 ? 0 : Math.round((counted / lines.length) * 100);

  useEffect(() => {
    if (focusLineId && focusRef.current) {
      focusRef.current.focus();
      focusRef.current.select();
    }
  }, [focusLineId]);

  return (
    <div className="cc-workspace">
      <div className="cc-progress-card">
        <div className="cc-progress-top">
          <div>
            <p className="cc-progress-label">Count progress</p>
            <p className="cc-progress-value">
              {counted}
              <span> / {lines.length} lines</span>
            </p>
          </div>
          <div className="cc-stat-row">
            <div className="cc-stat">
              <span className="cc-stat-num">{matches}</span>
              <span className="cc-stat-label">Match</span>
            </div>
            <div className="cc-stat">
              <span className="cc-stat-num text-[#dd4b39]">{variances}</span>
              <span className="cc-stat-label">Variance</span>
            </div>
            <div className="cc-stat">
              <span className="cc-stat-num">{lines.length - counted}</span>
              <span className="cc-stat-label">Left</span>
            </div>
          </div>
        </div>
        <div className="cc-progress-track" aria-hidden>
          <div className="cc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="cc-toolbar">
        <input
          className="cc-filter"
          placeholder="Filter SKU or name on this count"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter count lines"
        />
        {pending ? <span className="cc-saving">Saving…</span> : null}
      </div>

      <div className="table-wrap">
        <table className="data cc-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item</th>
              {!blind ? <th className="text-right">Expected</th> : null}
              <th className="text-right">Counted</th>
              {!blind ? <th className="text-right">Variance</th> : null}
              {!readOnly ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={blind ? 4 : 6} className="text-muted">
                  {lines.length === 0
                    ? "No lines yet. Add a SKU above to start counting."
                    : "No lines match that filter."}
                </td>
              </tr>
            ) : (
              filtered.map((line) => {
                const isFocus = line.id === focusLineId;
                return (
                  <tr
                    key={line.id}
                    className={
                      line.countedQty !== null ? "cc-row is-counted" : "cc-row"
                    }
                  >
                    <td className="sku">{line.item.sku}</td>
                    <td>
                      <div className="font-semibold text-[#444]">{line.item.name}</div>
                      <div className="text-xs text-muted">{line.item.category}</div>
                    </td>
                    {!blind ? (
                      <td className="text-right font-semibold">{line.expectedQty}</td>
                    ) : null}
                    <td className="text-right">
                      {readOnly ? (
                        <span className="font-semibold">
                          {line.countedQty ?? "-"}
                        </span>
                      ) : (
                        <form
                          action={(fd) => {
                            startTransition(async () => {
                              await saveCycleCountLine(fd);
                            });
                          }}
                          className="cc-qty-form"
                        >
                          <input type="hidden" name="lineId" value={line.id} />
                          <input
                            ref={isFocus ? focusRef : undefined}
                            name="countedQty"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            className="cc-qty-input"
                            defaultValue={
                              line.countedQty === null ? "" : line.countedQty
                            }
                            placeholder="-"
                            aria-label={`Counted qty for ${line.item.sku}`}
                            onBlur={(e) => {
                              const form = e.currentTarget.form;
                              if (!form) return;
                              const next = e.currentTarget.value.trim();
                              const prev =
                                line.countedQty === null
                                  ? ""
                                  : String(line.countedQty);
                              if (next === prev) return;
                              form.requestSubmit();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.form?.requestSubmit();
                                const row = e.currentTarget.closest("tr");
                                const next = row?.nextElementSibling?.querySelector(
                                  "input[name='countedQty']",
                                ) as HTMLInputElement | null;
                                next?.focus();
                                next?.select();
                              }
                            }}
                          />
                        </form>
                      )}
                    </td>
                    {!blind ? (
                      <td className="text-right">
                        <span
                          className={varianceClass(
                            line.expectedQty,
                            line.countedQty,
                          )}
                        >
                          {varianceLabel(line.expectedQty, line.countedQty)}
                        </span>
                      </td>
                    ) : null}
                    {!readOnly ? (
                      <td className="text-right">
                        <div className="cc-row-actions">
                          {line.countedQty !== null ? (
                            <form
                              action={(fd) => {
                                startTransition(async () => {
                                  await clearCycleCountLine(fd);
                                });
                              }}
                            >
                              <input type="hidden" name="lineId" value={line.id} />
                              <button type="submit" className="cc-link-btn">
                                Clear
                              </button>
                            </form>
                          ) : null}
                          <form
                            action={(fd) => {
                              startTransition(async () => {
                                await removeCycleCountLine(fd);
                              });
                            }}
                          >
                            <input type="hidden" name="lineId" value={line.id} />
                            <button type="submit" className="cc-link-btn is-danger">
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
