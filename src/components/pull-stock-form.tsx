"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { JobberJobOption } from "@/lib/jobber";

type ItemOption = { id: string; label: string };
type LocationOption = { id: string; label: string };

export function PullStockForm({
  items,
  locations,
  selectedItemId,
  jobber,
  action,
}: {
  items: ItemOption[];
  locations: LocationOption[];
  selectedItemId: string;
  jobber: {
    connected: boolean;
    jobs: JobberJobOption[];
    error: string | null;
  };
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"jobber" | "manual">(
    jobber.connected && jobber.jobs.length > 0 ? "jobber" : "manual",
  );
  const [jobberJobId, setJobberJobId] = useState("");
  const [manualJob, setManualJob] = useState("");

  const selectedJob = useMemo(
    () => jobber.jobs.find((job) => job.id === jobberJobId) ?? null,
    [jobber.jobs, jobberJobId],
  );

  const jobRefValue =
    mode === "jobber"
      ? selectedJob?.jobNumber
        ? `JOB-${selectedJob.jobNumber}`
        : selectedJob?.label || ""
      : manualJob;

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="field-label">Item</span>
        <select className="field" name="itemId" required defaultValue={selectedItemId}>
          <option value="" disabled>
            Select SKU
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">From location</span>
        <select className="field" name="locationId" required defaultValue="">
          <option value="" disabled>
            Select location
          </option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="field-label">Quantity</span>
        <input className="field" type="number" name="qty" min={1} defaultValue={1} required />
      </label>

      <div className="rounded border border-[#d2d6de] bg-[#fafafa] p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="field-label m-0">Job</span>
          {jobber.connected ? (
            <div className="flex gap-1">
              <button
                type="button"
                className={`top-skus-range-btn ${mode === "jobber" ? "is-active" : ""}`}
                onClick={() => setMode("jobber")}
              >
                Jobber
              </button>
              <button
                type="button"
                className={`top-skus-range-btn ${mode === "manual" ? "is-active" : ""}`}
                onClick={() => setMode("manual")}
              >
                Manual
              </button>
            </div>
          ) : (
            <Link
              href="/settings/integrations/jobber"
              className="text-xs text-[#3c8dbc]"
            >
              Connect Jobber
            </Link>
          )}
        </div>

        {mode === "jobber" && jobber.connected ? (
          <>
            {jobber.error ? (
              <p className="mb-2 rounded bg-[#fcf8e3] px-2 py-2 text-xs text-[#8a6d3b]">
                {jobber.error}
              </p>
            ) : null}
            <select
              className="field"
              value={jobberJobId}
              onChange={(e) => setJobberJobId(e.target.value)}
            >
              <option value="">Select a Jobber job</option>
              {jobber.jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>
            <input type="hidden" name="jobRef" value={jobRefValue} />
            {selectedJob ? (
              <p className="mt-2 mb-0 text-xs text-[#777]">
                Will record as{" "}
                <span className="font-mono text-[#444]">{jobRefValue || "—"}</span>
              </p>
            ) : (
              <p className="mt-2 mb-0 text-xs text-[#999]">
                {jobber.jobs.length === 0
                  ? "No jobs returned from Jobber yet."
                  : "Pick a job to stamp this pull."}
              </p>
            )}
          </>
        ) : (
          <input
            className="field"
            name="jobRef"
            placeholder="TC-1042"
            value={manualJob}
            onChange={(e) => setManualJob(e.target.value)}
          />
        )}
      </div>

      <label className="block">
        <span className="field-label">Note</span>
        <input className="field" name="note" />
      </label>
      <button type="submit" className="btn-primary">
        Pull stock
      </button>
    </form>
  );
}
