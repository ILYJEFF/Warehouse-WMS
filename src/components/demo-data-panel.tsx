"use client";

import { Database, Trash2 } from "lucide-react";
import { clearDemoDataAction, loadDemoDataAction } from "@/lib/actions/demo";
import type { DemoStats } from "@/lib/demo-seed";

export function DemoDataPanel({
  stats,
  total,
}: {
  stats: DemoStats;
  total: number;
}) {
  const hasDemo = total > 0;

  return (
    <div className="box box-primary">
      <div className="box-header flex flex-wrap items-center gap-2">
        <Database className="h-4 w-4" />
        Test data
      </div>
      <div className="box-body">
        <p className="m-0 max-w-3xl text-sm text-[#666]">
          Load a big sample catalog (vendors, tags, trucks with plates, SKUs, stock,
          and pull history) so you can click around Purchasing, Top 100, and the rest.
          Everything is marked as demo and can be wiped without touching real records.
        </p>

        <div className="demo-stats mt-4">
          <div>
            <span className="demo-stat-value">{stats.items}</span>
            <span className="demo-stat-label">SKUs</span>
          </div>
          <div>
            <span className="demo-stat-value">{stats.locations}</span>
            <span className="demo-stat-label">Locations</span>
          </div>
          <div>
            <span className="demo-stat-value">{stats.vendors}</span>
            <span className="demo-stat-label">Vendors</span>
          </div>
          <div>
            <span className="demo-stat-value">{stats.tags}</span>
            <span className="demo-stat-label">Tags</span>
          </div>
          <div>
            <span className="demo-stat-value">{stats.moves}</span>
            <span className="demo-stat-label">Moves</span>
          </div>
          <div>
            <span className="demo-stat-value">{stats.users}</span>
            <span className="demo-stat-label">Users</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <form action={loadDemoDataAction}>
            <button type="submit" className="btn-primary">
              {hasDemo ? "Reload test data" : "Load test data"}
            </button>
          </form>
          <form
            action={clearDemoDataAction}
            onSubmit={(e) => {
              if (
                !window.confirm(
                  "Delete all DEMO test data (SKUs, trucks, vendors, tags, moves, demo users)? Real data stays.",
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="btn-ghost inline-flex items-center gap-2"
              disabled={!hasDemo}
            >
              <Trash2 className="h-4 w-4" />
              Delete test data
            </button>
          </form>
        </div>

        <p className="mt-3 mb-0 text-xs text-[#999]">
          Demo logins use password <span className="font-mono">DemoPass123!</span> and
          emails like <span className="font-mono">tech1@demo.wms.local</span>. Reload
          replaces previous demo data first.
        </p>
      </div>
    </div>
  );
}
