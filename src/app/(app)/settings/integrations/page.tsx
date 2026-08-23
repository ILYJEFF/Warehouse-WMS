import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plug } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { isAdmin, requireUser } from "@/lib/auth";
import { getJobberConnection } from "@/lib/jobber-connection";
import { jobberConfigured } from "@/lib/jobber";

export default async function IntegrationsPage() {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const connection = await getJobberConnection();
  const configured = jobberConfigured();

  return (
    <>
      <div className="content-header">
        <div className="content-header-row">
          <BackButton href="/settings" label="Back to settings" />
        </div>
        <h1>Integrations</h1>
      </div>
      <section className="content">
        <p className="mb-5 max-w-2xl text-sm text-[#777]">
          Connect outside systems so warehouse pulls and jobs stay in sync.
        </p>

        <div className="settings-grid">
          <Link
            href="/settings/integrations/jobber"
            className="settings-tile group"
            style={{ ["--tile-accent" as string]: "#7c3aed" }}
          >
            <span className="settings-tile-icon" aria-hidden>
              <Plug className="h-6 w-6" />
            </span>
            <span className="settings-tile-body">
              <span className="settings-tile-title">Jobber</span>
              <span className="settings-tile-desc">
                {connection
                  ? `Connected to ${connection.accountName || "Jobber account"}. Pick live jobs when pulling stock.`
                  : configured
                    ? "OAuth credentials detected. Connect your Jobber account."
                    : "Add Jobber app credentials, then connect to pull against live jobs."}
              </span>
              <span
                className={`mt-2 inline-flex w-fit chip ${
                  connection ? "chip-ok" : "chip-muted"
                }`}
              >
                {connection ? "Connected" : "Not connected"}
              </span>
            </span>
            <ArrowRight className="settings-tile-arrow h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
