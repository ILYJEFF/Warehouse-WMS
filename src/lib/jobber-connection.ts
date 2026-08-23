import { prisma } from "@/lib/prisma";
import {
  JOBBER_PROVIDER,
  disconnectJobberApp,
  fetchJobberAccount,
  fetchRecentJobberJobs,
  refreshJobberTokens,
  type JobberJobOption,
  type JobberTokens,
} from "@/lib/jobber";

export async function getJobberConnection() {
  return prisma.integrationConnection.findUnique({
    where: { provider: JOBBER_PROVIDER },
  });
}

export async function saveJobberTokens(tokens: JobberTokens) {
  const account = await fetchJobberAccount(tokens.accessToken);
  return prisma.integrationConnection.upsert({
    where: { provider: JOBBER_PROVIDER },
    create: {
      provider: JOBBER_PROVIDER,
      accountId: account.id,
      accountName: account.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: tokens.expiresAt,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
    },
    update: {
      accountId: account.id,
      accountName: account.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: tokens.expiresAt,
      lastSyncAt: new Date(),
    },
  });
}

/** Returns a valid access token, refreshing + rotating refresh token when needed. */
export async function getValidJobberAccessToken() {
  const connection = await getJobberConnection();
  if (!connection) return null;

  const stillFresh =
    connection.expiresAt &&
    connection.expiresAt.getTime() > Date.now() + 60_000;

  if (stillFresh) {
    return { accessToken: connection.accessToken, connection };
  }

  const tokens = await refreshJobberTokens(connection.refreshToken);
  const updated = await prisma.integrationConnection.update({
    where: { provider: JOBBER_PROVIDER },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresAt: tokens.expiresAt,
      lastSyncAt: new Date(),
    },
  });

  return { accessToken: updated.accessToken, connection: updated };
}

export async function clearJobberConnection(notifyJobber = true) {
  const connection = await getJobberConnection();
  if (!connection) return;

  if (notifyJobber) {
    try {
      const valid = await getValidJobberAccessToken();
      if (valid) await disconnectJobberApp(valid.accessToken);
    } catch {
      // Continue local clear.
    }
  }

  await prisma.integrationConnection.delete({
    where: { provider: JOBBER_PROVIDER },
  });
}

export async function listJobberJobsForPull(): Promise<{
  connected: boolean;
  jobs: JobberJobOption[];
  error: string | null;
}> {
  try {
    const valid = await getValidJobberAccessToken();
    if (!valid) {
      return { connected: false, jobs: [], error: null };
    }
    const jobs = await fetchRecentJobberJobs(valid.accessToken, 50);
    return { connected: true, jobs, error: null };
  } catch (error) {
    return {
      connected: true,
      jobs: [],
      error: error instanceof Error ? error.message : "Could not load Jobber jobs",
    };
  }
}
