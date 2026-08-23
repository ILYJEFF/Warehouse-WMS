import { createHash, randomBytes } from "crypto";

export const JOBBER_PROVIDER = "jobber";
export const JOBBER_AUTHORIZE_URL = "https://api.getjobber.com/api/oauth/authorize";
export const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
export const JOBBER_GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
export const JOBBER_API_VERSION =
  process.env.JOBBER_API_VERSION?.trim() || "2025-04-16";

export const JOBBER_OAUTH_STATE_COOKIE = "wms_jobber_oauth";

export type JobberTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: Date | null;
};

export type JobberJobOption = {
  id: string;
  jobNumber: string | null;
  title: string | null;
  clientName: string | null;
  label: string;
};

export function jobberConfigured() {
  return Boolean(
    process.env.JOBBER_CLIENT_ID?.trim() &&
      process.env.JOBBER_CLIENT_SECRET?.trim(),
  );
}

export function jobberRedirectUri() {
  const explicit = process.env.JOBBER_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    throw new Error("APP_URL or JOBBER_REDIRECT_URI is required for Jobber OAuth");
  }
  return `${appUrl}/api/integrations/jobber/callback`;
}

function base64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair() {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createOAuthState() {
  return base64Url(randomBytes(24));
}

export function buildJobberAuthorizeUrl(input: {
  state: string;
  codeChallenge: string;
}) {
  const clientId = process.env.JOBBER_CLIENT_ID?.trim();
  if (!clientId) throw new Error("JOBBER_CLIENT_ID is not set");

  const url = new URL(JOBBER_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", jobberRedirectUri());
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<JobberTokens> {
  const clientId = process.env.JOBBER_CLIENT_ID?.trim();
  const clientSecret = process.env.JOBBER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Jobber client credentials are not configured");
  }

  const payload = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    ...body,
  });

  const res = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token || !json.refresh_token) {
    throw new Error(
      json.error_description ||
        json.error ||
        `Jobber token request failed (${res.status})`,
    );
  }

  const expiresAt =
    typeof json.expires_in === "number"
      ? new Date(Date.now() + json.expires_in * 1000)
      : null;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    tokenType: json.token_type || "Bearer",
    expiresAt,
  };
}

export async function exchangeJobberCode(code: string, codeVerifier: string) {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: jobberRedirectUri(),
    code_verifier: codeVerifier,
  });
}

export async function refreshJobberTokens(refreshToken: string) {
  return tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function jobberGraphql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(JOBBER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-JOBBER-GRAPHQL-VERSION": JOBBER_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (!res.ok) {
    throw new Error(`Jobber GraphQL HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message || "GraphQL error").join("; "));
  }
  if (!json.data) {
    throw new Error("Jobber GraphQL returned no data");
  }
  return json.data;
}

export async function fetchJobberAccount(accessToken: string) {
  const data = await jobberGraphql<{
    account: { id: string; name: string };
  }>(
    accessToken,
    `query Account {
      account {
        id
        name
      }
    }`,
  );
  return data.account;
}

export async function disconnectJobberApp(accessToken: string) {
  try {
    await jobberGraphql(
      accessToken,
      `mutation Disconnect {
        appDisconnect {
          userErrors { message }
        }
      }`,
    );
  } catch {
    // Local disconnect still proceeds if Jobber rejects (already disconnected).
  }
}

type JobsQueryResult = {
  jobs?: {
    nodes?: Array<{
      id: string;
      jobNumber?: number | string | null;
      title?: string | null;
      client?: { name?: string | null } | null;
    } | null> | null;
  } | null;
};

export async function fetchRecentJobberJobs(
  accessToken: string,
  first = 40,
): Promise<JobberJobOption[]> {
  const queries = [
    `query RecentJobs($first: Int!) {
      jobs(first: $first) {
        nodes {
          id
          jobNumber
          title
          client {
            name
          }
        }
      }
    }`,
    `query RecentJobs($first: Int!) {
      jobs(first: $first) {
        nodes {
          id
          jobNumber
          title
        }
      }
    }`,
  ];

  let lastError: unknown = null;
  for (const query of queries) {
    try {
      const data = await jobberGraphql<JobsQueryResult>(accessToken, query, {
        first,
      });
      const nodes = data.jobs?.nodes ?? [];
      return nodes
        .filter((node): node is NonNullable<typeof node> => Boolean(node?.id))
        .map((node) => {
          const jobNumber =
            node.jobNumber === null || node.jobNumber === undefined
              ? null
              : String(node.jobNumber);
          const title = node.title?.trim() || null;
          const clientName = node.client?.name?.trim() || null;
          const parts = [
            jobNumber ? `#${jobNumber}` : null,
            title,
            clientName ? `(${clientName})` : null,
          ].filter(Boolean);
          return {
            id: node.id,
            jobNumber,
            title,
            clientName,
            label: parts.join(" ") || node.id,
          };
        });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not load Jobber jobs");
}
