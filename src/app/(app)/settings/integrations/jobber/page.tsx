import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { BackButton } from "@/components/back-button";
import { disconnectJobberAction } from "@/lib/actions/jobber";
import { isAdmin, requireUser } from "@/lib/auth";
import { jobberConfigured, jobberRedirectUri } from "@/lib/jobber";
import { getJobberConnection } from "@/lib/jobber-connection";

export default async function JobberIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
}) {
  const me = await requireUser();
  if (!me || !isAdmin(me.role)) redirect("/");

  const params = await searchParams;
  const connection = await getJobberConnection();
  const configured = jobberConfigured();

  let redirectUri = "";
  try {
    redirectUri = jobberRedirectUri();
  } catch {
    redirectUri = "(set APP_URL or JOBBER_REDIRECT_URI)";
  }

  const errorMessage =
    params.error === "config"
      ? "Add JOBBER_CLIENT_ID and JOBBER_CLIENT_SECRET to your environment, then try again."
      : params.error === "denied"
        ? "Jobber authorization was cancelled."
        : params.error === "state"
          ? "OAuth state mismatch. Try connecting again."
          : params.error === "token"
            ? "Could not exchange the Jobber authorization code. Check credentials and redirect URI."
            : params.error === "missing"
              ? "Jobber did not return an authorization code."
              : null;

  const successMessage = params.connected
    ? "Jobber connected."
    : params.disconnected
      ? "Jobber disconnected."
      : null;

  return (
    <>
      <div className="content-header">
        <div className="content-header-row">
          <BackButton href="/settings/integrations" label="Back to integrations" />
        </div>
        <h1>Jobber</h1>
      </div>
      <section className="content">
        {successMessage ? (
          <div className="mb-4 rounded bg-[#dff0d8] px-3 py-2 text-sm text-[#3c763d]">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mb-4 rounded bg-[#f2dede] px-3 py-2 text-sm text-[#a94442]">
            {errorMessage}
          </div>
        ) : null}

        <div className="box box-primary">
          <div className="box-header">Connection</div>
          <div className="box-body space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`chip ${connection ? "chip-ok" : "chip-muted"}`}
              >
                {connection ? "Connected" : "Not connected"}
              </span>
              {!configured ? (
                <span className="chip chip-warn">Credentials missing</span>
              ) : null}
            </div>

            {connection ? (
              <dl className="detail-grid">
                <div>
                  <dt>Account</dt>
                  <dd>{connection.accountName || "Jobber account"}</dd>
                </div>
                <div>
                  <dt>Account ID</dt>
                  <dd className="font-mono text-xs">{connection.accountId || "—"}</dd>
                </div>
                <div>
                  <dt>Connected</dt>
                  <dd>
                    {format(connection.connectedAt, "MMM d, yyyy h:mm a")}
                  </dd>
                </div>
                <div>
                  <dt>Token refresh</dt>
                  <dd>
                    {connection.expiresAt
                      ? format(connection.expiresAt, "MMM d, yyyy h:mm a")
                      : "Unknown"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="m-0 text-sm text-[#666]">
                Connect Jobber so Pull to Job can offer live job numbers from your
                account instead of typing them by hand.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {configured ? (
                <Link
                  href="/api/integrations/jobber/connect"
                  className="btn-primary no-underline"
                >
                  {connection ? "Reconnect Jobber" : "Connect Jobber"}
                </Link>
              ) : (
                <button type="button" className="btn-primary" disabled>
                  Connect Jobber
                </button>
              )}
              {connection ? (
                <form action={disconnectJobberAction}>
                  <button type="submit" className="btn-ghost">
                    Disconnect
                  </button>
                </form>
              ) : null}
              <Link href="/pull" className="btn-ghost no-underline">
                Open Pull to Job
              </Link>
            </div>
          </div>
        </div>

        <div className="box">
          <div className="box-header">Setup</div>
          <div className="box-body space-y-3 text-sm text-[#555]">
            <ol className="m-0 list-decimal space-y-2 pl-5">
              <li>
                Create an app in the{" "}
                <a
                  href="https://developer.getjobber.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#3c8dbc]"
                >
                  Jobber Developer Center
                </a>
                .
              </li>
              <li>
                Set the OAuth callback URL exactly to:
                <code className="mt-1 block break-all rounded bg-[#f4f4f4] px-2 py-1 font-mono text-xs">
                  {redirectUri}
                </code>
              </li>
              <li>
                Add these environment variables on Vercel (or locally), then redeploy:
                <code className="mt-1 block whitespace-pre-wrap rounded bg-[#f4f4f4] px-2 py-2 font-mono text-xs">
{`JOBBER_CLIENT_ID=...
JOBBER_CLIENT_SECRET=...
JOBBER_REDIRECT_URI=${redirectUri}
JOBBER_API_VERSION=2025-04-16`}
                </code>
              </li>
              <li>
                Grant read access to jobs (and account) on the Jobber app scopes, then
                click Connect above.
              </li>
            </ol>
            <p className="m-0 text-xs text-[#999]">
              Tokens are stored encrypted at rest by your database host. Access tokens
              refresh automatically; disconnect clears them from this WMS.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
